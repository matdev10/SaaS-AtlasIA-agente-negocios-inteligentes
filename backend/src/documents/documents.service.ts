import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { DocumentStatus } from '../generated/prisma/client';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const documentSelect = {
  id: true,
  knowledgeBaseId: true,
  name: true,
  type: true,
  sourceUrl: true,
  extractedText: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  knowledgeBase: {
    select: {
      id: true,
      agentId: true,
      agent: {
        select: {
          id: true,
          companyId: true,
          name: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: CreateDocumentDto) {
    if (!data.sourceUrl && !data.extractedText) {
      throw new BadRequestException(
        'Debes enviar sourceUrl o extractedText',
      );
    }

    const agent = await this.prisma.agent.findFirst({
      where: {
        id: data.agentId,
        companyId,
        status: {
          not: 'ARCHIVED',
        },
      },
      select: {
        id: true,
        knowledgeBase: {
          select: { id: true },
        },
      },
    });

    if (!agent?.knowledgeBase) {
      throw new NotFoundException(
        'Agente o base de conocimiento no encontrados',
      );
    }

    await this.assertCanCreateDocument(companyId);

    return this.prisma.document.create({
      data: {
        knowledgeBaseId: agent.knowledgeBase.id,
        name: data.name,
        type: data.type,
        sourceUrl: data.sourceUrl,
        extractedText: data.extractedText,
        status: DocumentStatus.UPLOADED,
      },
      select: documentSelect,
    });
  }

  async findAllByAgent(agentId: string, companyId: string) {
    await this.assertAgentBelongsToCompany(agentId, companyId);

    return this.prisma.document.findMany({
      where: {
        knowledgeBase: {
          agentId,
          agent: { companyId },
        },
        status: {
          not: DocumentStatus.ARCHIVED,
        },
      },
      select: documentSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        knowledgeBase: {
          agent: { companyId },
        },
      },
      select: documentSelect,
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    return document;
  }

  async update(id: string, companyId: string, data: UpdateDocumentDto) {
    await this.findOne(id, companyId);

    return this.prisma.document.update({
      where: { id },
      data,
      select: documentSelect,
    });
  }

  async archive(id: string, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.ARCHIVED,
      },
      select: documentSelect,
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

  private async assertCanCreateDocument(companyId: string) {
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
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            plan: {
              select: { maxDocuments: true },
            },
          },
        },
      },
    });

    if (
      !company ||
      company.status === 'SUSPENDED' ||
      company.status === 'ARCHIVED'
    ) {
      throw new ForbiddenException(
        'La empresa no puede cargar documentos en su estado actual',
      );
    }

    const maxDocuments = company.subscriptions[0]?.plan.maxDocuments ?? 20;

    const currentDocuments = await this.prisma.document.count({
      where: {
        knowledgeBase: {
          agent: { companyId },
        },
        status: {
          not: DocumentStatus.ARCHIVED,
        },
      },
    });

    if (currentDocuments >= maxDocuments) {
      throw new ForbiddenException(
        `El plan actual permite un máximo de ${maxDocuments} documento(s)`,
      );
    }
  }
}
