import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import {
  DocumentStatus,
  TrainingJobStatus,
} from '../generated/prisma/client';
import { chunkText } from './chunk-text';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async trainDocument(documentId: string, companyId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        knowledgeBase: {
          agent: { companyId },
        },
      },
      select: {
        id: true,
        extractedText: true,
        status: true,
        knowledgeBase: {
          select: {
            agentId: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    if (!document.extractedText?.trim()) {
      throw new BadRequestException(
        'El documento no tiene texto extraído para entrenar',
      );
    }

    if (document.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('No se puede entrenar un documento archivado');
    }

    const chunks = chunkText(document.extractedText);

    if (chunks.length === 0) {
      throw new BadRequestException('No se generaron chunks a partir del texto');
    }

    const job = await this.prisma.trainingJob.create({
      data: {
        documentId: document.id,
        status: TrainingJobStatus.RUNNING,
        progress: 0,
        startedAt: new Date(),
      },
    });

    try {
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.PROCESSING,
          errorMessage: null,
        },
      });

      await this.prisma.chunk.deleteMany({
        where: { documentId: document.id },
      });

      await this.prisma.chunk.createMany({
        data: chunks.map((content, index) => ({
          documentId: document.id,
          content,
          sortOrder: index,
          tokenCount: Math.ceil(content.length / 4),
        })),
      });

      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.PROCESSED,
        },
      });

      return this.prisma.trainingJob.update({
        where: { id: job.id },
        data: {
          status: TrainingJobStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
        select: {
          id: true,
          documentId: true,
          status: true,
          progress: true,
          errorMessage: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error de entrenamiento';

      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: message,
        },
      });

      await this.prisma.trainingJob.update({
        where: { id: job.id },
        data: {
          status: TrainingJobStatus.FAILED,
          errorMessage: message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async listJobs(documentId: string, companyId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        knowledgeBase: {
          agent: { companyId },
        },
      },
      select: { id: true },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    return this.prisma.trainingJob.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentId: true,
        status: true,
        progress: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
