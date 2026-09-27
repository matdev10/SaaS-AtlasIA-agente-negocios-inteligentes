import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../database/prisma.service';
import { TrainingService } from './training.service';

describe('TrainingService', () => {
  let service: TrainingService;

  const prisma = {
    document: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    trainingJob: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    chunk: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
  });

  it('trains a document into chunks', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      extractedText: 'Contenido de prueba para chunking del documento.',
      status: 'UPLOADED',
      knowledgeBase: { agentId: 'agent-1' },
    });
    prisma.trainingJob.create.mockResolvedValue({ id: 'job-1' });
    prisma.document.update.mockResolvedValue({});
    prisma.chunk.deleteMany.mockResolvedValue({});
    prisma.chunk.createMany.mockResolvedValue({ count: 1 });
    prisma.trainingJob.update.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      progress: 100,
    });

    await expect(
      service.trainDocument('doc-1', 'company-1'),
    ).resolves.toEqual({
      id: 'job-1',
      status: 'COMPLETED',
      progress: 100,
    });
  });

  it('rejects documents without extracted text', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      extractedText: null,
      status: 'UPLOADED',
      knowledgeBase: { agentId: 'agent-1' },
    });

    await expect(
      service.trainDocument('doc-1', 'company-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when document is missing', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(
      service.trainDocument('doc-1', 'company-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
