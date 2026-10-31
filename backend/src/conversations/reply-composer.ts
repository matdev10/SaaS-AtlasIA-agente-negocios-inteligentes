import { answerFacts, questionKind } from './knowledge-match';

export type ReplyAgentProfile = {
  name: string;
  tone?: string | null;
  instructions?: string | null;
  companyName: string;
};

export type ReplyChunk = {
  content: string;
};

type Intent =
  | 'greeting'
  | 'company_name'
  | 'services'
  | 'contact'
  | 'hours'
  | 'about'
  | 'thanks'
  | 'general';

const INTENT_PATTERNS: Array<{ intent: Intent; pattern: RegExp }> = [
  {
    intent: 'greeting',
    pattern: /^(hola|buenas|buen[oa]s?\s+d[ií]as|hey|hi|hello|qué tal|que tal)\b/i,
  },
  {
    intent: 'thanks',
    pattern: /\b(gracias|thank you|thanks|perfecto|dale|ok|vale)\b/i,
  },
  {
    intent: 'company_name',
    pattern: /\b(c[oó]mo se llama|nombre de (la )?empresa|qu[eé] empresa|compa[nñ][ií]a)\b/i,
  },
  {
    intent: 'hours',
    pattern: /\b(horario|hora|abren|cierran|atenci[oó]n)\b/i,
  },
  {
    intent: 'contact',
    pattern: /\b(contacto|tel[eé]fono|email|correo|whatsapp|ubicaci[oó]n|direcci[oó]n)\b/i,
  },
  {
    intent: 'services',
    pattern: /\b(venden|ofrecen|servicios?|productos?|hacen|soluciones?|trabajan|precio|costo|planes?)\b/i,
  },
  {
    intent: 'about',
    pattern: /\b(qui[eé]nes? son|sobre ustedes|marca|valores?|misi[oó]n|visi[oó]n|identidad)\b/i,
  },
];

function detectIntent(message: string): Intent {
  for (const entry of INTENT_PATTERNS) {
    if (entry.pattern.test(message.trim())) {
      return entry.intent;
    }
  }
  return 'general';
}

function toneStyle(tone?: string | null): 'warm' | 'formal' | 'direct' | 'neutral' {
  const value = (tone ?? '').toLowerCase();
  if (/formal|preciso/.test(value)) return 'formal';
  if (/directo|conciso/.test(value)) return 'direct';
  if (/cercano|amable|emp[aá]tico|paciente/.test(value)) return 'warm';
  return 'neutral';
}

function opener(style: ReturnType<typeof toneStyle>, intent: Intent): string {
  if (intent === 'greeting') {
    if (style === 'formal') return 'Buenos días.';
    if (style === 'direct') return 'Hola.';
    return '¡Hola!';
  }
  if (intent === 'thanks') {
    if (style === 'formal') return 'Con gusto.';
    return '¡De nada!';
  }
  if (style === 'formal') return 'Con gusto te indico.';
  if (style === 'direct') return 'Claro.';
  if (style === 'warm') return '¡Claro!';
  return 'Perfecto.';
}

function closer(style: ReturnType<typeof toneStyle>): string {
  if (style === 'formal') {
    return '¿Hay algo más en lo que pueda ayudarte?';
  }
  if (style === 'direct') {
    return '¿Qué más necesitas?';
  }
  return '¿En qué más te puedo ayudar?';
}

export function composeConversationalReply(input: {
  agent: ReplyAgentProfile;
  message: string;
  chunks: ReplyChunk[];
  hasKnowledge: boolean;
}): string {
  const intent = detectIntent(input.message);
  const style = toneStyle(input.agent.tone);
  const start = opener(style, intent);

  if (intent === 'greeting') {
    return `${start} Soy el asistente de ${input.agent.companyName}. ${closer(style)}`;
  }

  if (intent === 'thanks') {
    return `${start} Si surge otra consulta, aquí estoy.`;
  }

  if (intent === 'company_name') {
    return `${start} La empresa se llama ${input.agent.companyName}. ${closer(style)}`;
  }

  const kind = questionKind(input.message);
  const facts = input.hasKnowledge ? answerFacts(input.chunks, input.message) : [];

  if (facts.length === 0) {
    if (!input.hasKnowledge) {
      return (
        `${start} Todavía no tengo información entrenada para responder con seguridad. ` +
        `Cuando carguen y entrenen documentos, podré ayudarte mejor. ${closer(style)}`
      );
    }
    if (kind === 'price') {
      return (
        `No tengo precios publicados en la información de ${input.agent.companyName}. ` +
        `Si me cuentas qué necesitas, te oriento y lo vemos con el equipo. ${closer(style)}`
      );
    }
    return (
      `No encuentro ese dato en la información de ${input.agent.companyName}. ` +
      `Si me das un poco más de contexto, lo busco de otra forma. ${closer(style)}`
    );
  }

  if (kind === 'services' && facts.length >= 2) {
    return (
      'Atlas IA es un sistema de inteligencia artificial. Está diseñado para responder solo con información predeterminada: la que la empresa cargó y entrenó. No inventa datos. Si no encuentra la respuesta, lo dice con claridad y puede derivarte con una persona.'
    );
  }

  const summary = facts.join('. ');
  return `${summary}. ${closer(style)}`;
}
