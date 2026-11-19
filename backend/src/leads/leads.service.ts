import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { WidgetStatus } from '../generated/prisma/client';
import { isWidgetOriginAllowed } from '../widgets/origin-policy';

import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { UpdatePublicLeadDto } from './dto/update-public-lead.dto';

const leadSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  notes: true,
  conversationId: true,
  createdAt: true,
  agent: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, agentId?: string) {
    return this.prisma.lead.findMany({
      where: {
        companyId,
        ...(agentId ? { agentId } : {}),
      },
      select: leadSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportCsv(companyId: string, agentId?: string) {
    const leads = await this.list(companyId, agentId);
    const header = ['Nombre', 'Correo', 'Teléfono', 'Agente', 'Fecha', 'Notas'];
    const rows = leads.map((lead) => [
      lead.name,
      lead.email ?? '',
      lead.phone ?? '',
      lead.agent.name,
      lead.createdAt.toISOString(),
      lead.notes ?? '',
    ]);

    return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
  }

  async createPublic(
    widgetId: string,
    data: CreatePublicLeadDto,
    requestOrigin?: string,
  ) {
    const widget = await this.loadPublicWidget(widgetId, requestOrigin);
    const email = data.email;
    const phone = data.phone;

    if (!email && !phone) {
      throw new BadRequestException('Indicá un correo o un WhatsApp');
    }

    if (phone && phone.replace(/\D/g, '').length < 6) {
      throw new BadRequestException('El teléfono es demasiado corto');
    }

    const conversationId = await this.resolveConversation(
      widget.agent.companyId,
      widget.agent.id,
      data.conversationId,
    );

    return this.prisma.lead.create({
      data: {
        companyId: widget.agent.companyId,
        agentId: widget.agent.id,
        conversationId,
        name: data.name,
        email,
        phone,
        notes: data.notes,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
  }

  async updatePublic(
    widgetId: string,
    leadId: string,
    data: UpdatePublicLeadDto,
    requestOrigin?: string,
  ) {
    const widget = await this.loadPublicWidget(widgetId, requestOrigin);

    if (!data.notes && !data.conversationId) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId: widget.agent.companyId,
        agentId: widget.agent.id,
      },
      select: { id: true },
    });

    if (!lead) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    const conversationId = await this.resolveConversation(
      widget.agent.companyId,
      widget.agent.id,
      data.conversationId,
    );

    return this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        ...(data.notes ? { notes: data.notes } : {}),
        ...(conversationId ? { conversationId } : {}),
      },
      select: {
        id: true,
        notes: true,
        conversationId: true,
      },
    });
  }

  private async resolveConversation(
    companyId: string,
    agentId: string,
    conversationId?: string,
  ) {
    if (!conversationId) return null;

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, companyId, agentId },
      select: { id: true },
    });

    if (!conversation) {
      throw new BadRequestException('La conversación no pertenece a este agente');
    }

    return conversation.id;
  }

  private async loadPublicWidget(widgetId: string, requestOrigin?: string) {
    const widget = await this.prisma.widget.findFirst({
      where: {
        id: widgetId,
        status: WidgetStatus.ACTIVE,
      },
      select: {
        id: true,
        allowedDomains: true,
        requireLeadForm: true,
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

    if (!widget.requireLeadForm) {
      throw new ForbiddenException('Este widget no está pidiendo datos de contacto');
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

    return widget;
  }
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
