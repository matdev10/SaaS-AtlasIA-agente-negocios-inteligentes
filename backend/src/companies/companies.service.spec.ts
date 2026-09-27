import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../database/prisma.service';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const prisma = {
    company: {
      findFirst: jest.fn(),
      update: jest.fn(),
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

  it('returns the company for the authenticated tenant', async () => {
    const company = { id: 'company-1', name: 'Acme' };
    prisma.company.findFirst.mockResolvedValue(company);

    await expect(service.findMine('company-1')).resolves.toEqual(company);
  });

  it('throws when the company does not exist for the tenant', async () => {
    prisma.company.findFirst.mockResolvedValue(null);

    await expect(service.findMine('company-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates only the authenticated tenant company', async () => {
    const company = { id: 'company-1', name: 'Acme' };
    const updated = { ...company, name: 'Acme Updated' };

    prisma.company.findFirst.mockResolvedValue(company);
    prisma.company.update.mockResolvedValue(updated);

    await expect(
      service.updateMine('company-1', { name: 'Acme Updated' }),
    ).resolves.toEqual(updated);
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: { name: 'Acme Updated' },
    });
  });
});
