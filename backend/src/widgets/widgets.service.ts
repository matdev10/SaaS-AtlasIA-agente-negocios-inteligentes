import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { softAdvanceOnboarding } from '../companies/onboarding';
import { ConversationsService } from '../conversations/conversations.service';
import { PrismaService } from '../database/prisma.service';
import { OnboardingStep } from '../generated/prisma/enums';
import { WidgetStatus } from '../generated/prisma/client';
import { PublicWidgetChatDto } from './dto/public-widget-chat.dto';
import { isWidgetOriginAllowed } from './origin-policy';
import { UpsertWidgetDto } from './dto/upsert-widget.dto';

const widgetSelect = {
  id: true,
  agentId: true,
  name: true,
  primaryColor: true,
  welcomeMessage: true,
  position: true,
  size: true,
  movable: true,
  buttonPosition: true,
  logo: true,
  presence: true,
  logoUrl: true,
  allowedDomains: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class WidgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async getByAgent(agentId: string, companyId: string) {
    await this.assertAgentBelongsToCompany(agentId, companyId);

    const widget = await this.prisma.widget.findUnique({
      where: { agentId },
      select: widgetSelect,
    });

    if (!widget) {
      throw new NotFoundException('Widget no encontrado');
    }

    return widget;
  }

  async upsertByAgent(
    agentId: string,
    companyId: string,
    data: UpsertWidgetDto,
  ) {
    await this.assertAgentBelongsToCompany(agentId, companyId);

    const allowedDomains = data.allowedDomains
      ?.map((domain) => domain.trim())
      .filter(Boolean);

    const widget = await this.prisma.widget.upsert({
      where: { agentId },
      create: {
        agentId,
        name: data.name ?? 'Widget principal',
        primaryColor: data.primaryColor,
        welcomeMessage: data.welcomeMessage,
        position: data.position ?? 'bottom-right',
        size: data.size ?? 'lg',
        movable: data.movable ?? true,
        buttonPosition: data.buttonPosition ?? data.position ?? 'bottom-right',
        logo: data.logo ?? 'atlas',
        presence: data.presence ?? 'online',
        logoUrl: data.logoUrl,
        allowedDomains: allowedDomains ?? [],
        status: data.status ?? WidgetStatus.INACTIVE,
      },
      update: {
        ...data,
        ...(allowedDomains ? { allowedDomains } : {}),
      },
      select: widgetSelect,
    });

    if (widget.status === WidgetStatus.ACTIVE) {
      const agent = await this.prisma.agent.findFirst({
        where: { id: agentId, companyId },
        select: { status: true },
      });

      if (agent?.status === 'ACTIVE') {
        await softAdvanceOnboarding(
          this.prisma,
          companyId,
          OnboardingStep.TEST_CHAT,
          OnboardingStep.PUBLISH,
        );
        await softAdvanceOnboarding(
          this.prisma,
          companyId,
          OnboardingStep.PUBLISH,
          OnboardingStep.COMPLETED,
        );
      }
    }

    return widget;
  }

  async getPublicConfig(widgetId: string) {
    const widget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        status: WidgetStatus.ACTIVE,
        agent: {
          status: 'ACTIVE',
          company: {
            status: {
              in: ['TRIAL', 'ACTIVE'],
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        welcomeMessage: true,
        position: true,
        size: true,
        movable: true,
        buttonPosition: true,
        logo: true,
        presence: true,
        logoUrl: true,
        agent: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!widget) {
      throw new NotFoundException('Widget no disponible');
    }

    return widget;
  }

  async publicChat(
    widgetId: string,
    data: PublicWidgetChatDto,
    requestOrigin?: string,
  ) {
    const widget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        status: WidgetStatus.ACTIVE,
      },
      select: {
        id: true,
        allowedDomains: true,
        agent: {
          select: {
            id: true,
            companyId: true,
            status: true,
            company: {
              select: { status: true, website: true },
            },
          },
        },
      },
    });

    if (!widget) {
      throw new NotFoundException('Widget no encontrado');
    }

    if (widget.agent.status !== 'ACTIVE') {
      throw new ForbiddenException('El agente no está activo');
    }

    if (
      widget.agent.company.status === 'SUSPENDED' ||
      widget.agent.company.status === 'ARCHIVED'
    ) {
      throw new ForbiddenException('El widget no está disponible');
    }

    const allowed = [
      ...widget.allowedDomains,
      widget.agent.company.website ?? '',
    ];
    if (
      !isWidgetOriginAllowed(requestOrigin, allowed, {
        allowLoopback: process.env.NODE_ENV !== 'production',
      })
    ) {
      throw new ForbiddenException('Origen no permitido para este widget');
    }

    return this.conversationsService.widgetChat({
      companyId: widget.agent.companyId,
      agentId: widget.agent.id,
      message: data.message,
      conversationId: data.conversationId,
      visitorName: data.visitorName,
      visitorContact: data.visitorContact,
    });
  }

  private async assertAgentBelongsToCompany(
    agentId: string,
    companyId: string,
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, companyId },
      select: { id: true },
    });

    if (!agent) {
      throw new NotFoundException('Agente no encontrado');
    }
  }
}
