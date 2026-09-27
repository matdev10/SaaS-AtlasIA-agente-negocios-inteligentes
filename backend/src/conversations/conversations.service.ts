import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import {
  ConversationChannel,
  ConversationStatus,
  DocumentStatus,
  MessageRole,
} from '../generated/prisma/client';
import { TestChatDto } from './dto/test-chat.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async testChat(companyId: string, agentId: string, data: TestChatDto) {
    return this.chat({
      companyId,
      agentId,
      message: data.message,
      conversationId: data.conversationId,
      channel: ConversationChannel.TEST_CHAT,
      requireActiveAgent: false,
    });
  }

  async widgetChat(input: {
    companyId: string;
    agentId: string;
    message: string;
    conversationId?: string;
    visitorName?: string;
    visitorContact?: string;
  }) {
    return this.chat({
      companyId: input.companyId,
      agentId: input.agentId,
      message: input.message,
      conversationId: input.conversationId,
      channel: ConversationChannel.WIDGET,
      requireActiveAgent: true,
      visitorName: input.visitorName,
      visitorContact: input.visitorContact,
    });
  }

  private async chat(input: {
    companyId: string;
    agentId: string;
    message: string;
    conversationId?: string;
    channel: typeof ConversationChannel.TEST_CHAT | typeof ConversationChannel.WIDGET;
    requireActiveAgent: boolean;
    visitorName?: string;
    visitorContact?: string;
  }) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        id: input.agentId,
        companyId: input.companyId,
        status: {
          not: 'ARCHIVED',
        },
      },
      select: {
        id: true,
        name: true,
        tone: true,
        instructions: true,
        welcomeMessage: true,
        status: true,
        company: {
          select: { status: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agente no encontrado');
    }

    if (
      agent.company.status === 'SUSPENDED' ||
      agent.company.status === 'ARCHIVED'
    ) {
      throw new ForbiddenException(
        'La empresa no puede conversar en su estado actual',
      );
    }

    if (input.requireActiveAgent && agent.status !== 'ACTIVE') {
      throw new ForbiddenException('El agente no está activo');
    }

    let conversationId = input.conversationId;

    if (conversationId) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          companyId: input.companyId,
          agentId: input.agentId,
          channel: input.channel,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Conversación no encontrada');
      }
    } else {
      const created = await this.prisma.conversation.create({
        data: {
          companyId: input.companyId,
          agentId: input.agentId,
          channel: input.channel,
          status: ConversationStatus.OPEN,
          visitorName: input.visitorName,
          visitorContact: input.visitorContact,
        },
        select: { id: true },
      });
      conversationId = created.id;
    }

    await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.VISITOR,
        content: input.message,
      },
    });

    const contextChunks = await this.retrieveRelevantChunks(
      input.agentId,
      input.message,
    );

    const assistantContent = this.buildGroundedReply(
      agent.name,
      input.message,
      contextChunks,
    );

    await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: assistantContent,
      },
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return {
      conversationId,
      agentId: input.agentId,
      messages,
      sources: contextChunks.map((chunk) => ({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        excerpt: chunk.content.slice(0, 180),
      })),
    };
  }

  async listByAgent(agentId: string, companyId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, companyId },
      select: { id: true },
    });

    if (!agent) {
      throw new NotFoundException('Agente no encontrado');
    }

    return this.prisma.conversation.findMany({
      where: { agentId, companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        channel: true,
        status: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  private async retrieveRelevantChunks(agentId: string, message: string) {
    const chunks = await this.prisma.chunk.findMany({
      where: {
        document: {
          status: DocumentStatus.PROCESSED,
          knowledgeBase: {
            agentId,
          },
        },
      },
      select: {
        id: true,
        documentId: true,
        content: true,
      },
      take: 200,
    });

    const terms = message
      .toLowerCase()
      .split(/\W+/)
      .filter((term) => term.length > 2);

    if (terms.length === 0) {
      return chunks.slice(0, 3);
    }

    return chunks
      .map((chunk) => {
        const content = chunk.content.toLowerCase();
        const score = terms.reduce(
          (acc, term) => (content.includes(term) ? acc + 1 : acc),
          0,
        );
        return { ...chunk, score };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  private buildGroundedReply(
    agentName: string,
    message: string,
    chunks: Array<{ content: string }>,
  ) {
    if (chunks.length === 0) {
      return (
        `${agentName}: no encontré información suficiente en la base de conocimiento ` +
        `para responder “${message}”. Puedes reformular la pregunta o cargar más documentos.`
      );
    }

    const context = chunks
      .map((chunk, index) => `(${index + 1}) ${chunk.content}`)
      .join('\n\n');

    return (
      `${agentName}: según la base de conocimiento disponible:\n\n${context}\n\n` +
      `Si necesitas más detalle, indícame qué parte ampliar.`
    );
  }
}
