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

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 20);
}

function keywordScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce(
    (score, keyword) => (lower.includes(keyword) ? score + 1 : score),
    0,
  );
}

function pickSentences(
  chunks: ReplyChunk[],
  keywords: string[],
  limit = 3,
): string[] {
  const scored = chunks
    .flatMap((chunk) => splitSentences(chunk.content))
    .map((sentence) => ({
      sentence,
      score: keywordScore(sentence, keywords),
    }))
    .sort((a, b) => b.score - a.score);

  const matched = scored
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => item.sentence);

  if (matched.length > 0) {
    return matched;
  }

  return scored.slice(0, Math.min(2, limit)).map((item) => item.sentence);
}

function summarizeContext(sentences: string[]): string {
  const unique = [...new Set(sentences.map((s) => s.replace(/\s+/g, ' ').trim()))];
  return unique.join(' ');
}

function instructionsAllowGuess(instructions?: string | null): boolean {
  const value = (instructions ?? '').toLowerCase();
  if (!value) return false;
  return !/solo usa|no invent|base de conocimiento|no especul/.test(value);
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

  if (!input.hasKnowledge || input.chunks.length === 0) {
    return (
      `${start} Todavía no tengo información entrenada para responder con seguridad. ` +
      `Cuando carguen y entrenen documentos, podré ayudarte mejor. ${closer(style)}`
    );
  }

  const keywordMap: Record<Intent, string[]> = {
    greeting: [],
    thanks: [],
    company_name: ['empresa', 'nombre'],
    services: [
      'servicio',
      'producto',
      'soluci',
      'ofrec',
      'desarroll',
      'digital',
      'software',
      'plan',
      'precio',
    ],
    contact: ['contacto', 'tel', 'correo', 'email', 'whatsapp', 'direcci'],
    hours: ['horario', 'lunes', 'viernes', 'abierto', 'cerrado'],
    about: [
      'marca',
      'valor',
      'misi',
      'visi',
      'confianza',
      'innovaci',
      'profesional',
      'identidad',
      'transmit',
    ],
    general: input.message
      .toLowerCase()
      .split(/[^a-záéíóúüñ0-9]+/i)
      .filter((term) => term.length > 3),
  };

  const sentences = pickSentences(input.chunks, keywordMap[intent]);
  const summary = summarizeContext(sentences);

  if (!summary) {
    if (instructionsAllowGuess(input.agent.instructions)) {
      return (
        `${start} No tengo ese detalle exacto en la base de conocimiento. ` +
        `Puedo ayudarte con otra consulta sobre ${input.agent.companyName}. ${closer(style)}`
      );
    }
    return (
      `${start} No encuentro ese dato en la información disponible de ${input.agent.companyName}. ` +
      `Si me das un poco más de contexto, lo busco de otra forma. ${closer(style)}`
    );
  }

  if (intent === 'services') {
    return (
      `${start} Según nuestra información, ${input.agent.companyName} trabaja con esto: ` +
      `${summary} ${closer(style)}`
    );
  }

  if (intent === 'about') {
    return (
      `${start} Sobre ${input.agent.companyName}: ${summary} ${closer(style)}`
    );
  }

  if (intent === 'contact' || intent === 'hours') {
    return `${start} ${summary} ${closer(style)}`;
  }

  return `${start} ${summary} ${closer(style)}`;
}
