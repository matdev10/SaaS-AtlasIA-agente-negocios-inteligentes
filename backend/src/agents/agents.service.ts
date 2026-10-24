import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  isAgentConfigured,
  softAdvanceOnboarding,
} from '../companies/onboarding';
import { PrismaService } from '../database/prisma.service';
import { AgentStatus } from '../generated/prisma/client';
import { OnboardingStep } from '../generated/prisma/enums';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

const agentSelect = {
  id: true,
  companyId: true,
  name: true,
  description: true,
  tone: true,
  instructions: true,
  welcomeMessage: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  knowledgeBase: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} as const;

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: CreateAgentDto) {
    await this.assertCanCreateAgent(companyId);

    return this.prisma.agent.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        tone: data.tone,
        instructions: data.instructions,
        welcomeMessage: data.welcomeMessage,
        status: data.status ?? AgentStatus.DRAFT,
        knowledgeBase: {
          create: {
            name: `Base de conocimiento · ${data.name}`,
          },
        },
      },
      select: agentSelect,
    });
  }

  async findAll(companyId: string) {
    return this.prisma.agent.findMany({
      where: {
        companyId,
        status: {
          not: AgentStatus.ARCHIVED,
        },
      },
      select: agentSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, companyId },
      select: agentSelect,
    });

    if (!agent) {
      throw new NotFoundException('Agente no encontrado');
    }

    return agent;
  }

  async update(id: string, companyId: string, data: UpdateAgentDto) {
    const current = await this.findOne(id, companyId);

    const updated = await this.prisma.agent.update({
      where: { id },
      data,
      select: agentSelect,
    });

    const configured = isAgentConfigured({
      tone: updated.tone ?? current.tone,
      instructions: updated.instructions ?? current.instructions,
      welcomeMessage: updated.welcomeMessage ?? current.welcomeMessage,
    });

    if (configured) {
      await softAdvanceOnboarding(
        this.prisma,
        companyId,
        OnboardingStep.COMPANY_PROFILE,
        OnboardingStep.AGENT_CONFIG,
      );
    }

    return updated;
  }

  async archive(id: string, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.agent.update({
      where: { id },
      data: {
        status: AgentStatus.ARCHIVED,
      },
      select: agentSelect,
    });
  }

  private async assertCanCreateAgent(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        status: true,
        subscriptions: {
          where: {
            status: {
              in: ['TRIAL', 'ACTIVE'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            plan: {
              select: {
                maxAgents: true,
              },
            },
          },
        },
      },
    });

    if (!company || company.status === 'SUSPENDED' || company.status === 'ARCHIVED') {
      throw new ForbiddenException(
        'La empresa no puede crear agentes en su estado actual',
      );
    }

    const maxAgents = company.subscriptions[0]?.plan.maxAgents ?? 1;

    const currentAgents = await this.prisma.agent.count({
      where: {
        companyId,
        status: {
          not: AgentStatus.ARCHIVED,
        },
      },
    });

    if (currentAgents >= maxAgents) {
      throw new ForbiddenException(
        `El plan actual permite un máximo de ${maxAgents} agente(s)`,
      );
    }
  }
}
