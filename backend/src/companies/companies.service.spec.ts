import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../database/prisma.service';
import { OnboardingStep } from '../generated/prisma/enums';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const prisma = {
    company: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    document: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('returns the company overview for the authenticated tenant', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      name: 'Acme',
      contactEmail: 'a@acme.com',
      phone: null,
      industry: 'Software',
      website: 'https://acme.com',
      language: 'es',
      timezone: 'America/Argentina/Buenos_Aires',
      businessHours: 'Lun-Vie 9 a 18',
      status: 'TRIAL',
      onboardingStep: OnboardingStep.COMPANY_PROFILE,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      subscriptions: [
        {
          id: 'sub-1',
          status: 'TRIAL',
          startsAt: new Date('2026-01-01'),
          endsAt: null,
          renewsAt: null,
          plan: {
            id: 'plan-1',
            name: 'Free',
            maxUsers: 2,
            maxAgents: 1,
            maxDocuments: 10,
            maxConversations: 100,
            includesWidget: true,
            includesRag: true,
          },
        },
      ],
      agents: [
        {
          id: 'agent-1',
          name: 'Agente principal',
          description: null,
          status: 'DRAFT',
          updatedAt: new Date('2026-01-02'),
          widget: {
            id: 'widget-1',
            name: 'Widget principal',
            status: 'INACTIVE',
            position: 'bottom-right',
            primaryColor: null,
            allowedDomains: ['https://acme.com/ayuda'],
            updatedAt: new Date('2026-01-02'),
          },
          knowledgeBase: {
            id: 'kb-1',
            status: 'ACTIVE',
            _count: { documents: 2 },
          },
          _count: { conversations: 3 },
        },
      ],
      _count: {
        users: 1,
        agents: 1,
        conversations: 3,
      },
    });
    prisma.document.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const result = await service.findMine('company-1');

    expect(result.name).toBe('Acme');
    expect(result.onboardingStep).toBe(OnboardingStep.COMPANY_PROFILE);
    expect(result.plan?.name).toBe('Free');
    expect(result.stats.documents).toBe(2);
    expect(result.deployment.pages).toEqual([
      'https://acme.com',
      'https://acme.com/ayuda',
    ]);
  });

  it('advances onboarding when company profile becomes complete', async () => {
    prisma.company.findFirst
      .mockResolvedValueOnce({ id: 'company-1' })
      .mockResolvedValueOnce({
        id: 'company-1',
        onboardingStep: OnboardingStep.WELCOME,
        onboardingCompleted: false,
        onboardingCompletedAt: null,
      });
    prisma.company.update
      .mockResolvedValueOnce({
        id: 'company-1',
        name: 'Acme',
        contactEmail: 'a@acme.com',
        phone: null,
        industry: 'Software',
        website: 'https://acme.com',
        language: 'es',
        timezone: null,
        businessHours: null,
        status: 'TRIAL',
        onboardingStep: OnboardingStep.WELCOME,
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-03'),
      })
      .mockResolvedValueOnce({
        id: 'company-1',
        onboardingStep: OnboardingStep.COMPANY_PROFILE,
        onboardingCompleted: false,
        onboardingCompletedAt: null,
      });

    const result = await service.updateMine('company-1', {
      industry: 'Software',
      website: 'https://acme.com',
    });

    expect(result.onboardingStep).toBe(OnboardingStep.COMPANY_PROFILE);
  });

  it('throws when the company does not exist for the tenant', async () => {
    prisma.company.findFirst.mockResolvedValue(null);

    await expect(service.findMine('company-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
