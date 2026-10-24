import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { OnboardingStep } from '../generated/prisma/enums';

export const ONBOARDING_ORDER: OnboardingStep[] = [
  OnboardingStep.WELCOME,
  OnboardingStep.COMPANY_PROFILE,
  OnboardingStep.AGENT_CONFIG,
  OnboardingStep.KNOWLEDGE,
  OnboardingStep.TEST_CHAT,
  OnboardingStep.PUBLISH,
  OnboardingStep.COMPLETED,
];

const onboardingSelect = {
  id: true,
  onboardingStep: true,
  onboardingCompleted: true,
  onboardingCompletedAt: true,
} as const;

export function isCompanyProfileComplete(input: {
  industry?: string | null;
  website?: string | null;
}) {
  return Boolean(input.industry?.trim() && input.website?.trim());
}

export async function advanceOnboarding(
  prisma: PrismaService,
  companyId: string,
  expectedCurrentStep: OnboardingStep,
  nextStep: OnboardingStep,
) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      status: {
        not: 'ARCHIVED',
      },
    },
    select: onboardingSelect,
  });

  if (!company) {
    throw new NotFoundException('Empresa no encontrada');
  }

  if (
    company.onboardingCompleted ||
    company.onboardingStep === OnboardingStep.COMPLETED
  ) {
    return company;
  }

  const currentIndex = ONBOARDING_ORDER.indexOf(company.onboardingStep);
  const expectedIndex = ONBOARDING_ORDER.indexOf(expectedCurrentStep);
  const nextIndex = ONBOARDING_ORDER.indexOf(nextStep);

  if (currentIndex < 0 || expectedIndex < 0 || nextIndex < 0) {
    throw new ConflictException('Paso de onboarding inválido');
  }

  if (currentIndex > expectedIndex) {
    return company;
  }

  if (currentIndex < expectedIndex) {
    throw new ConflictException(
      `Onboarding en ${company.onboardingStep}; se esperaba ${expectedCurrentStep}`,
    );
  }

  if (nextIndex !== currentIndex + 1) {
    throw new ConflictException(
      `Solo se puede avanzar de ${expectedCurrentStep} a ${ONBOARDING_ORDER[currentIndex + 1]}`,
    );
  }

  return prisma.company.update({
    where: { id: companyId },
    data: {
      onboardingStep: nextStep,
      ...(nextStep === OnboardingStep.COMPLETED
        ? {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
          }
        : {}),
    },
    select: onboardingSelect,
  });
}

/** Avanza solo si el paso actual coincide; si aún no llegó, no falla. */
export async function softAdvanceOnboarding(
  prisma: PrismaService,
  companyId: string,
  expectedCurrentStep: OnboardingStep,
  nextStep: OnboardingStep,
) {
  try {
    return await advanceOnboarding(
      prisma,
      companyId,
      expectedCurrentStep,
      nextStep,
    );
  } catch (error) {
    if (error instanceof ConflictException) {
      return null;
    }
    throw error;
  }
}

export function isAgentConfigured(input: {
  tone?: string | null;
  instructions?: string | null;
  welcomeMessage?: string | null;
}) {
  return Boolean(
    input.tone?.trim() &&
      input.instructions?.trim() &&
      input.welcomeMessage?.trim(),
  );
}
