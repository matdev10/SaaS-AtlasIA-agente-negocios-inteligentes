import { rankKnowledgeChunks } from './knowledge-match';

describe('rankKnowledgeChunks', () => {
  const intro = {
    id: 'intro',
    content:
      '### 1. CONTEXTO GENERAL DEL PROYECTO\nEstás trabajando en Nuvcore, una marca tecnológica orientada al desarrollo de soluciones web.',
  };
  const services = {
    id: 'services',
    content: `### 6. IDENTIDAD Y SERVICIOS DE NUVCORE
- Desarrollo de páginas web.
- Automatización de tareas y procesos.
- Asistentes virtuales y soluciones con inteligencia artificial.`,
  };

  it('ranks the service list above the prompt preamble', () => {
    const ranked = rankKnowledgeChunks(
      [intro, services, intro],
      'que venden?',
    );

    expect(ranked[0]).toBe(services);
    expect(ranked.filter((chunk) => chunk.id === 'intro')).toHaveLength(0);
  });

  it('does not return unrelated chunks when nothing matches', () => {
    expect(
      rankKnowledgeChunks([intro], 'cual es el horario de atencion?'),
    ).toEqual([]);
  });

  it('ignores a bullet cut off by a chunk boundary', () => {
    const ranked = rankKnowledgeChunks(
      [
        { content: '- Consultoría y orie' },
        { content: '- Consultoría y orientación tecnológica.' },
      ],
      'que servicios ofrecen?',
    );

    expect(ranked.map((chunk) => chunk.content)).toEqual([
      '- Consultoría y orientación tecnológica.',
    ]);
  });

  it('skips checklist bullets from other sections', () => {
    const ranked = rankKnowledgeChunks(
      [
        {
          content: `### 6. IDENTIDAD Y SERVICIOS DE NUVCORE
- Desarrollo de páginas web.
- Consultoría y orientación tecnológica.`,
        },
        {
          content: `### 10. SEO Y PRESENCIA DIGITAL
- Contenido original y coherente con los servicios reales.`,
        },
      ],
      'que servicios ofrecen?',
    );

    const text = ranked.map((chunk) => chunk.content).join('\n');
    expect(text).toContain('Desarrollo de páginas web');
    expect(text).not.toContain('Contenido original');
  });
});
