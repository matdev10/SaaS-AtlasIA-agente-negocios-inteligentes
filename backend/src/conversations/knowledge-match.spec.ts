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
});
