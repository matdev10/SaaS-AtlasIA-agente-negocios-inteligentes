export type KnowledgeChunk = {
  content: string;
};

type QuestionKind = 'services' | 'about' | 'contact' | 'hours' | 'price' | 'general';

const STOPWORDS = new Set([
  'que',
  'como',
  'cual',
  'cuales',
  'donde',
  'cuando',
  'para',
  'por',
  'con',
  'sin',
  'una',
  'uno',
  'unos',
  'unas',
  'los',
  'las',
  'del',
  'the',
  'and',
  'esta',
  'este',
  'esto',
  'eso',
  'sobre',
  'tiene',
  'tienen',
  'puedes',
  'puede',
  'decir',
  'hola',
  'favor',
  'mas',
]);

const SERVICE_STEMS = [
  'desarr',
  'servic',
  'soluci',
  'pagina',
  'aplic',
  'automat',
  'asisten',
  'integr',
  'consult',
  'software',
  'sistema',
];

export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function tokens(text: string): string[] {
  return fold(text)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !STOPWORDS.has(term));
}

export function questionKind(message: string): QuestionKind {
  const value = fold(message);
  if (/\b(precio|precios|costo|costos|valor|tarifa|tarifas|cuanto|cuesta|valen)\b/.test(value)) {
    return 'price';
  }
  if (/\b(horario|horarios|abren|cierran|atienden)\b/.test(value)) {
    return 'hours';
  }
  if (/\b(contacto|telefono|correo|email|whatsapp|direccion|ubicacion)\b/.test(value)) {
    return 'contact';
  }
  if (
    /\b(venden|vendes|ofrecen|ofreces|hacen|haces|servicios?|productos?|soluciones?)\b/.test(
      value,
    )
  ) {
    return 'services';
  }
  if (
    /\b(trata|tratan|dedican|quienes|negocio|empresa|compania|marca)\b/.test(value)
  ) {
    return 'about';
  }
  return 'general';
}

function boostTerms(kind: QuestionKind): string[] {
  if (kind === 'services') {
    return [
      'servicio',
      'desarrollo',
      'pagina',
      'aplicacion',
      'automatizacion',
      'asistente',
      'integracion',
      'consultoria',
      'solucion',
    ];
  }
  if (kind === 'about') {
    return ['marca', 'tecnologica', 'solucion', 'digital', 'identidad'];
  }
  if (kind === 'contact') {
    return ['contacto', 'telefono', 'correo', 'email', 'whatsapp', 'direccion'];
  }
  if (kind === 'hours') {
    return ['horario', 'lunes', 'viernes', 'abierto'];
  }
  if (kind === 'price') {
    return ['precio', 'costo', 'tarifa', 'plan', 'valor'];
  }
  return [];
}

function stemHit(text: string, term: string): boolean {
  const stem = term.length > 6 ? term.slice(0, 6) : term;
  return text.includes(stem);
}

function cleanLine(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInstruction(line: string): boolean {
  const value = fold(line);
  if (value.length < 18) {
    return true;
  }
  return (
    /^(eres |tu funcion|tu personalidad|tu prioridad|tu objetivo|no |nunca |estas reglas|en lugar de|di:|por ejemplo|los ejemplos|antes de |si alguien|cuando |habla |utiliza |representas |estas trabajando|puedes orientar|estas areas son|prefieres |adapta |no repitas|no empieces|no uses|no fuerces)/.test(
      value,
    ) ||
    /prompt maestro|contexto general|identidad del agente|reglas para sonar|como debe desarrollarse|restricciones de comunicacion|no inventes|categorias de referencia/.test(
      value,
    )
  );
}

function isServiceBullet(raw: string, cleaned: string): boolean {
  if (!/^\s*[-*•]\s+/.test(raw)) {
    return false;
  }
  const value = fold(cleaned);
  return (
    cleaned.length <= 160 && SERVICE_STEMS.some((stem) => value.includes(stem))
  );
}

function lineMatchesKind(line: string, kind: QuestionKind): boolean {
  const value = fold(line);
  if (kind === 'price') {
    return /\b(precio|costo|tarifa|plan|uf|clp|\$)/.test(value);
  }
  if (kind === 'contact') {
    return /\b(contacto|telefono|correo|email|whatsapp|direccion|ubicacion)/.test(
      value,
    );
  }
  if (kind === 'hours') {
    return /\b(horario|lunes|martes|miercoles|jueves|viernes|sabado|domingo|abiert)/.test(
      value,
    );
  }
  if (kind === 'about') {
    return /marca tecnologica|soluciones digitales|dedicad|presencia digital/.test(
      value,
    );
  }
  return true;
}

type Fact = {
  text: string;
  score: number;
  bullet: boolean;
};

function collectFacts(chunks: KnowledgeChunk[], message: string): Fact[] {
  const kind = questionKind(message);
  const required = tokens(message);
  const boosts = boostTerms(kind);
  const facts: Fact[] = [];

  for (const chunk of chunks) {
    const lines = chunk.content.split(/\n+/);
    let inServiceSection = false;

    for (const raw of lines) {
      const heading = fold(raw);
      if (/^#{1,6}\s/.test(raw) || /^[A-ZÁÉÍÓÚ0-9][A-ZÁÉÍÓÚ0-9 .—-]{8,}$/.test(raw.trim())) {
        inServiceSection = /servicio/.test(heading);
      }

      const cleaned = cleanLine(raw);
      if (!cleaned || isInstruction(cleaned)) {
        continue;
      }
      // Un chunk puede cortar una viñeta a la mitad. Esa línea incompleta no es un dato.
      if (/^\s*[-*•]\s+/.test(raw) && !/[.!?…)]$/.test(raw.trim())) {
        continue;
      }

      const folded = fold(cleaned);
      const bullet = isServiceBullet(raw, cleaned);
      const completeBullet =
        /^\s*[-*•]\s+/.test(raw) && /[.!?…)]$/.test(raw.trim());
      const startsOffering = /^(desarr|automat|asisten|integr|consult|pagina)/.test(
        folded,
      );
      let score = 0;

      for (const term of required) {
        if (stemHit(folded, term)) {
          score += 3;
        }
      }
      for (const term of boosts) {
        if (stemHit(folded, term)) {
          score += 1;
        }
      }
      if (kind === 'services' && SERVICE_STEMS.some((stem) => folded.includes(stem))) {
        score += 2;
      }
      if (kind === 'services' && completeBullet && inServiceSection) {
        score += 12;
      } else if (kind === 'services' && completeBullet && startsOffering) {
        score += 10;
      } else if (kind === 'services' && completeBullet) {
        score = 0;
      }
      if (kind === 'services' && bullet && inServiceSection) {
        score += 2;
      }
      if (kind === 'about' && lineMatchesKind(cleaned, 'about') && !bullet) {
        score += 6;
      }
      if (
        (kind === 'price' || kind === 'contact' || kind === 'hours') &&
        !lineMatchesKind(cleaned, kind)
      ) {
        score = 0;
      }
      if (cleaned.length > 240) {
        score -= 3;
      }
      if (score >= 3) {
        facts.push({
          text: cleaned.replace(/[.。]\s*$/, ''),
          score,
          bullet,
        });
      }
    }
  }

  facts.sort((a, b) => b.score - a.score);
  return facts;
}

export function answerFacts(chunks: KnowledgeChunk[], message: string): string[] {
  const kind = questionKind(message);
  const facts = collectFacts(chunks, message);
  const picked: Fact[] = [];
  const seen = new Set<string>();

  const prefer =
    kind === 'services'
      ? facts.filter((fact) => fact.bullet)
      : kind === 'about'
        ? facts.filter((fact) => !fact.bullet && lineMatchesKind(fact.text, 'about'))
        : facts;

  const pool = prefer.length > 0 ? prefer : kind === 'services' ? facts : [];
  const limit = kind === 'services' ? 6 : 2;

  for (const fact of pool) {
    const key = fold(fact.text);
    if (seen.has(key)) {
      continue;
    }
    if ([...seen].some((item) => item.includes(key) || key.includes(item))) {
      continue;
    }
    seen.add(key);
    picked.push(fact);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked.map((fact) => fact.text);
}

export function scoreContent(content: string, message: string): number {
  return collectFacts([{ content }], message).reduce(
    (total, fact) => total + fact.score,
    0,
  );
}

export function rankKnowledgeChunks<T extends KnowledgeChunk>(
  chunks: T[],
  message: string,
  limit = 4,
): T[] {
  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreContent(chunk.content, message),
      key: fold(chunk.content).replace(/\s+/g, ' ').slice(0, 240),
    }))
    .sort((a, b) => b.score - a.score);

  const selected: T[] = [];
  const seen = new Set<string>();

  for (const item of ranked) {
    if (item.score <= 0 || seen.has(item.key)) {
      continue;
    }
    seen.add(item.key);
    selected.push(item.chunk);
    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}
