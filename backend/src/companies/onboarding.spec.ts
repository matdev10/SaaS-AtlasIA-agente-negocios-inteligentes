import { ConflictException, NotFoundException } from '@nestjs/common';

import { OnboardingStep } from '../generated/prisma/enums';
import {
  advanceOnboarding,
  isCompanyProfileComplete,
} from './onboarding';

describe('onboarding helpers', () => {
  const prisma = {
    company: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects a complete company profile', () => {
    expect(
      isCompanyProfileComplete({
        industry: 'Software',
        website: 'https://acme.com',
      }),
    ).toBe(true);
    expect(
      isCompanyProfileComplete({ industry: 'Software', website: '' }),
    ).toBe(false);
  });

  it('advances from WELCOME to COMPANY_PROFILE', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'c1',
      onboardingStep: OnboardingStep.WELCOME,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    });
    prisma.company.update.mockResolvedValue({
      id: 'c1',
      onboardingStep: OnboardingStep.COMPANY_PROFILE,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    });

    await expect(
      advanceOnboarding(
        prisma as never,
        'c1',
        OnboardingStep.WELCOME,
        OnboardingStep.COMPANY_PROFILE,
      ),
    ).resolves.toMatchObject({
      onboardingStep: OnboardingStep.COMPANY_PROFILE,
    });
  });

  it('is idempotent when already ahead', async () => {
    const company = {
      id: 'c1',
      onboardingStep: OnboardingStep.AGENT_CONFIG,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    };
    prisma.company.findFirst.mockResolvedValue(company);

    await expect(
      advanceOnboarding(
        prisma as never,
        'c1',
        OnboardingStep.WELCOME,
        OnboardingStep.COMPANY_PROFILE,
      ),
    ).resolves.toEqual(company);
    expect(prisma.company.update).not.toHaveBeenCalled();
  });

  it('rejects skipping steps', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'c1',
      onboardingStep: OnboardingStep.WELCOME,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    });

    await expect(
      advanceOnboarding(
        prisma as never,
        'c1',
        OnboardingStep.WELCOME,
        OnboardingStep.AGENT_CONFIG,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when company is missing', async () => {
    prisma.company.findFirst.mockResolvedValue(null);

    await expect(
      advanceOnboarding(
        prisma as never,
        'missing',
        OnboardingStep.WELCOME,
        OnboardingStep.COMPANY_PROFILE,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
