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
import { UpsertWidgetDto } from './dto/upsert-widget.dto';

const widgetSelect = {
  id: true,
  agentId: true,
  name: true,
  primaryColor: true,
  welcomeMessage: true,
  position: true,
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
        logoUrl: true,
        agent: {
          select: {
            id: true,
            name: true,
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

    this.assertOriginAllowed(requestOrigin, [
      ...widget.allowedDomains,
      widget.agent.company.website ?? '',
    ]);

    return this.conversationsService.widgetChat({
      companyId: widget.agent.companyId,
      agentId: widget.agent.id,
      message: data.message,
      conversationId: data.conversationId,
      visitorName: data.visitorName,
      visitorContact: data.visitorContact,
    });
  }

  private assertOriginAllowed(origin: string | undefined, allowed: string[]) {
    const hosts = allowed
      .map((value) => this.toHostname(value))
      .filter((value): value is string => Boolean(value));

    // Sin dominios configurados: modo abierto (útil en local).
    if (hosts.length === 0) {
      return;
    }

    // Scripts same-origin o tools sin Origin: permitir.
    if (!origin) {
      return;
    }

    const requestHost = this.toHostname(origin);
    if (!requestHost) {
      throw new ForbiddenException('Origen no permitido para este widget');
    }

    const ok = hosts.some(
      (host) => requestHost === host || requestHost.endsWith(`.${host}`),
    );

    if (!ok) {
      throw new ForbiddenException('Origen no permitido para este widget');
    }
  }

  private toHostname(value: string) {
    const raw = value.trim().toLowerCase();
    if (!raw) return null;

    try {
      const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return raw.replace(/^www\./, '').split('/')[0] || null;
    }
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
