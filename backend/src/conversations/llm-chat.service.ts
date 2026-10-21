import { Injectable, Logger } from '@nestjs/common';

import type { ReplyAgentProfile, ReplyChunk } from './reply-composer';

type ChatTurn = {
  role: 'visitor' | 'assistant';
  content: string;
};

@Injectable()
export class LlmChatService {
  private readonly logger = new Logger(LlmChatService.name);

  isEnabled() {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }

  async generateReply(input: {
    agent: ReplyAgentProfile;
    message: string;
    chunks: ReplyChunk[];
    history: ChatTurn[];
  }): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
    const baseUrl = (
      process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1'
    ).replace(/\/$/, '');

    const context = input.chunks
      .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
      .join('\n\n');

    const systemPrompt = [
      `Eres ${input.agent.name}, el asistente conversacional de ${input.agent.companyName}.`,
      'Responde en español, de forma natural y breve (2 a 5 oraciones).',
      'No enumeres fuentes ni pegues bloques crudos de documentos.',
      'Usa solo la información del contexto y de la conversación.',
      'Si no hay datos suficientes, dilo con amabilidad y ofrece ayuda sobre otro tema.',
      'Cierra con una pregunta corta para continuar la conversación cuando tenga sentido.',
      input.agent.tone
        ? `Tono configurado: ${input.agent.tone}.`
        : 'Tono: cercano, claro y profesional.',
      input.agent.instructions
        ? `Instrucciones del agente: ${input.agent.instructions}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const historyMessages = input.history.slice(-8).map((turn) => ({
      role: turn.role === 'visitor' ? ('user' as const) : ('assistant' as const),
      content: turn.content,
    }));

    const userPrompt = [
      'Contexto de la base de conocimiento:',
      context || '(sin documentos entrenados)',
      '',
      `Mensaje del visitante: ${input.message}`,
    ].join('\n');

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        this.logger.warn(
          `OpenAI respondió ${response.status}: ${detail.slice(0, 240)}`,
        );
        return null;
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content?.trim();
      return content || null;
    } catch (error) {
      this.logger.warn(
        `No se pudo generar respuesta LLM: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return null;
    }
  }
}
