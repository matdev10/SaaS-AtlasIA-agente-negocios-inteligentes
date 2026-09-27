import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../database/prisma.service';
import { AgentStatus } from '../generated/prisma/client';
import { AgentsService } from './agents.service';

describe('AgentsService', () => {
  let service: AgentsService;

  const prisma = {
    company: {
      findUnique: jest.fn(),
    },
    agent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  describe('create', () => {
    it('creates an agent with knowledge base when under plan limit', async () => {
      const created = {
        id: 'agent-1',
        companyId: 'company-1',
        name: 'Soporte',
        status: AgentStatus.DRAFT,
        knowledgeBase: { id: 'kb-1', name: 'KB', status: 'ACTIVE' },
      };

      prisma.company.findUnique.mockResolvedValue({
        status: 'TRIAL',
        subscriptions: [{ plan: { maxAgents: 2 } }],
      });
      prisma.agent.count.mockResolvedValue(1);
      prisma.agent.create.mockResolvedValue(created);

      await expect(
        service.create('company-1', { name: 'Soporte' }),
      ).resolves.toEqual(created);
    });

    it('rejects create when plan agent limit is reached', async () => {
      prisma.company.findUnique.mockResolvedValue({
        status: 'TRIAL',
        subscriptions: [{ plan: { maxAgents: 1 } }],
      });
      prisma.agent.count.mockResolvedValue(1);

      await expect(
        service.create('company-1', { name: 'Otro' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('returns the tenant agent', async () => {
      const agent = { id: 'agent-1', companyId: 'company-1', name: 'Soporte' };
      prisma.agent.findFirst.mockResolvedValue(agent);

      await expect(service.findOne('agent-1', 'company-1')).resolves.toEqual(
        agent,
      );
    });

    it('throws when agent is missing for tenant', async () => {
      prisma.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('agent-1', 'company-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a tenant agent', async () => {
      const agent = {
        id: 'agent-1',
        companyId: 'company-1',
        name: 'Soporte',
        tone: 'amigable',
      };

      prisma.agent.findFirst.mockResolvedValue(agent);
      prisma.agent.update.mockResolvedValue({
        ...agent,
        tone: 'formal',
      });

      await expect(
        service.update('agent-1', 'company-1', { tone: 'formal' }),
      ).resolves.toEqual({ ...agent, tone: 'formal' });
    });
  });

  describe('archive', () => {
    it('archives a tenant agent', async () => {
      const agent = {
        id: 'agent-1',
        companyId: 'company-1',
        name: 'Soporte',
        status: AgentStatus.DRAFT,
      };

      prisma.agent.findFirst.mockResolvedValue(agent);
      prisma.agent.update.mockResolvedValue({
        ...agent,
        status: AgentStatus.ARCHIVED,
      });

      await expect(service.archive('agent-1', 'company-1')).resolves.toEqual({
        ...agent,
        status: AgentStatus.ARCHIVED,
      });
    });
  });
});
