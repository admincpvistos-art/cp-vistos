import { format } from "date-fns";
import { Category, Form, Profile, StatusForm, VisaClass } from "@prisma/client";

import { buildLegacyPostalAddress } from "@/lib/form-postal-address";
import {
  joinPersonName,
  normalizeTravelCompanion,
  splitPersonName,
} from "@/lib/person-name";

export const CEAC_URL = "https://ceac.state.gov/GenNIV/Default.aspx";

export const CEAC_PAGES = [
  { id: "personal1", title: "Personal Information 1", subtitle: "Dados pessoais" },
  { id: "personal2", title: "Personal Information 2", subtitle: "Nacionalidade e documentos" },
  { id: "address", title: "Address and Phone", subtitle: "Endereço e contatos" },
  { id: "passport", title: "Passport Information", subtitle: "Passaporte" },
  { id: "travel", title: "Travel", subtitle: "Sobre a viagem" },
  { id: "companions", title: "Travel Companions", subtitle: "Acompanhante da viagem" },
  { id: "previous", title: "Previous U.S. Travel", subtitle: "Viagens anteriores" },
  { id: "uscontact", title: "U.S. Point of Contact", subtitle: "Contato nos EUA" },
  { id: "family", title: "Family", subtitle: "Família" },
  { id: "work", title: "Work / Education / Training", subtitle: "Trabalho e educação" },
  { id: "additional", title: "Additional Information", subtitle: "Informações adicionais" },
  { id: "security", title: "Security and Background", subtitle: "Segurança" },
] as const;

export type CeacPageId = (typeof CEAC_PAGES)[number]["id"];

export type CeacField = {
  id: string;
  label: string;
  hint?: string;
  /** Valor exibido / copiado (datas em dd/mmm/yyyy). */
  value: string;
  /** Valor enviado ao CEAC; se omitido, usa `value`. */
  transferValue?: string;
};

const MONTHS_PT_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export type Ds160Packet = {
  profile: Pick<
    Profile,
    | "id"
    | "name"
    | "category"
    | "statusForm"
    | "formLocked"
    | "visaClass"
    | "visaType"
    | "DSNumber"
    | "protocol"
    | "ds160ReviewStatus"
    | "ds160ReviewedPages"
    | "formReturnNote"
    | "updatedAt"
  >;
  user: {
    name: string;
    email: string;
    group: string | null;
    cpf: string | null;
  };
  form: Form | null;
};

function upper(value?: string | null) {
  return value?.trim() ? value.trim().toUpperCase() : "";
}

function yesNo(value?: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

function dna(value?: string | null) {
  const text = value?.trim();
  return text ? text : "Does Not Apply";
}

function parseDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Formato CEAC (transferência automática). */
function ceacDate(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) return "";
  return format(date, "MM/dd/yyyy");
}

/** Formato para copiar/colar manual no Preencher DS-160 (ex.: 01/ago/2026). */
function displayDate(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_PT_SHORT[date.getMonth()];
  return `${day}/${month}/${date.getFullYear()}`;
}

function parentParts(form: Form, which: "father" | "mother") {
  const firstStored = which === "father" ? form.fatherFirstName : form.motherFirstName;
  const lastStored = which === "father" ? form.fatherLastName : form.motherLastName;
  const complete = which === "father" ? form.fatherCompleteName : form.motherCompleteName;
  const split = splitPersonName(complete);
  return {
    firstName: firstStored?.trim() || split.firstName,
    lastName: lastStored?.trim() || split.lastName,
  };
}

function formatPreviousJob(
  job: PrismaJson.previousJobsType,
  dateFmt: (value?: Date | string | null) => string,
) {
  return [
    upper(job.companyName),
    upper(job.companyAddress),
    upper(job.companyCity),
    upper(job.companyState),
    job.companyCountry,
    job.companyCep,
    job.companyTel,
    job.office,
    upper(job.supervisorName),
    [dateFmt(job.admissionDate), dateFmt(job.resignationDate)].filter(Boolean).join("-"),
    job.jobDescription,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" / ");
}

function formatCourse(
  course: PrismaJson.coursesType,
  dateFmt: (value?: Date | string | null) => string,
) {
  return [
    upper(course.institutionName),
    upper(course.address),
    course.cep,
    upper(course.city),
    upper(course.state),
    course.country,
    course.courseName,
    [dateFmt(course.initialDate), dateFmt(course.finishDate)].filter(Boolean).join("-"),
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" / ");
}

function visaClassLabel(value?: VisaClass | null) {
  switch (value) {
    case "B1":
      return "B1 - BUSINESS";
    case "B2_B1":
      return "B1/B2 - TOURISM/BUSINESS";
    case "O1":
      return "O1";
    case "O2":
      return "O2";
    case "O3":
      return "O3";
    default:
      return "";
  }
}

function passportTypeLabel(value?: string | null) {
  switch (value) {
    case "Oficial":
      return "Official";
    case "Diplomático":
      return "Diplomatic";
    case "Outro":
      return "Other";
    default:
      return "Regular";
  }
}

function field(
  id: string,
  label: string,
  value: string,
  hint?: string,
  transferValue?: string,
): CeacField {
  return {
    id,
    label,
    hint,
    value,
    ...(transferValue !== undefined ? { transferValue } : {}),
  };
}

export function buildCeacPages(packet: Ds160Packet): Record<CeacPageId, CeacField[]> {
  const form = packet.form;
  const profile = packet.profile;
  const empty: CeacField[] = [];

  if (!form) {
    return {
      personal1: empty,
      personal2: empty,
      address: empty,
      passport: empty,
      travel: empty,
      companions: empty,
      previous: empty,
      uscontact: empty,
      family: empty,
      work: empty,
      additional: empty,
      security: empty,
    };
  }

  const otherNames = (form.otherNames ?? []).filter(Boolean);
  const otherTels = (form.otherTel ?? []).filter(Boolean);
  const languages = (form.languages ?? []).filter(Boolean);
  const travels = (form.fiveYearsOtherCountryTravels ?? []).filter(Boolean);
  const orgs = (form.socialOrganization ?? []).filter(Boolean);
  const companions = ((form.otherPeopleTraveling ?? []) as PrismaJson.otherPeopleTravelingType[]).map(
    normalizeTravelCompanion,
  );
  const usaTravel = (form.USALastTravel ?? []) as PrismaJson.USALastTravelType[];
  const familyUsa = (form.familyLivingInTheUSA ?? []) as PrismaJson.familyLivingInTheUSAType[];
  const previousJobs = (form.previousJobs ?? []) as PrismaJson.previousJobsType[];
  const courses = (form.courses ?? []) as PrismaJson.coursesType[];
  const license = form.americanLicense as PrismaJson.americanLicenseType | null;

  return {
    personal1: [
      field("surnames", "Surnames (as in passport)", upper(form.lastName)),
      field("given", "Given Names (as in passport)", upper(form.firstName)),
      field("native", "Full Name in Native Alphabet", dna(form.fullNameNative)),
      field("otherNamesQ", "Have you ever used other names?", yesNo(form.otherNamesConfirmation)),
      field("otherNames", "Other Names", otherNames.map(upper).join(" | ")),
      field("telecode", "Telecode that represents your name?", yesNo(form.warNameConfirmation)),
      field("warName", "War name / telecode", form.warName ?? ""),
      field("sex", "Sex", form.sex === "Feminino" ? "Female" : form.sex === "Masculino" ? "Male" : ""),
      field("marital", "Marital Status", form.maritalStatus ?? ""),
      field("dob", "Date of Birth", displayDate(form.birthDate), undefined, ceacDate(form.birthDate)),
      field("birthCity", "City of Birth", upper(form.birthCity)),
      field("birthState", "State/Province of Birth", upper(form.birthState)),
      field("birthCountry", "Country/Region of Birth", form.birthCountry ?? ""),
    ],
    personal2: [
      field("nationality", "Country/Region of Origin (Nationality)", form.originCountry ?? ""),
      field("otherNatQ", "Other nationality?", yesNo(form.otherNationalityConfirmation)),
      field("otherNat", "Other nationality country", form.otherNationalityCountry ?? ""),
      field("otherNatPass", "Passport of other nationality", form.otherNationalityPassport ?? ""),
      field("otherResQ", "Permanent resident of another country?", yesNo(form.otherCountryResidentConfirmation)),
      field("otherRes", "Other country of residence", form.otherCountryResident ?? ""),
      field("nationalId", "National Identification Number", dna(form.cpf ?? packet.user.cpf), "CPF"),
      field("ssn", "U.S. Social Security Number", dna(form.USSocialSecurityNumber)),
      field("itin", "U.S. Taxpayer ID Number", dna(form.USTaxpayerIDNumber)),
    ],
    address: [
      field(
        "street",
        "Street Address",
        upper([form.address, form.addressNumber, form.complement, form.district].filter(Boolean).join(", ")),
      ),
      field("city", "City", upper(form.city)),
      field("state", "State/Province", upper(form.state)),
      field("postal", "Postal Zone / ZIP Code", form.cep ?? ""),
      field("country", "Country/Region", form.country ?? ""),
      field("mailingQ", "Mailing address different from home?", yesNo(form.postalAddressConfirmation)),
      field(
        "mailingStreet",
        "Mailing Street Address",
        upper(
          [form.postalStreet, form.postalAddressNumber, form.postalComplement, form.postalDistrict]
            .filter(Boolean)
            .join(", "),
        ),
      ),
      field("mailingCity", "Mailing City", upper(form.postalCity)),
      field("mailingState", "Mailing State/Province", upper(form.postalState)),
      field("mailingPostal", "Mailing Postal Zone / ZIP", form.postalCep ?? ""),
      field("mailingCountry", "Mailing Country/Region", form.postalCountry ?? ""),
      field(
        "mailing",
        "Mailing address",
        form.otherPostalAddress ?? buildLegacyPostalAddress(form),
      ),
      field("primaryPhone", "Primary Phone Number", form.cel ?? ""),
      field("secondaryPhone", "Secondary Phone Number", dna(form.tel)),
      field("workPhone", "Work Phone Number", dna(form.workPhone)),
      field("email", "Email Address", form.email ?? ""),
      field("otherPhoneQ", "Additional phones in last 5 years?", yesNo(form.fiveYearsOtherTelConfirmation)),
      field("otherPhones", "Additional phones", otherTels.join(" | ")),
      field("otherEmailQ", "Additional emails in last 5 years?", yesNo(form.fiveYearsOtherEmailConfirmation)),
      field("otherEmail", "Additional email", form.otherEmail ?? ""),
      field("facebook", "Social media - Facebook", form.facebook ?? ""),
      field("instagram", "Social media - Instagram", form.instagram ?? ""),
      field("linkedin", "Social media - LinkedIn", form.linkedin ?? ""),
      field("otherSocial", "Other social media", form.othersSocialMedia ?? ""),
    ],
    passport: [
      field("pptType", "Passport/Travel Document Type", passportTypeLabel(form.passportDocumentType)),
      field("pptNumber", "Passport Number", upper(form.passportNumber)),
      field("bookNumber", "Passport Book Number", dna(form.bookNumber)),
      field("pptCountry", "Country/Authority that Issued Passport", form.passportIssuingCountry ?? ""),
      field("pptCity", "City where issued", upper(form.passportCity)),
      field("pptState", "State/Province where issued", upper(form.passportState)),
      field("pptIssue", "Issuance Date", displayDate(form.passportIssuingDate), undefined, ceacDate(form.passportIssuingDate)),
      field("pptExpire", "Expiration Date", displayDate(form.passportExpireDate), undefined, ceacDate(form.passportExpireDate)),
      field("lostQ", "Lost or stolen passport?", yesNo(form.passportLostConfirmation)),
      field("lostNumber", "Lost passport number", form.lostPassportNumber ?? ""),
      field("lostCountry", "Lost passport country", form.lostPassportCountry ?? ""),
      field("lostDetails", "Lost passport explanation", form.lostPassportDetails ?? ""),
    ],
    travel: [
      field("purpose", "Purpose of Trip to the U.S.", visaClassLabel(profile.visaClass)),
      field("plansQ", "Have you made specific travel plans?", yesNo(form.travelItineraryConfirmation)),
      field("arriveDate", "Intended Date of Arrival", displayDate(form.USAPreviewArriveDate), undefined, ceacDate(form.USAPreviewArriveDate)),
      field("arriveFlight", "Arrival Flight", form.arriveFlyNumber ?? ""),
      field("arriveCity", "Arrival City", upper(form.arriveCity)),
      field("departDate", "Intended Date of Departure", displayDate(form.USAPreviewReturnDate), undefined, ceacDate(form.USAPreviewReturnDate)),
      field("departFlight", "Departure Flight", form.returnFlyNumber ?? ""),
      field("departCity", "Departure City", upper(form.returnCity)),
      field("length", "Intended Length of Stay", form.estimatedTimeOnUSA ?? ""),
      field("locations", "Locations you will visit", form.visitLocations ?? ""),
      field("stayQ", "Do you have the U.S. stay address?", yesNo(form.hasAddressInUSA)),
      field("stayAddress", "Street Address in the U.S.", upper(form.USACompleteAddress)),
      field("stayZip", "ZIP Code", form.USAZipCode ?? ""),
      field("stayCity", "City", upper(form.USACity)),
      field("stayState", "State", form.USAState ?? ""),
      field("payer", "Person/Entity Paying for Trip", form.payer ?? ""),
      field("payerName", "Payer Name / Company", upper(form.payerNameOrCompany)),
      field("payerTel", "Payer Phone", form.payerTel ?? ""),
      field("payerAddress", "Payer Address", form.payerAddress ?? ""),
      field("payerRelation", "Relationship to You", form.payerRelation ?? ""),
      field("payerEmail", "Payer Email", form.payerEmail ?? ""),
    ],
    companions: [
      field("othersQ", "Are there other persons traveling with you?", yesNo(form.otherPeopleTravelingConfirmation)),
      field(
        "others",
        "Travel companions",
        companions
          .map((item) => {
            const full = joinPersonName(item.firstName, item.lastName) || item.name;
            return `${upper(full)} — ${item.relation}`;
          })
          .join(" | "),
      ),
      ...companions.flatMap((item, index) => {
        const n = index + 1;
        return [
          field(`companion${n}Given`, `Companion ${n} Given Names`, upper(item.firstName)),
          field(`companion${n}Surname`, `Companion ${n} Surnames`, upper(item.lastName)),
          field(`companion${n}Relation`, `Companion ${n} Relationship`, item.relation ?? ""),
        ];
      }),
      field("groupQ", "Traveling as part of a group or organization?", yesNo(form.groupMemberConfirmation)),
      field("groupName", "Group Name", form.groupName ?? ""),
    ],
    previous: [
      field("beenQ", "Have you ever been in the U.S.?", yesNo(form.hasBeenOnUSAConfirmation)),
      field(
        "been",
        "Previous U.S. visits",
        usaTravel
          .map((item) => `${displayDate(item.arriveDate)} — ${item.estimatedTime}`)
          .join(" | "),
        undefined,
        usaTravel
          .map((item) => `${ceacDate(item.arriveDate)} — ${item.estimatedTime}`)
          .join(" | "),
      ),
      field("licenseQ", "U.S. driver license?", yesNo(form.americanLicenseToDriveConfirmation)),
      field("license", "License number / state", license ? `${license.licenseNumber} / ${license.state}` : ""),
      field("visaQ", "Ever issued a U.S. visa?", yesNo(form.USAVisaConfirmation)),
      field("visaDate", "Last visa issued", displayDate(form.visaIssuingDate), undefined, ceacDate(form.visaIssuingDate)),
      field("visaNumber", "Visa Number", form.visaNumber ?? ""),
      field("stillHaveVisaQ", "Do you still have this visa?", yesNo(form.alreadyHaveVisa)),
      field("newVisaQ", "Applying from same country/location as previous visa?", yesNo(form.newVisaConfirmation)),
      field("sameType", "Applying for same visa type?", yesNo(form.sameVisaTypeConfirmation)),
      field("sameCountry", "Same country of issuance?", yesNo(form.sameCountryResidenceConfirmation)),
      field("tenPrint", "Ten printed / fingerprints provided?", yesNo(form.fingerprintsProvidedConfirmation)),
      field("lostVisaQ", "Visa lost or stolen?", yesNo(form.lostVisaConfirmation)),
      field("lostVisa", "Lost visa explanation", form.lostVisaDetails ?? ""),
      field("canceledQ", "Visa cancelled or revoked?", yesNo(form.canceledVisaConfirmation)),
      field("canceled", "Cancelled visa explanation", form.canceledVisaDetails ?? ""),
      field("deniedQ", "Visa refused / admission refused?", yesNo(form.deniedVisaConfirmation)),
      field("denied", "Refusal explanation", form.deniedVisaDetails ?? ""),
      field("consularPost", "Consular post where visa was denied", form.consularPost ?? ""),
      field("deniedVisaType", "Type of visa denied", form.deniedVisaType ?? ""),
      field("estaQ", "ESTA denied?", yesNo(form.ESTAVisaDeniedConfirmation)),
      field("petitionQ", "Immigrant petition filed on your behalf?", yesNo(form.immigrationRequestByAnotherPersonConfirmation)),
      field("petition", "Petition explanation", form.immigrationRequestByAnotherPersonDetails ?? ""),
    ],
    uscontact: [
      field("hasContact", "Do you have a U.S. point of contact?", yesNo(form.hasUSAOrganizationOrResident)),
      field("contactName", "Contact Name / Organization", upper(form.organizationOrUSAResidentName)),
      field("contactRel", "Relationship", form.organizationOrUSAResidentRelation ?? ""),
      field("contactAddress", "Street Address", form.organizationOrUSAResidentAddress ?? ""),
      field("contactZip", "ZIP Code", form.organizationOrUSAResidentZipCode ?? ""),
      field("contactCity", "City", upper(form.organizationOrUSAResidentCity)),
      field("contactState", "State", form.organizationOrUSAResidentState ?? ""),
      field("contactTel", "Phone", form.organizationOrUSAResidentTel ?? ""),
      field("contactEmail", "Email", form.organizationOrUSAResidentEmail ?? ""),
    ],
    family: [
      field("fatherGiven", "Father Given Names", upper(parentParts(form, "father").firstName)),
      field("fatherSurname", "Father Surnames", upper(parentParts(form, "father").lastName)),
      field("fatherDob", "Father Date of Birth", displayDate(form.fatherBirthdate), undefined, ceacDate(form.fatherBirthdate)),
      field("fatherUsa", "Is your father in the U.S.?", yesNo(form.fatherLiveInTheUSAConfirmation)),
      field("fatherStatus", "Father U.S. status", form.fatherUSASituation ?? ""),
      field("motherGiven", "Mother Given Names", upper(parentParts(form, "mother").firstName)),
      field("motherSurname", "Mother Surnames", upper(parentParts(form, "mother").lastName)),
      field("motherDob", "Mother Date of Birth", displayDate(form.motherBirthdate), undefined, ceacDate(form.motherBirthdate)),
      field("motherUsa", "Is your mother in the U.S.?", yesNo(form.motherLiveInTheUSAConfirmation)),
      field("motherStatus", "Mother U.S. status", form.motherUSASituation ?? ""),
      field("relativesQ", "Immediate relatives in the U.S.?", yesNo(form.familyLivingInTheUSAConfirmation)),
      field(
        "relatives",
        "Relatives in the U.S.",
        familyUsa.map((item) => `${upper(item.name)} — ${item.relation} — ${item.situation}`).join(" | "),
      ),
      field("spouseName", "Spouse / Partner Full Name", upper(form.partnerCompleteName)),
      field("spouseDob", "Spouse Date of Birth", displayDate(form.partnerBirthdate), undefined, ceacDate(form.partnerBirthdate)),
      field("spouseNat", "Spouse Nationality", form.partnerNationality ?? ""),
      field("spouseCity", "Spouse City of Birth", upper(form.partnerCity)),
      field("spouseState", "Spouse State of Birth", upper(form.partnerState)),
      field("spouseCountry", "Spouse Country of Birth", form.partnerCountry ?? ""),
      field("unionDate", "Date of Marriage / Union", displayDate(form.unionDate), undefined, ceacDate(form.unionDate)),
      field("divorceDate", "Date of Divorce / Separation", displayDate(form.divorceDate), undefined, ceacDate(form.divorceDate)),
    ],
    work: [
      field("occupation", "Primary Occupation", form.occupation ?? ""),
      field("employer", "Present Employer or School Name", upper(form.companyOrBossName)),
      field("jobTitle", "Job Title", form.office ?? ""),
      field(
        "employerAddress",
        "Employer Address",
        [form.companyAddress, form.companyCity, form.companyState, form.companyCountry, form.companyCep]
          .filter(Boolean)
          .join(", "),
      ),
      field("employerTel", "Employer Phone", form.companyTel ?? ""),
      field("startDate", "Start Date", displayDate(form.admissionDate), undefined, ceacDate(form.admissionDate)),
      field("retireeDate", "Retirement Date", displayDate(form.retireeDate), undefined, ceacDate(form.retireeDate)),
      field("salary", "Monthly Income", form.monthlySalary ?? ""),
      field("duties", "Briefly describe your duties", form.jobDetails ?? ""),
      field("prevQ", "Were you previously employed?", yesNo(form.previousJobConfirmation)),
      ...previousJobs.map((job, index) =>
        field(
          `prevJob${index + 1}`,
          `Previous employer ${index + 1}`,
          formatPreviousJob(job, displayDate),
          undefined,
          formatPreviousJob(job, ceacDate),
        ),
      ),
      ...courses.map((course, index) =>
        field(
          `education${index + 1}`,
          `Education ${index + 1}`,
          formatCourse(course, displayDate),
          undefined,
          formatCourse(course, ceacDate),
        ),
      ),
    ],
    additional: [
      field("tribeQ", "Clan or tribe?", yesNo(form.tribeParticipateConfirmation)),
      field("languages", "Languages spoken", languages.join(" | ")),
      field("travelQ", "Traveled to other countries in last 5 years?", yesNo(form.fiveYearsOtherCountryTravelsConfirmation)),
      field("travelList", "Countries visited", travels.join(" | ")),
      field("orgQ", "Belonged to any organization?", yesNo(form.socialOrganizationConfirmation)),
      field("orgs", "Organizations", orgs.join(" | ")),
      field("weaponQ", "Specialized skills / firearms training?", yesNo(form.weaponTrainingConfirmation)),
      field("weapon", "Training explanation", form.weaponTrainingDetails ?? ""),
      field("militaryQ", "Served in the military?", yesNo(form.militaryServiceConfirmation)),
      field("militaryCountry", "Military country", form.militaryServiceCountry ?? ""),
      field("militaryLocal", "Military location", form.militaryServiceLocal ?? ""),
      field("militaryRank", "Rank", form.militaryServicePatent ?? ""),
      field("militarySpec", "Specialty", form.militaryServiceSpecialty ?? ""),
      field("militaryStart", "Military start", displayDate(form.militaryServiceStartDate), undefined, ceacDate(form.militaryServiceStartDate)),
      field("militaryEnd", "Military end", displayDate(form.militaryServiceEndDate), undefined, ceacDate(form.militaryServiceEndDate)),
      field("insurgentQ", "Served in insurgent / rebel group?", yesNo(form.insurgencyOrganizationConfirmation)),
      field("insurgent", "Insurgent explanation", form.insurgencyOrganizationDetails ?? ""),
    ],
    security: [
      field("diseaseQ", "Communicable disease?", yesNo(form.contagiousDiseaseConfirmation)),
      field("disease", "Disease explanation", form.contagiousDiseaseConfirmationDetails ?? ""),
      field("mentalQ", "Physical or mental disorder?", yesNo(form.phisicalMentalProblemConfirmation)),
      field("mental", "Disorder explanation", form.phisicalMentalProblemConfirmationDetails ?? ""),
      field("crimeQ", "Arrested or convicted?", yesNo(form.crimeConfirmation)),
      field("crime", "Crime explanation", form.crimeConfirmationDetails ?? ""),
      field("drugsQ", "Controlled substance problem?", yesNo(form.drugsProblemConfirmation)),
      field("drugs", "Drugs explanation", form.drugsProblemConfirmationDetails ?? ""),
      field("lawQ", "Violated a law?", yesNo(form.lawViolateConfirmation)),
      field("law", "Law explanation", form.lawViolateConfirmationDetails ?? ""),
      field("prostitutionQ", "Prostitution?", yesNo(form.prostitutionConfirmation)),
      field("prostitution", "Prostitution explanation", form.prostitutionConfirmationDetails ?? ""),
      field("laundryQ", "Money laundering?", yesNo(form.moneyLaundryConfirmation)),
      field("laundry", "Money laundering explanation", form.moneyLaundryConfirmationDetails ?? ""),
      field("trafficQ", "Human trafficking?", yesNo(form.peopleTrafficConfirmation)),
      field("traffic", "Trafficking explanation", form.peopleTrafficConfirmationDetails ?? ""),
      field("spyQ", "Espionage / illegal activity?", yesNo(form.spyConfirmation)),
      field("spy", "Espionage explanation", form.spyConfirmationDetails ?? ""),
      field("terrorQ", "Terrorist activity?", yesNo(form.terrorismConfirmation)),
      field("terror", "Terror explanation", form.terrorismConfirmationDetails ?? ""),
      field("genocideQ", "Genocide?", yesNo(form.genocideConfirmation)),
      field("genocide", "Genocide explanation", form.genocideConfirmationDetails ?? ""),
      field("tortureQ", "Torture?", yesNo(form.tortureConfirmation)),
      field("torture", "Torture explanation", form.tortureConfirmationDetails ?? ""),
      field("fraudQ", "Visa fraud?", yesNo(form.visaFraudConfirmation)),
      field("fraud", "Visa fraud explanation", form.visaFraudConfirmationDetails ?? ""),
      field("deportedQ", "Removed / deported?", yesNo(form.deportedConfirmation)),
      field("deported", "Deportation explanation", form.deportedConfirmationDetails ?? ""),
      field("helpTrafficQ", "Aided human trafficking?", yesNo(form.helpPeopleTrafficConfirmation)),
      field("helpTraffic", "Trafficking aid explanation", form.helpPeopleTrafficConfirmationDetails ?? ""),
      field("parentTrafficQ", "Parent/spouse aided trafficking?", yesNo(form.parentPeopleTrafficConfirmation)),
      field("parentTraffic", "Parent trafficking explanation", form.parentPeopleTrafficConfirmationDetails ?? ""),
      field("financialQ", "Received financial assistance for terrorism?", yesNo(form.financialAssistanceConfirmation)),
      field("financial", "Financial assistance explanation", form.financialAssistanceConfirmationDetails ?? ""),
      field("terrorMemberQ", "Member of terrorist organization?", yesNo(form.terrorismMemberConfirmation)),
      field("terrorMember", "Terrorism member explanation", form.terrorismMemberConfirmationDetails ?? ""),
      field("parentTerrorQ", "Parent/spouse in terrorist organization?", yesNo(form.parentTerrorismConfirmation)),
      field("parentTerror", "Parent terrorism explanation", form.parentTerrorismConfirmationDetails ?? ""),
      field("assassinQ", "Committed assassination?", yesNo(form.assassinConfirmation)),
      field("assassin", "Assassination explanation", form.assassinConfirmationDetails ?? ""),
      field("childSoldierQ", "Recruited child soldiers?", yesNo(form.childSoldierConfirmation)),
      field("childSoldier", "Child soldier explanation", form.childSoldierConfirmationDetails ?? ""),
      field("religionQ", "Violated religious freedom?", yesNo(form.religionLibertyConfirmation)),
      field("religion", "Religious freedom explanation", form.religionLibertyConfirmationDetails ?? ""),
      field("abortQ", "Forced abortion or sterilization?", yesNo(form.abortConfirmation)),
      field("abort", "Abortion/sterilization explanation", form.abortConfirmationDetails ?? ""),
      field("transplantQ", "Coercive organ transplantation?", yesNo(form.coerciveTransplantConfirmation)),
      field("transplant", "Transplantation explanation", form.coerciveTransplantConfirmationDetails ?? ""),
      field("custodyQ", "Child custody violation?", yesNo(form.childCustodyConfirmation)),
      field("custody", "Custody violation explanation", form.childCustodyConfirmationDetails ?? ""),
      field("lawViolationQ", "Violated U.S. law while in U.S.?", yesNo(form.lawViolationConfirmation)),
      field("lawViolation", "U.S. law violation explanation", form.lawViolationConfirmationDetails ?? ""),
      field("avoidTaxQ", "Avoided U.S. taxes?", yesNo(form.avoidTaxConfirmation)),
      field("avoidTax", "Tax avoidance explanation", form.avoidTaxConfirmationDetails ?? ""),
    ],
  };
}

export function reviewStatusLabel(status?: string | null, statusForm?: StatusForm | null) {
  if (status === "returned" || (statusForm === StatusForm.filling && status === "returned")) {
    return "Devolvido";
  }
  if (status === "ready") return "Conferido";
  if (status === "filling") return "Preenchendo DS-160";
  if (statusForm === StatusForm.filled) return "Aguardando conferência";
  return "Em preenchimento";
}

export function isVisaProfile(category: Category) {
  return category === Category.american_visa;
}
