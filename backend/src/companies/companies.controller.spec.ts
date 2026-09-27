import { Test, TestingModule } from '@nestjs/testing';

import { UserRole } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  const companiesService = {
    findMine: jest.fn(),
    updateMine: jest.fn(),
  };

  const user: JwtPayload = {
    sub: 'user-1',
    companyId: 'company-1',
    email: 'admin@acme.com',
    role: UserRole.COMPANY_ADMIN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [{ provide: CompaniesService, useValue: companiesService }],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('delegates findMine to CompaniesService', async () => {
    const company = { id: 'company-1', name: 'Acme' };
    companiesService.findMine.mockResolvedValue(company);

    await expect(controller.findMine(user)).resolves.toEqual(company);
    expect(companiesService.findMine).toHaveBeenCalledWith(user.companyId);
  });

  it('delegates updateMine to CompaniesService', async () => {
    const dto = { name: 'Acme Updated' };
    const company = { id: 'company-1', ...dto };
    companiesService.updateMine.mockResolvedValue(company);

    await expect(controller.updateMine(user, dto)).resolves.toEqual(company);
    expect(companiesService.updateMine).toHaveBeenCalledWith(
      user.companyId,
      dto,
    );
  });
});
