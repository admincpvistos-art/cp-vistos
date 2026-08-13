"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Form as FormType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FinishFormConfirmation } from "./finish-form-confirmation";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import useFormStore from "@/constants/stores/useFormStore";
import { SecurityFormType } from "@/types";

const formSchema = z
  .object({
    contagiousDiseaseConfirmation: z.enum(["", "Sim", "Não"]),
    contagiousDiseaseConfirmationDetails: z.string(),
    phisicalMentalProblemConfirmation: z.enum(["", "Sim", "Não"]),
    phisicalMentalProblemConfirmationDetails: z.string(),
    crimeConfirmation: z.enum(["", "Sim", "Não"]),
    crimeConfirmationDetails: z.string(),
    drugsProblemConfirmation: z.enum(["", "Sim", "Não"]),
    drugsProblemConfirmationDetails: z.string(),
    lawViolateConfirmation: z.enum(["", "Sim", "Não"]),
    lawViolateConfirmationDetails: z.string(),
    prostitutionConfirmation: z.enum(["", "Sim", "Não"]),
    prostitutionConfirmationDetails: z.string(),
    moneyLaundryConfirmation: z.enum(["", "Sim", "Não"]),
    moneyLaundryConfirmationDetails: z.string(),
    peopleTrafficConfirmation: z.enum(["", "Sim", "Não"]),
    peopleTrafficConfirmationDetails: z.string(),
    helpPeopleTrafficConfirmation: z.enum(["", "Sim", "Não"]),
    helpPeopleTrafficConfirmationDetails: z.string(),
    parentPeopleTrafficConfirmation: z.enum(["", "Sim", "Não"]),
    parentPeopleTrafficConfirmationDetails: z.string(),
    spyConfirmation: z.enum(["", "Sim", "Não"]),
    spyConfirmationDetails: z.string(),
    terrorismConfirmation: z.enum(["", "Sim", "Não"]),
    terrorismConfirmationDetails: z.string(),
    financialAssistanceConfirmation: z.enum(["", "Sim", "Não"]),
    financialAssistanceConfirmationDetails: z.string(),
    terrorismMemberConfirmation: z.enum(["", "Sim", "Não"]),
    terrorismMemberConfirmationDetails: z.string(),
    parentTerrorismConfirmation: z.enum(["", "Sim", "Não"]),
    parentTerrorismConfirmationDetails: z.string(),
    genocideConfirmation: z.enum(["", "Sim", "Não"]),
    genocideConfirmationDetails: z.string(),
    tortureConfirmation: z.enum(["", "Sim", "Não"]),
    tortureConfirmationDetails: z.string(),
    assassinConfirmation: z.enum(["", "Sim", "Não"]),
    assassinConfirmationDetails: z.string(),
    childSoldierConfirmation: z.enum(["", "Sim", "Não"]),
    childSoldierConfirmationDetails: z.string(),
    religionLibertyConfirmation: z.enum(["", "Sim", "Não"]),
    religionLibertyConfirmationDetails: z.string(),
    abortConfirmation: z.enum(["", "Sim", "Não"]),
    abortConfirmationDetails: z.string(),
    coerciveTransplantConfirmation: z.enum(["", "Sim", "Não"]),
    coerciveTransplantConfirmationDetails: z.string(),
    visaFraudConfirmation: z.enum(["", "Sim", "Não"]),
    visaFraudConfirmationDetails: z.string(),
    deportedConfirmation: z.enum(["", "Sim", "Não"]),
    deportedConfirmationDetails: z.string(),
    childCustodyConfirmation: z.enum(["", "Sim", "Não"]),
    childCustodyConfirmationDetails: z.string(),
    lawViolationConfirmation: z.enum(["", "Sim", "Não"]),
    lawViolationConfirmationDetails: z.string(),
    avoidTaxConfirmation: z.enum(["", "Sim", "Não"]),
    avoidTaxConfirmationDetails: z.string(),
  })
  .superRefine(
    (
      {
        contagiousDiseaseConfirmation,
        contagiousDiseaseConfirmationDetails,
        phisicalMentalProblemConfirmation,
        phisicalMentalProblemConfirmationDetails,
        crimeConfirmation,
        crimeConfirmationDetails,
        drugsProblemConfirmation,
        drugsProblemConfirmationDetails,
        lawViolateConfirmation,
        lawViolateConfirmationDetails,
        prostitutionConfirmation,
        prostitutionConfirmationDetails,
        moneyLaundryConfirmation,
        moneyLaundryConfirmationDetails,
        peopleTrafficConfirmation,
        peopleTrafficConfirmationDetails,
        helpPeopleTrafficConfirmation,
        helpPeopleTrafficConfirmationDetails,
        parentPeopleTrafficConfirmation,
        parentPeopleTrafficConfirmationDetails,
        spyConfirmation,
        spyConfirmationDetails,
        terrorismConfirmation,
        terrorismConfirmationDetails,
        financialAssistanceConfirmation,
        financialAssistanceConfirmationDetails,
        terrorismMemberConfirmation,
        terrorismMemberConfirmationDetails,
        parentTerrorismConfirmation,
        parentTerrorismConfirmationDetails,
        genocideConfirmation,
        genocideConfirmationDetails,
        tortureConfirmation,
        tortureConfirmationDetails,
        assassinConfirmation,
        assassinConfirmationDetails,
        childSoldierConfirmation,
        childSoldierConfirmationDetails,
        religionLibertyConfirmation,
        religionLibertyConfirmationDetails,
        abortConfirmation,
        abortConfirmationDetails,
        coerciveTransplantConfirmation,
        coerciveTransplantConfirmationDetails,
        visaFraudConfirmation,
        visaFraudConfirmationDetails,
        deportedConfirmation,
        deportedConfirmationDetails,
        childCustodyConfirmation,
        childCustodyConfirmationDetails,
        lawViolationConfirmation,
        lawViolationConfirmationDetails,
        avoidTaxConfirmation,
        avoidTaxConfirmationDetails,
      },
      ctx
    ) => {
      if (contagiousDiseaseConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["contagiousDiseaseConfirmation"],
        });
      }

      if (phisicalMentalProblemConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["phisicalMentalProblemConfirmation"],
        });
      }

      if (crimeConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["crimeConfirmation"],
        });
      }

      if (drugsProblemConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["drugsProblemConfirmation"],
        });
      }

      if (lawViolateConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["lawViolateConfirmation"],
        });
      }

      if (prostitutionConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["prostitutionConfirmation"],
        });
      }

      if (moneyLaundryConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["moneyLaundryConfirmation"],
        });
      }

      if (peopleTrafficConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["peopleTrafficConfirmation"],
        });
      }

      if (helpPeopleTrafficConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["helpPeopleTrafficConfirmation"],
        });
      }

      if (parentPeopleTrafficConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["parentPeopleTrafficConfirmation"],
        });
      }

      if (spyConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["spyConfirmation"],
        });
      }

      if (terrorismConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["terrorismConfirmation"],
        });
      }

      if (financialAssistanceConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["financialAssistanceConfirmation"],
        });
      }

      if (terrorismMemberConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["terrorismMemberConfirmation"],
        });
      }

      if (parentTerrorismConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["parentTerrorismConfirmation"],
        });
      }

      if (genocideConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["genocideConfirmation"],
        });
      }

      if (tortureConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["tortureConfirmation"],
        });
      }

      if (assassinConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["assassinConfirmation"],
        });
      }

      if (childSoldierConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["childSoldierConfirmation"],
        });
      }

      if (religionLibertyConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["religionLibertyConfirmation"],
        });
      }

      if (abortConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["abortConfirmation"],
        });
      }

      if (coerciveTransplantConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["coerciveTransplantConfirmation"],
        });
      }

      if (visaFraudConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["visaFraudConfirmation"],
        });
      }

      if (deportedConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["deportedConfirmation"],
        });
      }

      if (childCustodyConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["childCustodyConfirmation"],
        });
      }

      if (lawViolationConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["lawViolationConfirmation"],
        });
      }

      if (avoidTaxConfirmation === "") {
        ctx.addIssue({
          code: "custom",
          message: "Selecione sim ou não",
          path: ["avoidTaxConfirmation"],
        });
      }

      if (contagiousDiseaseConfirmation === "Sim" && contagiousDiseaseConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["contagiousDiseaseConfirmationDetails"],
        });
      }

      if (phisicalMentalProblemConfirmation === "Sim" && phisicalMentalProblemConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["phisicalMentalProblemConfirmationDetails"],
        });
      }

      if (crimeConfirmation === "Sim" && crimeConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["crimeConfirmationDetails"],
        });
      }

      if (drugsProblemConfirmation === "Sim" && drugsProblemConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["drugsProblemConfirmationDetails"],
        });
      }

      if (lawViolateConfirmation === "Sim" && lawViolateConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["lawViolateConfirmationDetails"],
        });
      }

      if (prostitutionConfirmation === "Sim" && prostitutionConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["prostitutionConfirmationDetails"],
        });
      }

      if (moneyLaundryConfirmation === "Sim" && moneyLaundryConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["moneyLaundryConfirmationDetails"],
        });
      }

      if (peopleTrafficConfirmation === "Sim" && peopleTrafficConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["peopleTrafficConfirmationDetails"],
        });
      }

      if (helpPeopleTrafficConfirmation === "Sim" && helpPeopleTrafficConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["helpPeopleTrafficConfirmationDetails"],
        });
      }

      if (parentPeopleTrafficConfirmation === "Sim" && parentPeopleTrafficConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["parentPeopleTrafficConfirmationDetails"],
        });
      }

      if (spyConfirmation === "Sim" && spyConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["spyConfirmationDetails"],
        });
      }

      if (terrorismConfirmation === "Sim" && terrorismConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["terrorismConfirmationDetails"],
        });
      }

      if (financialAssistanceConfirmation === "Sim" && financialAssistanceConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["financialAssistanceConfirmationDetails"],
        });
      }

      if (terrorismMemberConfirmation === "Sim" && terrorismMemberConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["terrorismMemberConfirmationDetails"],
        });
      }

      if (parentTerrorismConfirmation === "Sim" && parentTerrorismConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["parentTerrorismConfirmationDetails"],
        });
      }

      if (genocideConfirmation === "Sim" && genocideConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["genocideConfirmationDetails"],
        });
      }

      if (tortureConfirmation === "Sim" && tortureConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["tortureConfirmationDetails"],
        });
      }

      if (assassinConfirmation === "Sim" && assassinConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["assassinConfirmationDetails"],
        });
      }

      if (childSoldierConfirmation === "Sim" && childSoldierConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["childSoldierConfirmationDetails"],
        });
      }

      if (religionLibertyConfirmation === "Sim" && religionLibertyConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["religionLibertyConfirmationDetails"],
        });
      }

      if (abortConfirmation === "Sim" && abortConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["abortConfirmationDetails"],
        });
      }

      if (coerciveTransplantConfirmation === "Sim" && coerciveTransplantConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["coerciveTransplantConfirmationDetails"],
        });
      }

      if (visaFraudConfirmation === "Sim" && visaFraudConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["visaFraudConfirmationDetails"],
        });
      }

      if (deportedConfirmation === "Sim" && deportedConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["deportedConfirmationDetails"],
        });
      }

      if (childCustodyConfirmation === "Sim" && childCustodyConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["childCustodyConfirmationDetails"],
        });
      }

      if (lawViolationConfirmation === "Sim" && lawViolationConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["lawViolationConfirmationDetails"],
        });
      }

      if (avoidTaxConfirmation === "Sim" && avoidTaxConfirmationDetails.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Campo obrigatório caso a opção seja sim",
          path: ["avoidTaxConfirmationDetails"],
        });
      }
    }
  );

interface Props {
  securityForm: SecurityFormType;
  profileId: string;
  isEditing: boolean;
}

export function SecurityForm({ securityForm, profileId, isEditing }: Props) {
  const { redirectStep, setRedirectStep } = useFormStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contagiousDiseaseConfirmation:
        securityForm.contagiousDiseaseConfirmation !== null
          ? securityForm.contagiousDiseaseConfirmation
            ? "Sim"
            : "Não"
          : "",
      contagiousDiseaseConfirmationDetails:
        securityForm.contagiousDiseaseConfirmationDetails !== null
          ? securityForm.contagiousDiseaseConfirmationDetails
          : "",
      phisicalMentalProblemConfirmation:
        securityForm.phisicalMentalProblemConfirmation !== null
          ? securityForm.phisicalMentalProblemConfirmation
            ? "Sim"
            : "Não"
          : "",
      phisicalMentalProblemConfirmationDetails:
        securityForm.phisicalMentalProblemConfirmationDetails !== null
          ? securityForm.phisicalMentalProblemConfirmationDetails
          : "",
      crimeConfirmation:
        securityForm.crimeConfirmation !== null ? (securityForm.crimeConfirmation ? "Sim" : "Não") : "",
      crimeConfirmationDetails:
        securityForm.crimeConfirmationDetails !== null ? securityForm.crimeConfirmationDetails : "",
      drugsProblemConfirmation:
        securityForm.drugsProblemConfirmation !== null ? (securityForm.drugsProblemConfirmation ? "Sim" : "Não") : "",
      drugsProblemConfirmationDetails:
        securityForm.drugsProblemConfirmationDetails !== null ? securityForm.drugsProblemConfirmationDetails : "",
      lawViolateConfirmation:
        securityForm.lawViolateConfirmation !== null ? (securityForm.lawViolateConfirmation ? "Sim" : "Não") : "",
      lawViolateConfirmationDetails:
        securityForm.lawViolateConfirmationDetails !== null ? securityForm.lawViolateConfirmationDetails : "",
      prostitutionConfirmation:
        securityForm.prostitutionConfirmation !== null ? (securityForm.prostitutionConfirmation ? "Sim" : "Não") : "",
      prostitutionConfirmationDetails:
        securityForm.prostitutionConfirmationDetails !== null ? securityForm.prostitutionConfirmationDetails : "",
      moneyLaundryConfirmation:
        securityForm.moneyLaundryConfirmation !== null ? (securityForm.moneyLaundryConfirmation ? "Sim" : "Não") : "",
      moneyLaundryConfirmationDetails:
        securityForm.moneyLaundryConfirmationDetails !== null ? securityForm.moneyLaundryConfirmationDetails : "",
      peopleTrafficConfirmation:
        securityForm.peopleTrafficConfirmation !== null ? (securityForm.peopleTrafficConfirmation ? "Sim" : "Não") : "",
      peopleTrafficConfirmationDetails:
        securityForm.peopleTrafficConfirmationDetails !== null ? securityForm.peopleTrafficConfirmationDetails : "",
      helpPeopleTrafficConfirmation:
        securityForm.helpPeopleTrafficConfirmation !== null
          ? securityForm.helpPeopleTrafficConfirmation
            ? "Sim"
            : "Não"
          : "",
      helpPeopleTrafficConfirmationDetails:
        securityForm.helpPeopleTrafficConfirmationDetails !== null
          ? securityForm.helpPeopleTrafficConfirmationDetails
          : "",
      parentPeopleTrafficConfirmation:
        securityForm.parentPeopleTrafficConfirmation !== null
          ? securityForm.parentPeopleTrafficConfirmation
            ? "Sim"
            : "Não"
          : "",
      parentPeopleTrafficConfirmationDetails:
        securityForm.parentPeopleTrafficConfirmationDetails !== null
          ? securityForm.parentPeopleTrafficConfirmationDetails
          : "",
      spyConfirmation: securityForm.spyConfirmation !== null ? (securityForm.spyConfirmation ? "Sim" : "Não") : "",
      spyConfirmationDetails: securityForm.spyConfirmationDetails !== null ? securityForm.spyConfirmationDetails : "",
      terrorismConfirmation:
        securityForm.terrorismConfirmation !== null ? (securityForm.terrorismConfirmation ? "Sim" : "Não") : "",
      terrorismConfirmationDetails:
        securityForm.terrorismConfirmationDetails !== null ? securityForm.terrorismConfirmationDetails : "",
      financialAssistanceConfirmation:
        securityForm.financialAssistanceConfirmation !== null
          ? securityForm.financialAssistanceConfirmation
            ? "Sim"
            : "Não"
          : "",
      financialAssistanceConfirmationDetails:
        securityForm.financialAssistanceConfirmationDetails !== null
          ? securityForm.financialAssistanceConfirmationDetails
          : "",
      terrorismMemberConfirmation:
        securityForm.terrorismMemberConfirmation !== null
          ? securityForm.terrorismMemberConfirmation
            ? "Sim"
            : "Não"
          : "",
      terrorismMemberConfirmationDetails:
        securityForm.terrorismMemberConfirmationDetails !== null ? securityForm.terrorismMemberConfirmationDetails : "",
      parentTerrorismConfirmation:
        securityForm.parentTerrorismConfirmation !== null
          ? securityForm.parentTerrorismConfirmation
            ? "Sim"
            : "Não"
          : "",
      parentTerrorismConfirmationDetails:
        securityForm.parentTerrorismConfirmationDetails !== null ? securityForm.parentTerrorismConfirmationDetails : "",
      genocideConfirmation:
        securityForm.genocideConfirmation !== null ? (securityForm.genocideConfirmation ? "Sim" : "Não") : "",
      genocideConfirmationDetails:
        securityForm.genocideConfirmationDetails !== null ? securityForm.genocideConfirmationDetails : "",
      tortureConfirmation:
        securityForm.tortureConfirmation !== null ? (securityForm.tortureConfirmation ? "Sim" : "Não") : "",
      tortureConfirmationDetails:
        securityForm.tortureConfirmationDetails !== null ? securityForm.tortureConfirmationDetails : "",
      assassinConfirmation:
        securityForm.assassinConfirmation !== null ? (securityForm.assassinConfirmation ? "Sim" : "Não") : "",
      assassinConfirmationDetails:
        securityForm.assassinConfirmationDetails !== null ? securityForm.assassinConfirmationDetails : "",
      childSoldierConfirmation:
        securityForm.childSoldierConfirmation !== null ? (securityForm.childSoldierConfirmation ? "Sim" : "Não") : "",
      childSoldierConfirmationDetails:
        securityForm.childSoldierConfirmationDetails !== null ? securityForm.childSoldierConfirmationDetails : "",
      religionLibertyConfirmation:
        securityForm.religionLibertyConfirmation !== null
          ? securityForm.religionLibertyConfirmation
            ? "Sim"
            : "Não"
          : "",
      religionLibertyConfirmationDetails:
        securityForm.religionLibertyConfirmationDetails !== null ? securityForm.religionLibertyConfirmationDetails : "",
      abortConfirmation:
        securityForm.abortConfirmation !== null ? (securityForm.abortConfirmation ? "Sim" : "Não") : "",
      abortConfirmationDetails:
        securityForm.abortConfirmationDetails !== null ? securityForm.abortConfirmationDetails : "",
      coerciveTransplantConfirmation:
        securityForm.coerciveTransplantConfirmation !== null
          ? securityForm.coerciveTransplantConfirmation
            ? "Sim"
            : "Não"
          : "",
      coerciveTransplantConfirmationDetails:
        securityForm.coerciveTransplantConfirmationDetails !== null
          ? securityForm.coerciveTransplantConfirmationDetails
          : "",
      visaFraudConfirmation:
        securityForm.visaFraudConfirmation !== null ? (securityForm.visaFraudConfirmation ? "Sim" : "Não") : "",
      visaFraudConfirmationDetails:
        securityForm.visaFraudConfirmationDetails !== null ? securityForm.visaFraudConfirmationDetails : "",
      deportedConfirmation:
        securityForm.deportedConfirmation !== null ? (securityForm.deportedConfirmation ? "Sim" : "Não") : "",
      deportedConfirmationDetails:
        securityForm.deportedConfirmationDetails !== null ? securityForm.deportedConfirmationDetails : "",
      childCustodyConfirmation:
        securityForm.childCustodyConfirmation !== null ? (securityForm.childCustodyConfirmation ? "Sim" : "Não") : "",
      childCustodyConfirmationDetails:
        securityForm.childCustodyConfirmationDetails !== null ? securityForm.childCustodyConfirmationDetails : "",
      lawViolationConfirmation:
        securityForm.lawViolationConfirmation !== null ? (securityForm.lawViolationConfirmation ? "Sim" : "Não") : "",
      lawViolationConfirmationDetails:
        securityForm.lawViolationConfirmationDetails !== null ? securityForm.lawViolationConfirmationDetails : "",
      avoidTaxConfirmation:
        securityForm.avoidTaxConfirmation !== null ? (securityForm.avoidTaxConfirmation ? "Sim" : "Não") : "",
      avoidTaxConfirmationDetails:
        securityForm.avoidTaxConfirmationDetails !== null ? securityForm.avoidTaxConfirmationDetails : "",
    },
  });

  const utils = trpc.useUtils();
  const router = useRouter();

  const contagiousDiseaseConfirmation = form.watch("contagiousDiseaseConfirmation");
  const phisicalMentalProblemConfirmation = form.watch("phisicalMentalProblemConfirmation");
  const crimeConfirmation = form.watch("crimeConfirmation");
  const drugsProblemConfirmation = form.watch("drugsProblemConfirmation");
  const lawViolateConfirmation = form.watch("lawViolateConfirmation");
  const prostitutionConfirmation = form.watch("prostitutionConfirmation");
  const moneyLaundryConfirmation = form.watch("moneyLaundryConfirmation");
  const peopleTrafficConfirmation = form.watch("peopleTrafficConfirmation");
  const helpPeopleTrafficConfirmation = form.watch("helpPeopleTrafficConfirmation");
  const parentPeopleTrafficConfirmation = form.watch("parentPeopleTrafficConfirmation");
  const spyConfirmation = form.watch("spyConfirmation");
  const terrorismConfirmation = form.watch("terrorismConfirmation");
  const financialAssistanceConfirmation = form.watch("financialAssistanceConfirmation");
  const terrorismMemberConfirmation = form.watch("terrorismMemberConfirmation");
  const parentTerrorismConfirmation = form.watch("parentTerrorismConfirmation");
  const genocideConfirmation = form.watch("genocideConfirmation");
  const tortureConfirmation = form.watch("tortureConfirmation");
  const assassinConfirmation = form.watch("assassinConfirmation");
  const childSoldierConfirmation = form.watch("childSoldierConfirmation");
  const religionLibertyConfirmation = form.watch("religionLibertyConfirmation");
  const abortConfirmation = form.watch("abortConfirmation");
  const coerciveTransplantConfirmation = form.watch("coerciveTransplantConfirmation");
  const visaFraudConfirmation = form.watch("visaFraudConfirmation");
  const deportedConfirmation = form.watch("deportedConfirmation");
  const childCustodyConfirmation = form.watch("childCustodyConfirmation");
  const lawViolationConfirmation = form.watch("lawViolationConfirmation");
  const avoidTaxConfirmation = form.watch("avoidTaxConfirmation");

  const { mutate: submitSecurity, isPending } = trpc.formsRouter.submitSecurity.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      router.push(`/resumo-formulario/${profileId}`);
    },
    onError: (error) => {
      console.error(error.data);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Erro ao enviar as informações do formulário, tente novamente mais tarde");
      }
    },
  });
  const { mutate: saveSecurity, isPending: isSavePending } = trpc.formsRouter.saveSecurity.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.redirectStep !== undefined) {
        router.push(`/formulario/${profileId}?formStep=${data.redirectStep}`);
      } else {
        router.push("/area-do-cliente");
      }
    },
    onError: (error) => {
      console.error(error.data);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao salvar os dados");
      }
    },
  });

  useEffect(() => {
    if (redirectStep !== null) {
      const values = form.getValues();

      saveSecurity({
        profileId,
        redirectStep,
        contagiousDiseaseConfirmation:
          values.contagiousDiseaseConfirmation ??
          (securityForm.contagiousDiseaseConfirmation !== null
            ? securityForm.contagiousDiseaseConfirmation
              ? "Sim"
              : "Não"
            : null),
        contagiousDiseaseConfirmationDetails: values.contagiousDiseaseConfirmationDetails
          ? values.contagiousDiseaseConfirmationDetails
          : !securityForm.contagiousDiseaseConfirmationDetails
          ? ""
          : securityForm.contagiousDiseaseConfirmationDetails,
        phisicalMentalProblemConfirmation:
          values.phisicalMentalProblemConfirmation ??
          (securityForm.phisicalMentalProblemConfirmation !== null
            ? securityForm.phisicalMentalProblemConfirmation
              ? "Sim"
              : "Não"
            : null),
        phisicalMentalProblemConfirmationDetails: values.phisicalMentalProblemConfirmationDetails
          ? values.phisicalMentalProblemConfirmationDetails
          : !securityForm.phisicalMentalProblemConfirmationDetails
          ? ""
          : securityForm.phisicalMentalProblemConfirmationDetails,
        crimeConfirmation:
          values.crimeConfirmation ??
          (securityForm.crimeConfirmation !== null ? (securityForm.crimeConfirmation ? "Sim" : "Não") : null),
        crimeConfirmationDetails: values.crimeConfirmationDetails
          ? values.crimeConfirmationDetails
          : !securityForm.crimeConfirmationDetails
          ? ""
          : securityForm.crimeConfirmationDetails,
        drugsProblemConfirmation:
          values.drugsProblemConfirmation ??
          (securityForm.drugsProblemConfirmation !== null
            ? securityForm.drugsProblemConfirmation
              ? "Sim"
              : "Não"
            : null),
        drugsProblemConfirmationDetails: values.drugsProblemConfirmationDetails
          ? values.drugsProblemConfirmationDetails
          : !securityForm.drugsProblemConfirmationDetails
          ? ""
          : securityForm.drugsProblemConfirmationDetails,
        lawViolateConfirmation:
          values.lawViolateConfirmation ??
          (securityForm.lawViolateConfirmation !== null ? (securityForm.lawViolateConfirmation ? "Sim" : "Não") : null),
        lawViolateConfirmationDetails: values.lawViolateConfirmationDetails
          ? values.lawViolateConfirmationDetails
          : !securityForm.lawViolateConfirmationDetails
          ? ""
          : securityForm.lawViolateConfirmationDetails,
        prostitutionConfirmation:
          values.prostitutionConfirmation ??
          (securityForm.prostitutionConfirmation !== null
            ? securityForm.prostitutionConfirmation
              ? "Sim"
              : "Não"
            : null),
        prostitutionConfirmationDetails: values.prostitutionConfirmationDetails
          ? values.prostitutionConfirmationDetails
          : !securityForm.prostitutionConfirmationDetails
          ? ""
          : securityForm.prostitutionConfirmationDetails,
        moneyLaundryConfirmation:
          values.moneyLaundryConfirmation ??
          (securityForm.moneyLaundryConfirmation !== null
            ? securityForm.moneyLaundryConfirmation
              ? "Sim"
              : "Não"
            : null),
        moneyLaundryConfirmationDetails: values.moneyLaundryConfirmationDetails
          ? values.moneyLaundryConfirmationDetails
          : !securityForm.moneyLaundryConfirmationDetails
          ? ""
          : securityForm.moneyLaundryConfirmationDetails,
        peopleTrafficConfirmation:
          values.peopleTrafficConfirmation ??
          (securityForm.peopleTrafficConfirmation !== null
            ? securityForm.peopleTrafficConfirmation
              ? "Sim"
              : "Não"
            : null),
        peopleTrafficConfirmationDetails: values.peopleTrafficConfirmationDetails
          ? values.peopleTrafficConfirmationDetails
          : !securityForm.peopleTrafficConfirmationDetails
          ? ""
          : securityForm.peopleTrafficConfirmationDetails,
        helpPeopleTrafficConfirmation:
          values.helpPeopleTrafficConfirmation ??
          (securityForm.helpPeopleTrafficConfirmation !== null
            ? securityForm.helpPeopleTrafficConfirmation
              ? "Sim"
              : "Não"
            : null),
        helpPeopleTrafficConfirmationDetails: values.helpPeopleTrafficConfirmationDetails
          ? values.helpPeopleTrafficConfirmationDetails
          : !securityForm.helpPeopleTrafficConfirmationDetails
          ? ""
          : securityForm.helpPeopleTrafficConfirmationDetails,
        parentPeopleTrafficConfirmation:
          values.parentPeopleTrafficConfirmation ??
          (securityForm.parentPeopleTrafficConfirmation !== null
            ? securityForm.parentPeopleTrafficConfirmation
              ? "Sim"
              : "Não"
            : null),
        parentPeopleTrafficConfirmationDetails: values.parentPeopleTrafficConfirmationDetails
          ? values.parentPeopleTrafficConfirmationDetails
          : !securityForm.parentPeopleTrafficConfirmationDetails
          ? ""
          : securityForm.parentPeopleTrafficConfirmationDetails,
        spyConfirmation:
          values.spyConfirmation ??
          (securityForm.spyConfirmation !== null ? (securityForm.spyConfirmation ? "Sim" : "Não") : null),
        spyConfirmationDetails: values.spyConfirmationDetails
          ? values.spyConfirmationDetails
          : !securityForm.spyConfirmationDetails
          ? ""
          : securityForm.spyConfirmationDetails,
        terrorismConfirmation:
          values.terrorismConfirmation ??
          (securityForm.terrorismConfirmation !== null ? (securityForm.terrorismConfirmation ? "Sim" : "Não") : null),
        terrorismConfirmationDetails: values.terrorismConfirmationDetails
          ? values.terrorismConfirmationDetails
          : !securityForm.terrorismConfirmationDetails
          ? ""
          : securityForm.terrorismConfirmationDetails,
        financialAssistanceConfirmation:
          values.financialAssistanceConfirmation ??
          (securityForm.financialAssistanceConfirmation !== null
            ? securityForm.financialAssistanceConfirmation
              ? "Sim"
              : "Não"
            : null),
        financialAssistanceConfirmationDetails: values.financialAssistanceConfirmationDetails
          ? values.financialAssistanceConfirmationDetails
          : !securityForm.financialAssistanceConfirmationDetails
          ? ""
          : securityForm.financialAssistanceConfirmationDetails,
        terrorismMemberConfirmation:
          values.terrorismMemberConfirmation ??
          (securityForm.terrorismMemberConfirmation !== null
            ? securityForm.terrorismMemberConfirmation
              ? "Sim"
              : "Não"
            : null),
        terrorismMemberConfirmationDetails: values.terrorismMemberConfirmationDetails
          ? values.terrorismMemberConfirmationDetails
          : !securityForm.terrorismMemberConfirmationDetails
          ? ""
          : securityForm.terrorismMemberConfirmationDetails,
        parentTerrorismConfirmation:
          values.parentTerrorismConfirmation ??
          (securityForm.parentTerrorismConfirmation !== null
            ? securityForm.parentTerrorismConfirmation
              ? "Sim"
              : "Não"
            : null),
        parentTerrorismConfirmationDetails: values.parentTerrorismConfirmationDetails
          ? values.parentTerrorismConfirmationDetails
          : !securityForm.parentTerrorismConfirmationDetails
          ? ""
          : securityForm.parentTerrorismConfirmationDetails,
        genocideConfirmation:
          values.genocideConfirmation ??
          (securityForm.genocideConfirmation !== null ? (securityForm.genocideConfirmation ? "Sim" : "Não") : null),
        genocideConfirmationDetails: values.genocideConfirmationDetails
          ? values.genocideConfirmationDetails
          : !securityForm.genocideConfirmationDetails
          ? ""
          : securityForm.genocideConfirmationDetails,
        tortureConfirmation:
          values.tortureConfirmation ??
          (securityForm.tortureConfirmation !== null ? (securityForm.tortureConfirmation ? "Sim" : "Não") : null),
        tortureConfirmationDetails: values.tortureConfirmationDetails
          ? values.tortureConfirmationDetails
          : !securityForm.tortureConfirmationDetails
          ? ""
          : securityForm.tortureConfirmationDetails,
        assassinConfirmation:
          values.assassinConfirmation ??
          (securityForm.assassinConfirmation !== null ? (securityForm.assassinConfirmation ? "Sim" : "Não") : null),
        assassinConfirmationDetails: values.assassinConfirmationDetails
          ? values.assassinConfirmationDetails
          : !securityForm.assassinConfirmationDetails
          ? ""
          : securityForm.assassinConfirmationDetails,
        childSoldierConfirmation:
          values.childSoldierConfirmation ??
          (securityForm.childSoldierConfirmation !== null
            ? securityForm.childSoldierConfirmation
              ? "Sim"
              : "Não"
            : null),
        childSoldierConfirmationDetails: values.childSoldierConfirmationDetails
          ? values.childSoldierConfirmationDetails
          : !securityForm.childSoldierConfirmationDetails
          ? ""
          : securityForm.childSoldierConfirmationDetails,
        religionLibertyConfirmation:
          values.religionLibertyConfirmation ??
          (securityForm.religionLibertyConfirmation !== null
            ? securityForm.religionLibertyConfirmation
              ? "Sim"
              : "Não"
            : null),
        religionLibertyConfirmationDetails: values.religionLibertyConfirmationDetails
          ? values.religionLibertyConfirmationDetails
          : !securityForm.religionLibertyConfirmationDetails
          ? ""
          : securityForm.religionLibertyConfirmationDetails,
        abortConfirmation:
          values.abortConfirmation ??
          (securityForm.abortConfirmation !== null ? (securityForm.abortConfirmation ? "Sim" : "Não") : null),
        abortConfirmationDetails: values.abortConfirmationDetails
          ? values.abortConfirmationDetails
          : !securityForm.abortConfirmationDetails
          ? ""
          : securityForm.abortConfirmationDetails,
        coerciveTransplantConfirmation:
          values.coerciveTransplantConfirmation ??
          (securityForm.coerciveTransplantConfirmation !== null
            ? securityForm.coerciveTransplantConfirmation
              ? "Sim"
              : "Não"
            : null),
        coerciveTransplantConfirmationDetails: values.coerciveTransplantConfirmationDetails
          ? values.coerciveTransplantConfirmationDetails
          : !securityForm.coerciveTransplantConfirmationDetails
          ? ""
          : securityForm.coerciveTransplantConfirmationDetails,
        visaFraudConfirmation:
          values.visaFraudConfirmation ??
          (securityForm.visaFraudConfirmation !== null ? (securityForm.visaFraudConfirmation ? "Sim" : "Não") : null),
        visaFraudConfirmationDetails: values.visaFraudConfirmationDetails
          ? values.visaFraudConfirmationDetails
          : !securityForm.visaFraudConfirmationDetails
          ? ""
          : securityForm.visaFraudConfirmationDetails,
        deportedConfirmation:
          values.deportedConfirmation ??
          (securityForm.deportedConfirmation !== null ? (securityForm.deportedConfirmation ? "Sim" : "Não") : null),
        deportedConfirmationDetails: values.deportedConfirmationDetails
          ? values.deportedConfirmationDetails
          : !securityForm.deportedConfirmationDetails
          ? ""
          : securityForm.deportedConfirmationDetails,
        childCustodyConfirmation:
          values.childCustodyConfirmation ??
          (securityForm.childCustodyConfirmation !== null
            ? securityForm.childCustodyConfirmation
              ? "Sim"
              : "Não"
            : null),
        childCustodyConfirmationDetails: values.childCustodyConfirmationDetails
          ? values.childCustodyConfirmationDetails
          : !securityForm.childCustodyConfirmationDetails
          ? ""
          : securityForm.childCustodyConfirmationDetails,
        lawViolationConfirmation:
          values.lawViolationConfirmation ??
          (securityForm.lawViolationConfirmation !== null
            ? securityForm.lawViolationConfirmation
              ? "Sim"
              : "Não"
            : null),
        lawViolationConfirmationDetails: values.lawViolationConfirmationDetails
          ? values.lawViolationConfirmationDetails
          : !securityForm.lawViolationConfirmationDetails
          ? ""
          : securityForm.lawViolationConfirmationDetails,
        avoidTaxConfirmation:
          values.avoidTaxConfirmation ??
          (securityForm.avoidTaxConfirmation !== null ? (securityForm.avoidTaxConfirmation ? "Sim" : "Não") : null),
        avoidTaxConfirmationDetails: values.avoidTaxConfirmationDetails
          ? values.avoidTaxConfirmationDetails
          : !securityForm.avoidTaxConfirmationDetails
          ? ""
          : securityForm.avoidTaxConfirmationDetails,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, saveSecurity, profileId]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing) {
      submitSecurity({ ...values, profileId, isEditing, step: 11 });
    }
  }

  function handleSubmitOnModal() {
    form
      .trigger(
        [
          "contagiousDiseaseConfirmation",
          "contagiousDiseaseConfirmationDetails",
          "phisicalMentalProblemConfirmation",
          "phisicalMentalProblemConfirmationDetails",
          "crimeConfirmation",
          "crimeConfirmationDetails",
          "drugsProblemConfirmation",
          "drugsProblemConfirmationDetails",
          "lawViolateConfirmation",
          "lawViolateConfirmationDetails",
          "prostitutionConfirmation",
          "prostitutionConfirmationDetails",
          "moneyLaundryConfirmation",
          "moneyLaundryConfirmationDetails",
          "peopleTrafficConfirmation",
          "peopleTrafficConfirmationDetails",
          "helpPeopleTrafficConfirmation",
          "helpPeopleTrafficConfirmationDetails",
          "parentPeopleTrafficConfirmation",
          "parentPeopleTrafficConfirmationDetails",
          "spyConfirmation",
          "spyConfirmationDetails",
          "terrorismConfirmation",
          "terrorismConfirmationDetails",
          "financialAssistanceConfirmation",
          "financialAssistanceConfirmationDetails",
          "terrorismMemberConfirmation",
          "terrorismMemberConfirmationDetails",
          "parentTerrorismConfirmation",
          "parentTerrorismConfirmationDetails",
          "genocideConfirmation",
          "genocideConfirmationDetails",
          "tortureConfirmation",
          "tortureConfirmationDetails",
          "assassinConfirmation",
          "assassinConfirmationDetails",
          "childSoldierConfirmation",
          "childSoldierConfirmationDetails",
          "religionLibertyConfirmation",
          "religionLibertyConfirmationDetails",
          "abortConfirmation",
          "abortConfirmationDetails",
          "coerciveTransplantConfirmation",
          "coerciveTransplantConfirmationDetails",
          "visaFraudConfirmation",
          "visaFraudConfirmationDetails",
          "deportedConfirmation",
          "deportedConfirmationDetails",
          "childCustodyConfirmation",
          "childCustodyConfirmationDetails",
          "lawViolationConfirmation",
          "lawViolationConfirmationDetails",
          "avoidTaxConfirmation",
          "avoidTaxConfirmationDetails",
        ],
        {
          shouldFocus: true,
        }
      )
      .then(() => {
        if (Object.keys(form.formState.errors).length === 0) {
          const values = form.getValues();

          submitSecurity({ ...values, profileId, isEditing, step: 11 });
        } else {
          router.push(`/formulario/${profileId}?formStep=10`);
        }
      });
  }

  function onSave() {
    const values = form.getValues();

    saveSecurity({
      profileId,
      contagiousDiseaseConfirmation:
        values.contagiousDiseaseConfirmation ??
        (securityForm.contagiousDiseaseConfirmation !== null
          ? securityForm.contagiousDiseaseConfirmation
            ? "Sim"
            : "Não"
          : null),
      contagiousDiseaseConfirmationDetails: values.contagiousDiseaseConfirmationDetails
        ? values.contagiousDiseaseConfirmationDetails
        : !securityForm.contagiousDiseaseConfirmationDetails
        ? ""
        : securityForm.contagiousDiseaseConfirmationDetails,
      phisicalMentalProblemConfirmation:
        values.phisicalMentalProblemConfirmation ??
        (securityForm.phisicalMentalProblemConfirmation !== null
          ? securityForm.phisicalMentalProblemConfirmation
            ? "Sim"
            : "Não"
          : null),
      phisicalMentalProblemConfirmationDetails: values.phisicalMentalProblemConfirmationDetails
        ? values.phisicalMentalProblemConfirmationDetails
        : !securityForm.phisicalMentalProblemConfirmationDetails
        ? ""
        : securityForm.phisicalMentalProblemConfirmationDetails,
      crimeConfirmation:
        values.crimeConfirmation ??
        (securityForm.crimeConfirmation !== null ? (securityForm.crimeConfirmation ? "Sim" : "Não") : null),
      crimeConfirmationDetails: values.crimeConfirmationDetails
        ? values.crimeConfirmationDetails
        : !securityForm.crimeConfirmationDetails
        ? ""
        : securityForm.crimeConfirmationDetails,
      drugsProblemConfirmation:
        values.drugsProblemConfirmation ??
        (securityForm.drugsProblemConfirmation !== null
          ? securityForm.drugsProblemConfirmation
            ? "Sim"
            : "Não"
          : null),
      drugsProblemConfirmationDetails: values.drugsProblemConfirmationDetails
        ? values.drugsProblemConfirmationDetails
        : !securityForm.drugsProblemConfirmationDetails
        ? ""
        : securityForm.drugsProblemConfirmationDetails,
      lawViolateConfirmation:
        values.lawViolateConfirmation ??
        (securityForm.lawViolateConfirmation !== null ? (securityForm.lawViolateConfirmation ? "Sim" : "Não") : null),
      lawViolateConfirmationDetails: values.lawViolateConfirmationDetails
        ? values.lawViolateConfirmationDetails
        : !securityForm.lawViolateConfirmationDetails
        ? ""
        : securityForm.lawViolateConfirmationDetails,
      prostitutionConfirmation:
        values.prostitutionConfirmation ??
        (securityForm.prostitutionConfirmation !== null
          ? securityForm.prostitutionConfirmation
            ? "Sim"
            : "Não"
          : null),
      prostitutionConfirmationDetails: values.prostitutionConfirmationDetails
        ? values.prostitutionConfirmationDetails
        : !securityForm.prostitutionConfirmationDetails
        ? ""
        : securityForm.prostitutionConfirmationDetails,
      moneyLaundryConfirmation:
        values.moneyLaundryConfirmation ??
        (securityForm.moneyLaundryConfirmation !== null
          ? securityForm.moneyLaundryConfirmation
            ? "Sim"
            : "Não"
          : null),
      moneyLaundryConfirmationDetails: values.moneyLaundryConfirmationDetails
        ? values.moneyLaundryConfirmationDetails
        : !securityForm.moneyLaundryConfirmationDetails
        ? ""
        : securityForm.moneyLaundryConfirmationDetails,
      peopleTrafficConfirmation:
        values.peopleTrafficConfirmation ??
        (securityForm.peopleTrafficConfirmation !== null
          ? securityForm.peopleTrafficConfirmation
            ? "Sim"
            : "Não"
          : null),
      peopleTrafficConfirmationDetails: values.peopleTrafficConfirmationDetails
        ? values.peopleTrafficConfirmationDetails
        : !securityForm.peopleTrafficConfirmationDetails
        ? ""
        : securityForm.peopleTrafficConfirmationDetails,
      helpPeopleTrafficConfirmation:
        values.helpPeopleTrafficConfirmation ??
        (securityForm.helpPeopleTrafficConfirmation !== null
          ? securityForm.helpPeopleTrafficConfirmation
            ? "Sim"
            : "Não"
          : null),
      helpPeopleTrafficConfirmationDetails: values.helpPeopleTrafficConfirmationDetails
        ? values.helpPeopleTrafficConfirmationDetails
        : !securityForm.helpPeopleTrafficConfirmationDetails
        ? ""
        : securityForm.helpPeopleTrafficConfirmationDetails,
      parentPeopleTrafficConfirmation:
        values.parentPeopleTrafficConfirmation ??
        (securityForm.parentPeopleTrafficConfirmation !== null
          ? securityForm.parentPeopleTrafficConfirmation
            ? "Sim"
            : "Não"
          : null),
      parentPeopleTrafficConfirmationDetails: values.parentPeopleTrafficConfirmationDetails
        ? values.parentPeopleTrafficConfirmationDetails
        : !securityForm.parentPeopleTrafficConfirmationDetails
        ? ""
        : securityForm.parentPeopleTrafficConfirmationDetails,
      spyConfirmation:
        values.spyConfirmation ??
        (securityForm.spyConfirmation !== null ? (securityForm.spyConfirmation ? "Sim" : "Não") : null),
      spyConfirmationDetails: values.spyConfirmationDetails
        ? values.spyConfirmationDetails
        : !securityForm.spyConfirmationDetails
        ? ""
        : securityForm.spyConfirmationDetails,
      terrorismConfirmation:
        values.terrorismConfirmation ??
        (securityForm.terrorismConfirmation !== null ? (securityForm.terrorismConfirmation ? "Sim" : "Não") : null),
      terrorismConfirmationDetails: values.terrorismConfirmationDetails
        ? values.terrorismConfirmationDetails
        : !securityForm.terrorismConfirmationDetails
        ? ""
        : securityForm.terrorismConfirmationDetails,
      financialAssistanceConfirmation:
        values.financialAssistanceConfirmation ??
        (securityForm.financialAssistanceConfirmation !== null
          ? securityForm.financialAssistanceConfirmation
            ? "Sim"
            : "Não"
          : null),
      financialAssistanceConfirmationDetails: values.financialAssistanceConfirmationDetails
        ? values.financialAssistanceConfirmationDetails
        : !securityForm.financialAssistanceConfirmationDetails
        ? ""
        : securityForm.financialAssistanceConfirmationDetails,
      terrorismMemberConfirmation:
        values.terrorismMemberConfirmation ??
        (securityForm.terrorismMemberConfirmation !== null
          ? securityForm.terrorismMemberConfirmation
            ? "Sim"
            : "Não"
          : null),
      terrorismMemberConfirmationDetails: values.terrorismMemberConfirmationDetails
        ? values.terrorismMemberConfirmationDetails
        : !securityForm.terrorismMemberConfirmationDetails
        ? ""
        : securityForm.terrorismMemberConfirmationDetails,
      parentTerrorismConfirmation:
        values.parentTerrorismConfirmation ??
        (securityForm.parentTerrorismConfirmation !== null
          ? securityForm.parentTerrorismConfirmation
            ? "Sim"
            : "Não"
          : null),
      parentTerrorismConfirmationDetails: values.parentTerrorismConfirmationDetails
        ? values.parentTerrorismConfirmationDetails
        : !securityForm.parentTerrorismConfirmationDetails
        ? ""
        : securityForm.parentTerrorismConfirmationDetails,
      genocideConfirmation:
        values.genocideConfirmation ??
        (securityForm.genocideConfirmation !== null ? (securityForm.genocideConfirmation ? "Sim" : "Não") : null),
      genocideConfirmationDetails: values.genocideConfirmationDetails
        ? values.genocideConfirmationDetails
        : !securityForm.genocideConfirmationDetails
        ? ""
        : securityForm.genocideConfirmationDetails,
      tortureConfirmation:
        values.tortureConfirmation ??
        (securityForm.tortureConfirmation !== null ? (securityForm.tortureConfirmation ? "Sim" : "Não") : null),
      tortureConfirmationDetails: values.tortureConfirmationDetails
        ? values.tortureConfirmationDetails
        : !securityForm.tortureConfirmationDetails
        ? ""
        : securityForm.tortureConfirmationDetails,
      assassinConfirmation:
        values.assassinConfirmation ??
        (securityForm.assassinConfirmation !== null ? (securityForm.assassinConfirmation ? "Sim" : "Não") : null),
      assassinConfirmationDetails: values.assassinConfirmationDetails
        ? values.assassinConfirmationDetails
        : !securityForm.assassinConfirmationDetails
        ? ""
        : securityForm.assassinConfirmationDetails,
      childSoldierConfirmation:
        values.childSoldierConfirmation ??
        (securityForm.childSoldierConfirmation !== null
          ? securityForm.childSoldierConfirmation
            ? "Sim"
            : "Não"
          : null),
      childSoldierConfirmationDetails: values.childSoldierConfirmationDetails
        ? values.childSoldierConfirmationDetails
        : !securityForm.childSoldierConfirmationDetails
        ? ""
        : securityForm.childSoldierConfirmationDetails,
      religionLibertyConfirmation:
        values.religionLibertyConfirmation ??
        (securityForm.religionLibertyConfirmation !== null
          ? securityForm.religionLibertyConfirmation
            ? "Sim"
            : "Não"
          : null),
      religionLibertyConfirmationDetails: values.religionLibertyConfirmationDetails
        ? values.religionLibertyConfirmationDetails
        : !securityForm.religionLibertyConfirmationDetails
        ? ""
        : securityForm.religionLibertyConfirmationDetails,
      abortConfirmation:
        values.abortConfirmation ??
        (securityForm.abortConfirmation !== null ? (securityForm.abortConfirmation ? "Sim" : "Não") : null),
      abortConfirmationDetails: values.abortConfirmationDetails
        ? values.abortConfirmationDetails
        : !securityForm.abortConfirmationDetails
        ? ""
        : securityForm.abortConfirmationDetails,
      coerciveTransplantConfirmation:
        values.coerciveTransplantConfirmation ??
        (securityForm.coerciveTransplantConfirmation !== null
          ? securityForm.coerciveTransplantConfirmation
            ? "Sim"
            : "Não"
          : null),
      coerciveTransplantConfirmationDetails: values.coerciveTransplantConfirmationDetails
        ? values.coerciveTransplantConfirmationDetails
        : !securityForm.coerciveTransplantConfirmationDetails
        ? ""
        : securityForm.coerciveTransplantConfirmationDetails,
      visaFraudConfirmation:
        values.visaFraudConfirmation ??
        (securityForm.visaFraudConfirmation !== null ? (securityForm.visaFraudConfirmation ? "Sim" : "Não") : null),
      visaFraudConfirmationDetails: values.visaFraudConfirmationDetails
        ? values.visaFraudConfirmationDetails
        : !securityForm.visaFraudConfirmationDetails
        ? ""
        : securityForm.visaFraudConfirmationDetails,
      deportedConfirmation:
        values.deportedConfirmation ??
        (securityForm.deportedConfirmation !== null ? (securityForm.deportedConfirmation ? "Sim" : "Não") : null),
      deportedConfirmationDetails: values.deportedConfirmationDetails
        ? values.deportedConfirmationDetails
        : !securityForm.deportedConfirmationDetails
        ? ""
        : securityForm.deportedConfirmationDetails,
      childCustodyConfirmation:
        values.childCustodyConfirmation ??
        (securityForm.childCustodyConfirmation !== null
          ? securityForm.childCustodyConfirmation
            ? "Sim"
            : "Não"
          : null),
      childCustodyConfirmationDetails: values.childCustodyConfirmationDetails
        ? values.childCustodyConfirmationDetails
        : !securityForm.childCustodyConfirmationDetails
        ? ""
        : securityForm.childCustodyConfirmationDetails,
      lawViolationConfirmation:
        values.lawViolationConfirmation ??
        (securityForm.lawViolationConfirmation !== null
          ? securityForm.lawViolationConfirmation
            ? "Sim"
            : "Não"
          : null),
      lawViolationConfirmationDetails: values.lawViolationConfirmationDetails
        ? values.lawViolationConfirmationDetails
        : !securityForm.lawViolationConfirmationDetails
        ? ""
        : securityForm.lawViolationConfirmationDetails,
      avoidTaxConfirmation:
        values.avoidTaxConfirmation ??
        (securityForm.avoidTaxConfirmation !== null ? (securityForm.avoidTaxConfirmation ? "Sim" : "Não") : null),
      avoidTaxConfirmationDetails: values.avoidTaxConfirmationDetails
        ? values.avoidTaxConfirmationDetails
        : !securityForm.avoidTaxConfirmationDetails
        ? ""
        : securityForm.avoidTaxConfirmationDetails,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">Segurança</h2>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="contagiousDiseaseConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Possui alguma doença contagiosa (cancroide, gonorreia, granuloma inguinal, hanseníase infecciosa,
                      linfogranuloma venéreo, sífilis em estágio infeccioso, tuberculose ativa e outras doenças)
                      conforme determinado pelo Departamento de Saúde e Serviços Humanos?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                contagiousDiseaseConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="contagiousDiseaseConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="phisicalMentalProblemConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Possui algum problema físico ou mental que possa interferir em sua segurança ou de outras pessoas?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                phisicalMentalProblemConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="phisicalMentalProblemConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="crimeConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já foi preso ou condenado por algum delito ou crime, mesmo que tenha sido objeto de perdão,
                      anistia ou outra ação semelhante?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", crimeConfirmation !== "Sim" && "hidden")}
            >
              <FormField
                control={form.control}
                name="crimeConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="drugsProblemConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Já teve problemas com drogas?</FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                drugsProblemConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="drugsProblemConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="lawViolateConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já violou ou esteve envolvido em alguma conspiração para violar qualquer lei relacionada ao
                      controle de substâncias?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                lawViolateConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="lawViolateConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="prostitutionConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você está vindo para os Estados Unidos para se envolver em prostituição ou vício comercializado
                      ilegalmente ou esteve envolvido em prostituição ou procura de prostitutas nos últimos 10 anos?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                prostitutionConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="prostitutionConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="moneyLaundryConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já esteve envolvido ou pretende se envolver em lavagem de dinheiro?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                moneyLaundryConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="moneyLaundryConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="peopleTrafficConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já cometeu ou conspirou para cometer um crime de tráfico de pessoas nos Estados Unidos ou
                      fora dos Estados Unidos?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                peopleTrafficConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="peopleTrafficConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="helpPeopleTrafficConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já ajudou, encorajou, ajudou ou conspirou conscientemente com um indivíduo que cometeu ou
                      conspirou para cometer um crime grave de tráfico de pessoas nos Estados Unidos ou fora?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                helpPeopleTrafficConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="helpPeopleTrafficConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="parentPeopleTrafficConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você é cônjuge, filho ou filha de um indivíduo que cometeu ou conspirou para cometer um crime de
                      tráfico de pessoas nos Estados Unidos ou fora e, nos últimos cinco anos, beneficiou-se
                      conscientemente das atividades de tráfico?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                parentPeopleTrafficConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="parentPeopleTrafficConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="spyConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você procura se envolver em espionagem, sabotagem, violações de controle de exportação ou qualquer
                      outra atividade ilegal enquanto estiver nos Estados Unidos?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", spyConfirmation !== "Sim" && "hidden")}>
              <FormField
                control={form.control}
                name="spyConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="terrorismConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você procura se envolver em atividades terroristas enquanto estiver nos Estados Unidos ou já se
                      envolveu em atividades terroristas?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                terrorismConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="terrorismConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="financialAssistanceConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já prestou ou pretende fornecer assistência financeira ou outro tipo de apoio a terroristas
                      ou organizações terroristas?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                financialAssistanceConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="financialAssistanceConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="terrorismMemberConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você é membro ou representante de uma organização terrorista?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                terrorismMemberConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="terrorismMemberConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="parentTerrorismConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você é cônjuge, filho ou filha de um indivíduo que se envolveu em atividades terroristas,
                      inclusive fornecendo assistência financeira ou outro apoio a terroristas ou organizações
                      terroristas, nos últimos cinco anos?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                parentTerrorismConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="parentTerrorismConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="genocideConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já ordenou, incitou, cometeu, ajudou ou de alguma forma participou de genocídio?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", genocideConfirmation !== "Sim" && "hidden")}
            >
              <FormField
                control={form.control}
                name="genocideConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="tortureConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já cometeu, ordenou, incitou, ajudou ou participou de alguma forma em tortura?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", tortureConfirmation !== "Sim" && "hidden")}
            >
              <FormField
                control={form.control}
                name="tortureConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="assassinConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você cometeu, ordenou, incitou, ajudou ou de alguma forma participou em assassinatos
                      extrajudiciais, assassinatos políticos ou outros atos de violência?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", assassinConfirmation !== "Sim" && "hidden")}
            >
              <FormField
                control={form.control}
                name="assassinConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="childSoldierConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já se envolveu no recrutamento ou na utilização de crianças-soldados?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                childSoldierConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="childSoldierConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="religionLibertyConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você, enquanto servia como funcionário do governo, foi responsável ou executou diretamente, em
                      qualquer momento, violações particularmente graves da liberdade religiosa?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                religionLibertyConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="religionLibertyConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="abortConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já esteve diretamente envolvido no estabelecimento ou na aplicação de controles populacionais
                      que forçaram uma mulher a se submeter a um aborto contra a sua livre escolha ou um homem ou uma
                      mulher a se submeter à esterilização contra a sua livre vontade?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", abortConfirmation !== "Sim" && "hidden")}
            >
              <FormField
                control={form.control}
                name="abortConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="coerciveTransplantConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já esteve diretamente envolvido no transplante coercitivo de órgãos humanos ou tecidos
                      corporais?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                coerciveTransplantConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="coerciveTransplantConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="visaFraudConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já tentou obter ou ajudar outras pessoas a obter um visto, entrada nos Estados Unidos ou
                      qualquer outro benefício de imigração dos Estados Unidos por meio de fraude, deturpação
                      intencional ou outros meios ilegais?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                visaFraudConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="visaFraudConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="deportedConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Você já foi removido ou deportado de algum país?</FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", deportedConfirmation !== "Sim" && "hidden")}
            >
              <FormField
                control={form.control}
                name="deportedConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="childCustodyConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já recebeu a custódia de uma criança cidadã dos EUA fora dos Estados Unidos de uma pessoa que
                      recebeu a custódia legal de um tribunal dos EUA?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                childCustodyConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="childCustodyConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="lawViolationConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você votou nos Estados Unidos violando alguma lei ou regulamento?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6",
                lawViolationConfirmation !== "Sim" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="lawViolationConfirmationDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Explique</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6">
              <FormField
                control={form.control}
                name="avoidTaxConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já renunciou à cidadania dos Estados Unidos para evitar impostos?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div
            className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", avoidTaxConfirmation !== "Sim" && "hidden")}
          >
            <FormField
              control={form.control}
              name="avoidTaxConfirmationDetails"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="text-foreground">Explique</FormLabel>

                  <FormControl>
                    <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                  </FormControl>

                  <FormMessage className="text-sm text-destructive" />
                </FormItem>
              )}
            />
          </div>

          <div className="w-full flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-end">
            {isEditing ? (
              <>
                <Button
                  size="xl"
                  variant="outline"
                  type="button"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending}
                  onClick={() => router.push(`/resumo-formulario/${profileId}`)}
                >
                  Cancelar
                </Button>

                <Button
                  size="xl"
                  type="submit"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending}
                >
                  {isPending ? (
                    <>
                      Salvando
                      <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
                    </>
                  ) : (
                    <>
                      Salvar
                      <Save className="size-5" strokeWidth={1.5} />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="xl"
                  variant="outline"
                  type="button"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending}
                  onClick={onSave}
                >
                  {isSavePending ? (
                    <>
                      Salvando
                      <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
                    </>
                  ) : (
                    <>
                      Salvar
                      <Save className="size-5" strokeWidth={1.5} />
                    </>
                  )}
                </Button>

                <FinishFormConfirmation profileId={profileId} submit={handleSubmitOnModal} isPending={isPending} />
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
