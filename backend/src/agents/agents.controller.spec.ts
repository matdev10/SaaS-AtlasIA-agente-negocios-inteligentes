import { Test, TestingModule } from '@nestjs/testing';

import { UserRole } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

describe('AgentsController', () => {
  let controller: AgentsController;

  const agentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
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
      controllers: [AgentsController],
      providers: [{ provide: AgentsService, useValue: agentsService }],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
  });

  it('delegates create', async () => {
    const dto = { name: 'Soporte' };
    agentsService.create.mockResolvedValue({ id: 'agent-1', ...dto });

    await expect(controller.create(user, dto)).resolves.toEqual({
      id: 'agent-1',
      name: 'Soporte',
    });
    expect(agentsService.create).toHaveBeenCalledWith(user.companyId, dto);
  });

  it('delegates findAll', async () => {
    agentsService.findAll.mockResolvedValue([]);

    await expect(controller.findAll(user)).resolves.toEqual([]);
    expect(agentsService.findAll).toHaveBeenCalledWith(user.companyId);
  });

  it('delegates findOne', async () => {
    agentsService.findOne.mockResolvedValue({ id: 'agent-1' });

    await expect(controller.findOne('agent-1', user)).resolves.toEqual({
      id: 'agent-1',
    });
    expect(agentsService.findOne).toHaveBeenCalledWith(
      'agent-1',
      user.companyId,
    );
  });

  it('delegates update', async () => {
    const dto = { tone: 'formal' };
    agentsService.update.mockResolvedValue({ id: 'agent-1', ...dto });

    await expect(controller.update('agent-1', user, dto)).resolves.toEqual({
      id: 'agent-1',
      tone: 'formal',
    });
    expect(agentsService.update).toHaveBeenCalledWith(
      'agent-1',
      user.companyId,
      dto,
    );
  });

  it('delegates archive', async () => {
    agentsService.archive.mockResolvedValue({
      id: 'agent-1',
      status: 'ARCHIVED',
    });

    await expect(controller.archive('agent-1', user)).resolves.toEqual({
      id: 'agent-1',
      status: 'ARCHIVED',
    });
    expect(agentsService.archive).toHaveBeenCalledWith(
      'agent-1',
      user.companyId,
    );
  });
});
