import { TRPCError } from "@trpc/server";
import { addDays, format, isValid, parse } from "date-fns";
import { z } from "zod";
import {
  BudgetPaid,
  Category,
  PaymentStatus,
  Role,
  StatusDS,
  StatusForm,
  VisaClass,
  VisaStatus,
  VisaType,
} from "@prisma/client";

import { isUserAuthedProcedure, router } from "../trpc";
import prisma from "@/lib/prisma";
import { cpfsMatch, namesMatch } from "@/lib/person-name";

async function assertTitularPassportIdentity(
  profileId: string,
  fullName?: string | null,
  cpf?: string | null,
) {
  if (!fullName) {
    return;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      user: {
        select: {
          name: true,
          cpf: true,
          payerUserId: true,
        },
      },
    },
  });

  if (!profile || profile.user.payerUserId) {
    return;
  }

  if (!namesMatch(fullName, profile.user.name)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Nome completo do titular deve coincidir com o cadastro da conta.",
    });
  }

  if (!cpfsMatch(cpf, profile.user.cpf)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "CPF do titular deve coincidir com o cadastro da conta.",
    });
  }
}

async function syncPassportPersonName(profileId: string, fullName?: string | null) {
  if (!fullName) {
    return;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      userId: true,
      user: {
        select: {
          payerUserId: true,
        },
      },
    },
  });

  if (!profile) {
    return;
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { name: fullName },
  });

  if (profile.user.payerUserId) {
    await prisma.user.update({
      where: { id: profile.userId },
      data: { name: fullName },
    });
  }
}

type ServiceCategory = "american_visa" | "passport";

export type AreaMember = {
  userId: string;
  name: string;
  isTitular: boolean;
  profileId: string | null;
  statusForm: StatusForm;
  statusDS: StatusDS | null;
  visaStatus: VisaStatus | null;
  CASVDate: Date | null;
  interviewDate: Date | null;
  DSNumber: string | null;
  protocol: string | null;
  expireDate: Date | null;
  passportType: string | null;
  formStep: number;
  formLocked: boolean;
  updatedAt: Date | null;
  canEdit: boolean;
  interviewDocs: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
};

function hasStarted(member: AreaMember) {
  return (
    member.statusForm === StatusForm.filling ||
    member.statusForm === StatusForm.filled
  );
}

function isFormLocked(statusForm: StatusForm, formLocked: boolean | null) {
  return statusForm === StatusForm.filled && formLocked !== false;
}

function canEditMember(statusForm: StatusForm, formLocked: boolean | null) {
  if (statusForm === StatusForm.filling) {
    return true;
  }

  if (statusForm === StatusForm.filled && formLocked === false) {
    return true;
  }

  return false;
}

function parseOptionalDate(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

async function getAccountByEmail(email: string) {
  const account = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Conta não encontrada",
    });
  }

  return account;
}

async function resetServiceForm(profileId: string, userName: string, category: Category) {
  await prisma.notification.deleteMany({
    where: { profileId },
  });

  if (category === Category.passport) {
    await prisma.passportForm.deleteMany({
      where: { profileId },
    });
    await prisma.passportForm.create({
      data: {
        profile: {
          connect: { id: profileId },
        },
      },
    });
  } else {
    await prisma.form.deleteMany({
      where: { profileId },
    });
    await prisma.form.create({
      data: {
        profile: {
          connect: { id: profileId },
        },
      },
    });
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      name: userName,
      statusForm: StatusForm.awaiting,
      formStep: 0,
      formLocked: null,
    },
  });
}

async function removeDependentFromService(
  userId: string,
  profileId: string,
  category: Category,
) {
  await prisma.notification.deleteMany({
    where: { profileId },
  });
  await prisma.comments.deleteMany({
    where: { profileId },
  });
  await prisma.form.deleteMany({
    where: { profileId },
  });
  await prisma.passportForm.deleteMany({
    where: { profileId },
  });
  await prisma.profile.delete({
    where: { id: profileId },
  });

  await prisma.user.update({
    where: { id: userId },
    data:
      category === Category.passport
        ? { wantsPassport: false }
        : { wantsAmericanVisa: false },
  });

  const remaining = await prisma.profile.count({
    where: { userId },
  });
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      payerUserId: true,
      wantsAmericanVisa: true,
      wantsPassport: true,
    },
  });

  if (
    remaining === 0 &&
    member?.payerUserId &&
    !member.wantsAmericanVisa &&
    !member.wantsPassport
  ) {
    await prisma.financeEntry.deleteMany({
      where: { userId },
    });
    await prisma.serviceCost.deleteMany({
      where: { userId },
    });
    await prisma.annotations.deleteMany({
      where: { userId },
    });
    await prisma.comments.deleteMany({
      where: { authorId: userId },
    });
    await prisma.account.deleteMany({
      where: { userId },
    });
    await prisma.session.deleteMany({
      where: { userId },
    });
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

async function getGroupServiceMembers(
  account: { id: string; group: string | null },
  category: ServiceCategory,
) {
  const categoryEnum =
    category === "passport" ? Category.passport : Category.american_visa;

  const wantsService =
    category === "passport"
      ? { wantsPassport: true }
      : { wantsAmericanVisa: true };
  const hasServiceProfile = {
    profiles: {
      some: {
        category: categoryEnum,
      },
    },
  };

  const users = account.group
    ? await prisma.user.findMany({
        where: {
          role: Role.CLIENT,
          group: account.group,
          OR: [wantsService, hasServiceProfile],
        },
        include: {
          interviewDocuments: {
            orderBy: { createdAt: "desc" },
            select: { id: true, fileName: true, fileUrl: true },
          },
          profiles: {
            where: {
              category: categoryEnum,
            },
            include: {
              form: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              passportForm: {
                select: {
                  serviceType: true,
                  fullName: true,
                },
              },
            },
          },
        },
      })
    : await prisma.user.findMany({
        where: {
          id: account.id,
          OR: [wantsService, hasServiceProfile],
        },
        include: {
          interviewDocuments: {
            orderBy: { createdAt: "desc" },
            select: { id: true, fileName: true, fileUrl: true },
          },
          profiles: {
            where: {
              category: categoryEnum,
            },
            include: {
              form: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              passportForm: {
                select: {
                  serviceType: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

  const members: AreaMember[] = users
    .map((user) => {
      const profile = user.profiles[0] ?? null;
      const hasDraft =
        Boolean(profile?.form?.firstName || profile?.form?.lastName) ||
        Boolean(profile?.passportForm?.fullName || profile?.passportForm?.serviceType);
      const statusForm =
        profile?.statusForm === StatusForm.awaiting && hasDraft
          ? StatusForm.filling
          : (profile?.statusForm ?? StatusForm.awaiting);
      const formName = [profile?.form?.firstName, profile?.form?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const displayName =
        (category === "passport"
          ? profile?.passportForm?.fullName?.trim() || formName
          : formName) || user.name;

      return {
        userId: user.id,
        name: displayName,
        isTitular: !user.payerUserId,
        profileId: profile?.id ?? null,
        statusForm,
        statusDS: profile?.statusDS ?? null,
        visaStatus: profile?.visaStatus ?? null,
        CASVDate: profile?.CASVDate ?? null,
        interviewDate: profile?.interviewDate ?? null,
        DSNumber: profile?.DSNumber ?? null,
        protocol: profile?.protocol ?? null,
        expireDate: profile?.expireDate ?? null,
        passportType: profile?.passportForm?.serviceType ?? null,
        formStep: profile?.formStep ?? 0,
        formLocked: isFormLocked(statusForm, profile?.formLocked ?? null),
        updatedAt: profile?.updatedAt ?? null,
        canEdit: canEditMember(statusForm, profile?.formLocked ?? null),
        interviewDocs: user.interviewDocuments.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
        })),
      };
    })
    .sort((a, b) => {
      if (a.isTitular !== b.isTitular) {
        return a.isTitular ? -1 : 1;
      }

      return a.name.localeCompare(b.name, "pt-BR");
    });

  const startedCount = members.filter(hasStarted).length;
  const unlockedCount = Math.min(members.length, startedCount + 1);
  const unlockedMembers = members.slice(0, unlockedCount);
  const current =
    unlockedMembers.find((member) => member.statusForm === StatusForm.awaiting) ??
    null;
  const checklist = members
    .filter(hasStarted)
    .sort((a, b) => {
      if (a.isTitular !== b.isTitular) {
        return a.isTitular ? -1 : 1;
      }

      const aTime = a.updatedAt?.getTime() ?? 0;
      const bTime = b.updatedAt?.getTime() ?? 0;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return a.name.localeCompare(b.name, "pt-BR");
    });

  return {
    members,
    unlockedMembers,
    current,
    checklist,
    pendingCount: members.filter(
      (member) => member.statusForm !== StatusForm.filled,
    ).length,
  };
}

const passportFormInput = z.object({
  profileId: z.string().min(1),
  serviceType: z.string().optional(),
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  birthCity: z.string().optional(),
  birthState: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  rg: z.string().optional(),
  rgIssuer: z.string().optional(),
  rgDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  currentPassportNumber: z.string().optional(),
  currentPassportExpire: z.string().optional(),
  notes: z.string().optional(),
});

export const clientRouter = router({
  getProfiles: isUserAuthedProcedure.query(async (opts) => {
    const { user } = opts.ctx.user;
    const email = user?.email;

    if (!email) {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Usuário não encontrado",
      });
    }

    const account = await prisma.user.findFirst({
      where: {
        email,
      },
      include: {
        profiles: {
          where: {
            category: Category.american_visa,
          },
        },
      },
    });

    if (!account) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Conta não encontrada",
      });
    }

    return { profiles: account.profiles };
  }),
  getAreaData: isUserAuthedProcedure.query(async (opts) => {
    const { user } = opts.ctx.user;
    const email = user?.email;

    if (!email) {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Usuário não encontrado",
      });
    }

    const account = await getAccountByEmail(email);
    const [visa, passport] = await Promise.all([
      getGroupServiceMembers(account, "american_visa"),
      getGroupServiceMembers(account, "passport"),
    ]);

    return {
      visa: {
        current: visa.current,
        checklist: visa.checklist,
        pendingCount: visa.pendingCount,
        hasService: visa.members.length > 0,
        canAddDependent: !account.payerUserId,
      },
      passport: {
        current: passport.current,
        checklist: passport.checklist,
        pendingCount: passport.pendingCount,
        hasService: passport.members.length > 0,
        canAddDependent: !account.payerUserId,
      },
    };
  }),
  startMemberForm: isUserAuthedProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        category: z.enum(["american_visa", "passport"]),
      }),
    )
    .mutation(async (opts) => {
      const { user } = opts.ctx.user;
      const email = user?.email;

      if (!email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não encontrado",
        });
      }

      const account = await getAccountByEmail(email);
      const { unlockedMembers } = await getGroupServiceMembers(
        account,
        opts.input.category,
      );
      const target = unlockedMembers.find(
        (member) => member.userId === opts.input.userId,
      );

      if (!target) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Finalize ou salve o formulário anterior para liberar o próximo.",
        });
      }

      const categoryEnum =
        opts.input.category === "passport"
          ? Category.passport
          : Category.american_visa;

      let profileId = target.profileId;

      if (!profileId) {
        const memberUser = await prisma.user.findUnique({
          where: {
            id: target.userId,
          },
        });

        if (!memberUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Membro do grupo não encontrado",
          });
        }

        const profile = await prisma.profile.create({
          data: {
            name: memberUser.name,
            cpf: memberUser.cpf ?? undefined,
            DSNumber: "",
            DSValid: addDays(new Date(), 30),
            visaType: VisaType.primeiro_visto,
            visaClass: VisaClass.B2_B1,
            category: categoryEnum,
            paymentStatus: PaymentStatus.pending,
            user: {
              connect: {
                id: memberUser.id,
              },
            },
          },
        });

        profileId = profile.id;
      }

      if (opts.input.category === "american_visa") {
        const existingForm = await prisma.form.findFirst({
          where: {
            profileId,
          },
        });

        if (!existingForm) {
          await prisma.form.create({
            data: {
              profile: {
                connect: {
                  id: profileId,
                },
              },
            },
          });
        }
      } else {
        const existingPassportForm = await prisma.passportForm.findUnique({
          where: {
            profileId,
          },
        });

        if (!existingPassportForm) {
          await prisma.passportForm.create({
            data: {
              profile: {
                connect: {
                  id: profileId,
                },
              },
            },
          });
        }
      }

      return { profileId };
    }),
  addDependent: isUserAuthedProcedure
    .input(
      z.object({
        category: z.enum(["american_visa", "passport"]),
      }),
    )
    .mutation(async (opts) => {
      const { user } = opts.ctx.user;
      const email = user?.email;

      if (!email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não encontrado",
        });
      }

      const account = await getAccountByEmail(email);

      if (account.payerUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o titular pode adicionar dependentes.",
        });
      }

      const group = account.group?.trim() || account.name;

      if (!account.group) {
        await prisma.user.update({
          where: { id: account.id },
          data: { group },
        });
      }

      const categoryEnum =
        opts.input.category === "passport"
          ? Category.passport
          : Category.american_visa;
      const stamp = Date.now();

      const member = await prisma.user.create({
        data: {
          name: "Dependente",
          email: `dependente.${account.id}.${stamp}@grupo.cpvistos`,
          password: `dep-${account.id}-${stamp}`,
          role: Role.CLIENT,
          group,
          payerUserId: account.id,
          wantsAmericanVisa: categoryEnum === Category.american_visa,
          wantsPassport: categoryEnum === Category.passport,
        },
      });

      await prisma.financeEntry.create({
        data: {
          userId: member.id,
          amount: null,
          status: BudgetPaid.pending,
        },
      });

      await prisma.serviceCost.create({
        data: {
          userId: member.id,
        },
      });

      const profile = await prisma.profile.create({
        data: {
          name: "Dependente",
          DSNumber: "",
          DSValid: addDays(new Date(), 30),
          visaType: VisaType.primeiro_visto,
          visaClass: VisaClass.B2_B1,
          category: categoryEnum,
          paymentStatus: PaymentStatus.pending,
          user: {
            connect: { id: member.id },
          },
        },
      });

      if (categoryEnum === Category.american_visa) {
        await prisma.form.create({
          data: {
            profile: {
              connect: { id: profile.id },
            },
          },
        });
      } else {
        await prisma.passportForm.create({
          data: {
            profile: {
              connect: { id: profile.id },
            },
          },
        });
      }

      return { profileId: profile.id, userId: member.id };
    }),
  deleteChecklistRow: isUserAuthedProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
        category: z.enum(["american_visa", "passport"]),
      }),
    )
    .mutation(async (opts) => {
      const { user } = opts.ctx.user;
      const email = user?.email;

      if (!email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não encontrado",
        });
      }

      const account = await getAccountByEmail(email);

      if (account.payerUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o titular pode excluir linhas do checklist.",
        });
      }

      const categoryEnum =
        opts.input.category === "passport"
          ? Category.passport
          : Category.american_visa;

      const profile = await prisma.profile.findUnique({
        where: {
          id: opts.input.profileId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              group: true,
              payerUserId: true,
            },
          },
        },
      });

      if (!profile || profile.category !== categoryEnum) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Linha do checklist não encontrada",
        });
      }

      const sameAccount = profile.userId === account.id;
      const sameGroup =
        Boolean(account.group) && profile.user.group === account.group;

      if (!sameAccount && !sameGroup) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode excluir esta linha.",
        });
      }

      if (!profile.user.payerUserId) {
        await resetServiceForm(profile.id, profile.user.name, categoryEnum);
        return {
          message:
            "Linha do titular excluída. O card voltou para um novo preenchimento.",
        };
      }

      await removeDependentFromService(
        profile.user.id,
        profile.id,
        categoryEnum,
      );

      return {
        message: "Dependente removido do checklist.",
      };
    }),
  getPassportForm: isUserAuthedProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
      }),
    )
    .query(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: {
          id: opts.input.profileId,
        },
        include: {
          passportForm: true,
        },
      });

      if (!profile || profile.category !== Category.passport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário de passaporte não encontrado",
        });
      }

      return {
        form: profile.passportForm,
        statusForm: profile.statusForm,
        formLocked: isFormLocked(profile.statusForm, profile.formLocked),
        profileName: profile.name,
      };
    }),
  savePassportForm: isUserAuthedProcedure
    .input(passportFormInput)
    .mutation(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: {
          id: opts.input.profileId,
        },
      });

      if (!profile || profile.category !== Category.passport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de passaporte não encontrado",
        });
      }

      if (isFormLocked(profile.statusForm, profile.formLocked)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Formulário enviado e bloqueado. Aguarde o desbloqueio do administrador.",
        });
      }

      await assertTitularPassportIdentity(
        opts.input.profileId,
        opts.input.fullName,
        opts.input.cpf,
      );

      const data = {
        serviceType: opts.input.serviceType || null,
        fullName: opts.input.fullName || null,
        cpf: opts.input.cpf || null,
        birthDate: parseOptionalDate(opts.input.birthDate),
        birthCity: opts.input.birthCity || null,
        birthState: opts.input.birthState || null,
        motherName: opts.input.motherName || null,
        fatherName: opts.input.fatherName || null,
        rg: opts.input.rg || null,
        rgIssuer: opts.input.rgIssuer || null,
        rgDate: parseOptionalDate(opts.input.rgDate),
        phone: opts.input.phone || null,
        email: opts.input.email || null,
        address: opts.input.address || null,
        currentPassportNumber: opts.input.currentPassportNumber || null,
        currentPassportExpire: parseOptionalDate(opts.input.currentPassportExpire),
        notes: opts.input.notes || null,
      };

      await prisma.passportForm.upsert({
        where: {
          profileId: opts.input.profileId,
        },
        create: {
          ...data,
          profile: {
            connect: {
              id: opts.input.profileId,
            },
          },
        },
        update: data,
      });

      await syncPassportPersonName(opts.input.profileId, opts.input.fullName);

      await prisma.profile.update({
        where: {
          id: opts.input.profileId,
        },
        data: {
          statusForm: StatusForm.filling,
        },
      });

      return { message: "Formulário de passaporte salvo" };
    }),
  submitPassportForm: isUserAuthedProcedure
    .input(passportFormInput)
    .mutation(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: {
          id: opts.input.profileId,
        },
      });

      if (!profile || profile.category !== Category.passport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil de passaporte não encontrado",
        });
      }

      if (isFormLocked(profile.statusForm, profile.formLocked)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Formulário enviado e bloqueado. Aguarde o desbloqueio do administrador.",
        });
      }

      if (!opts.input.serviceType || !opts.input.fullName || !opts.input.cpf) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Preencha tipo de serviço, nome e CPF para enviar.",
        });
      }

      await assertTitularPassportIdentity(
        opts.input.profileId,
        opts.input.fullName,
        opts.input.cpf,
      );

      const data = {
        serviceType: opts.input.serviceType,
        fullName: opts.input.fullName,
        cpf: opts.input.cpf,
        birthDate: parseOptionalDate(opts.input.birthDate),
        birthCity: opts.input.birthCity || null,
        birthState: opts.input.birthState || null,
        motherName: opts.input.motherName || null,
        fatherName: opts.input.fatherName || null,
        rg: opts.input.rg || null,
        rgIssuer: opts.input.rgIssuer || null,
        rgDate: parseOptionalDate(opts.input.rgDate),
        phone: opts.input.phone || null,
        email: opts.input.email || null,
        address: opts.input.address || null,
        currentPassportNumber: opts.input.currentPassportNumber || null,
        currentPassportExpire: parseOptionalDate(opts.input.currentPassportExpire),
        notes: opts.input.notes || null,
      };

      await prisma.passportForm.upsert({
        where: {
          profileId: opts.input.profileId,
        },
        create: {
          ...data,
          profile: {
            connect: {
              id: opts.input.profileId,
            },
          },
        },
        update: data,
      });

      await syncPassportPersonName(opts.input.profileId, opts.input.fullName);

      await prisma.profile.update({
        where: {
          id: opts.input.profileId,
        },
        data: {
          statusForm: StatusForm.filled,
          formLocked: true,
        },
      });

      return { message: "Formulário de passaporte enviado" };
    }),
  getProfileBirthDate: isUserAuthedProcedure
    .input(
      z.object({
        profileId: z.string().min(1, "ID obrigatório"),
      }),
    )
    .query(async (opts) => {
      const currentProfile = await prisma.profile.findUnique({
        where: {
          id: opts.input.profileId,
        },
      });

      if (!currentProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perfil não encontrado",
        });
      }

      if (!currentProfile.birthDate) {
        return null;
      }

      return format(currentProfile.birthDate, "dd/MM/yyyy");
    }),
});
