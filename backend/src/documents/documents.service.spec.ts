import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../database/prisma.service';
import { DocumentStatus, DocumentType } from '../generated/prisma/client';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const prisma = {
    company: { findUnique: jest.fn() },
    agent: { findFirst: jest.fn() },
    document: {
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
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('creates a document under the agent knowledge base', async () => {
    prisma.agent.findFirst.mockResolvedValue({
      id: 'agent-1',
      knowledgeBase: { id: 'kb-1' },
    });
    prisma.company.findUnique.mockResolvedValue({
      status: 'TRIAL',
      subscriptions: [{ plan: { maxDocuments: 20 } }],
    });
    prisma.document.count.mockResolvedValue(0);
    prisma.document.create.mockResolvedValue({
      id: 'doc-1',
      name: 'FAQ',
      status: DocumentStatus.UPLOADED,
    });

    await expect(
      service.create('company-1', {
        agentId: 'agent-1',
        name: 'FAQ',
        type: DocumentType.FAQ,
        extractedText: 'Horario: 9 a 18',
      }),
    ).resolves.toEqual({
      id: 'doc-1',
      name: 'FAQ',
      status: DocumentStatus.UPLOADED,
    });
  });

  it('rejects create without content source', async () => {
    await expect(
      service.create('company-1', {
        agentId: 'agent-1',
        name: 'FAQ',
        type: DocumentType.FAQ,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects create when document limit is reached', async () => {
    prisma.agent.findFirst.mockResolvedValue({
      id: 'agent-1',
      knowledgeBase: { id: 'kb-1' },
    });
    prisma.company.findUnique.mockResolvedValue({
      status: 'TRIAL',
      subscriptions: [{ plan: { maxDocuments: 1 } }],
    });
    prisma.document.count.mockResolvedValue(1);

    await expect(
      service.create('company-1', {
        agentId: 'agent-1',
        name: 'FAQ',
        type: DocumentType.FAQ,
        extractedText: 'texto',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when document is missing for tenant', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(service.findOne('doc-1', 'company-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
