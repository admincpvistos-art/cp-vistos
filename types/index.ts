import { Comments, Form, NullableListFilter, Profile, User } from "@prisma/client";

declare global {
  namespace PrismaJson {
    type otherPeopleTravelingType = {
      firstName: string;
      lastName: string;
      relation: string;
      /** Nome completo legado (sincronizado com firstName + lastName). */
      name?: string;
    };

    type USALastTravelType = {
      arriveDate: Date | null;
      estimatedTime: string;
    };

    type americanLicenseType = {
      licenseNumber: string;
      state: string;
    };

    type familyLivingInTheUSAType = {
      name: string;
      relation: string;
      situation: string;
    };

    type previousJobsType = {
      companyName: string;
      companyAddress: string;
      companyCity: string;
      companyState: string;
      companyCountry: string;
      companyCep: string;
      companyTel: string;
      office: string;
      supervisorName: string;
      admissionDate: Date | null;
      resignationDate: Date | null;
      jobDescription: string;
    };

    type coursesType = {
      institutionName: string;
      address: string;
      city: string;
      state: string;
      country: string;
      cep: string;
      courseName: string;
      initialDate: Date | null;
      finishDate: Date | null;
    };
  }
}

export type PersonalDataFormType = {
  firstName: string | null;
  lastName: string | null;
  cpf: string | null;
  warNameConfirmation: boolean | null;
  warName: string | null;
  fullNameNative: string | null;
  otherNamesConfirmation: boolean | null;
  otherNames: string[];
  sex: string | null;
  maritalStatus: string | null;
  birthDate: Date | null;
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;
  originCountry: string | null;
  ESTAVisaDeniedConfirmation: boolean | null;
  otherNationalityConfirmation: boolean | null;
  otherNationalityPassport: string | null;
  otherNationalityCountry: string | null;
  otherCountryResidentConfirmation: boolean | null;
  otherCountryResident: string | null;
  USSocialSecurityNumber: string | null;
  USTaxpayerIDNumber: string | null;
};

export type ContactAndAddressFormType = {
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  country: string | null;
  postalAddressConfirmation: boolean | null;
  otherPostalAddress: string | null;
  postalStreet: string | null;
  postalAddressNumber: string | null;
  postalComplement: string | null;
  postalDistrict: string | null;
  postalCity: string | null;
  postalState: string | null;
  postalCep: string | null;
  postalCountry: string | null;
  cel: string | null;
  tel: string | null;
  workPhone: string | null;
  fiveYearsOtherTelConfirmation: boolean | null;
  otherTel: string[];
  email: string | null;
  fiveYearsOtherEmailConfirmation: boolean | null;
  otherEmail: string | null;
  facebook: string | null;
  linkedin: string | null;
  instagram: string | null;
  othersSocialMedia: string | null;
};

export type PassportFormType = {
  passportNumber: string | null;
  passportDocumentType: string | null;
  bookNumber: string | null;
  passportCity: string | null;
  passportState: string | null;
  passportIssuingCountry: string | null;
  passportIssuingDate: Date | null;
  passportExpireDate: Date | null;
  passportLostConfirmation: boolean | null;
  lostPassportNumber: string | null;
  lostPassportCountry: string | null;
  lostPassportDetails: string | null;
};

export type AboutTravelFormType = {
  travelItineraryConfirmation: boolean | null;
  USAPreviewArriveDate: Date | null;
  arriveFlyNumber: string | null;
  arriveCity: string | null;
  USAPreviewReturnDate: Date | null;
  returnFlyNumber: string | null;
  returnCity: string | null;
  estimatedTimeOnUSA: string | null;
  visitLocations: string | null;
  hasAddressInUSA: boolean | null;
  USACompleteAddress: string | null;
  USAZipCode: string | null;
  USACity: string | null;
  USAState: string | null;
  payer: string | null;
  payerNameOrCompany: string | null;
  payerTel: string | null;
  payerAddress: string | null;
  payerRelation: string | null;
  payerEmail: string | null;
};

export type TravelCompanyFormType = {
  otherPeopleTravelingConfirmation: boolean | null;
  otherPeopleTraveling: PrismaJson.otherPeopleTravelingType[];
  groupMemberConfirmation: boolean | null;
  groupName: string | null;
};

export type PreviousTravelFormType = {
  hasBeenOnUSAConfirmation: boolean | null;
  USALastTravel: PrismaJson.USALastTravelType[];
  americanLicenseToDriveConfirmation: boolean | null;
  americanLicense: PrismaJson.americanLicenseType | null;
  USAVisaConfirmation: boolean | null;
  visaIssuingDate: Date | null;
  visaNumber: string | null;
  alreadyHaveVisa: boolean | null;
  newVisaConfirmation: boolean | null;
  sameCountryResidenceConfirmation: boolean | null;
  sameVisaTypeConfirmation: boolean | null;
  fingerprintsProvidedConfirmation: boolean | null;
  lostVisaConfirmation: boolean | null;
  lostVisaDetails: string | null;
  canceledVisaConfirmation: boolean | null;
  canceledVisaDetails: string | null;
  deniedVisaConfirmation: boolean | null;
  deniedVisaDetails: string | null;
  consularPost: string | null;
  deniedVisaType: string | null;
  immigrationRequestByAnotherPersonConfirmation: boolean | null;
  immigrationRequestByAnotherPersonDetails: string | null;
};

export type USAContactFormType = {
  hasUSAOrganizationOrResident: boolean | null;
  organizationOrUSAResidentName: string | null;
  organizationOrUSAResidentRelation: string | null;
  organizationOrUSAResidentAddress: string | null;
  organizationOrUSAResidentZipCode: string | null;
  organizationOrUSAResidentCity: string | null;
  organizationOrUSAResidentState: string | null;
  organizationOrUSAResidentTel: string | null;
  organizationOrUSAResidentEmail: string | null;
};

export type FamilyFormType = {
  fatherCompleteName: string | null;
  fatherFirstName: string | null;
  fatherLastName: string | null;
  fatherBirthdate: Date | null;
  fatherLiveInTheUSAConfirmation: boolean | null;
  fatherUSASituation: string | null;
  motherCompleteName: string | null;
  motherFirstName: string | null;
  motherLastName: string | null;
  motherBirthdate: Date | null;
  motherLiveInTheUSAConfirmation: boolean | null;
  motherUSASituation: string | null;
  familyLivingInTheUSAConfirmation: boolean | null;
  familyLivingInTheUSA: PrismaJson.familyLivingInTheUSAType[];
  partnerCompleteName: string | null;
  partnerBirthdate: Date | null;
  partnerNationality: string | null;
  partnerCity: string | null;
  partnerState: string | null;
  partnerCountry: string | null;
  unionDate: Date | null;
  divorceDate: Date | null;
  maritalStatus: string | null;
};

export type WorkEducationFormType = {
  occupation: string | null;
  office: string | null;
  companyOrBossName: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyCountry: string | null;
  companyCep: string | null;
  companyTel: string | null;
  admissionDate: Date | null;
  monthlySalary: string | null;
  retireeDate: Date | null;
  jobDetails: string | null;
  previousJobConfirmation: boolean | null;
  previousJobs: PrismaJson.previousJobsType[];
  courses: PrismaJson.coursesType[];
};

export type AdditionalInformationFormType = {
  tribeParticipateConfirmation: boolean | null;
  languages: string[];
  fiveYearsOtherCountryTravelsConfirmation: boolean | null;
  fiveYearsOtherCountryTravels: string[];
  socialOrganizationConfirmation: boolean | null;
  socialOrganization: string[];
  weaponTrainingConfirmation: boolean | null;
  weaponTrainingDetails: string | null;
  militaryServiceConfirmation: boolean | null;
  militaryServiceCountry: string | null;
  militaryServiceLocal: string | null;
  militaryServicePatent: string | null;
  militaryServiceSpecialty: string | null;
  militaryServiceStartDate: Date | null;
  militaryServiceEndDate: Date | null;
  insurgencyOrganizationConfirmation: boolean | null;
  insurgencyOrganizationDetails: string | null;
};

export type SecurityFormType = {
  contagiousDiseaseConfirmation: boolean | null;
  contagiousDiseaseConfirmationDetails: string | null;
  phisicalMentalProblemConfirmation: boolean | null;
  phisicalMentalProblemConfirmationDetails: string | null;
  crimeConfirmation: boolean | null;
  crimeConfirmationDetails: string | null;
  drugsProblemConfirmation: boolean | null;
  drugsProblemConfirmationDetails: string | null;
  lawViolateConfirmation: boolean | null;
  lawViolateConfirmationDetails: string | null;
  prostitutionConfirmation: boolean | null;
  prostitutionConfirmationDetails: string | null;
  moneyLaundryConfirmation: boolean | null;
  moneyLaundryConfirmationDetails: string | null;
  peopleTrafficConfirmation: boolean | null;
  peopleTrafficConfirmationDetails: string | null;
  helpPeopleTrafficConfirmation: boolean | null;
  helpPeopleTrafficConfirmationDetails: string | null;
  parentPeopleTrafficConfirmation: boolean | null;
  parentPeopleTrafficConfirmationDetails: string | null;
  spyConfirmation: boolean | null;
  spyConfirmationDetails: string | null;
  terrorismConfirmation: boolean | null;
  terrorismConfirmationDetails: string | null;
  financialAssistanceConfirmation: boolean | null;
  financialAssistanceConfirmationDetails: string | null;
  terrorismMemberConfirmation: boolean | null;
  terrorismMemberConfirmationDetails: string | null;
  parentTerrorismConfirmation: boolean | null;
  parentTerrorismConfirmationDetails: string | null;
  genocideConfirmation: boolean | null;
  genocideConfirmationDetails: string | null;
  tortureConfirmation: boolean | null;
  tortureConfirmationDetails: string | null;
  assassinConfirmation: boolean | null;
  assassinConfirmationDetails: string | null;
  childSoldierConfirmation: boolean | null;
  childSoldierConfirmationDetails: string | null;
  religionLibertyConfirmation: boolean | null;
  religionLibertyConfirmationDetails: string | null;
  abortConfirmation: boolean | null;
  abortConfirmationDetails: string | null;
  coerciveTransplantConfirmation: boolean | null;
  coerciveTransplantConfirmationDetails: string | null;
  visaFraudConfirmation: boolean | null;
  visaFraudConfirmationDetails: string | null;
  deportedConfirmation: boolean | null;
  deportedConfirmationDetails: string | null;
  childCustodyConfirmation: boolean | null;
  childCustodyConfirmationDetails: string | null;
  lawViolationConfirmation: boolean | null;
  lawViolationConfirmationDetails: string | null;
  avoidTaxConfirmation: boolean | null;
  avoidTaxConfirmationDetails: string | null;
};

export type UserWithForm = User & {
  form: Form[];
};

export type ProfilesWithUserAndForm = Profile & {
  user: User & {
    profiles: Profile[];
  };
  form: Form | null;
  comments: Comments[];
};
