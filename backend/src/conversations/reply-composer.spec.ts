import { composeConversationalReply } from './reply-composer';

describe('composeConversationalReply', () => {
  const agent = {
    name: 'Agente principal',
    tone: 'Cercano y amable',
    instructions: 'Responde únicamente con información de la base de conocimiento.',
    companyName: 'Millwords',
  };

  it('answers company name conversationally', () => {
    const reply = composeConversationalReply({
      agent,
      message: 'como se llama la empresa',
      chunks: [],
      hasKnowledge: false,
    });

    expect(reply).toContain('Millwords');
    expect(reply.toLowerCase()).not.toContain('según la base');
  });

  it('summarizes services without dumping numbered chunks', () => {
    const reply = composeConversationalReply({
      agent,
      message: 'que venden?',
      chunks: [
        {
          content:
            'Somos una empresa actual y preparada para desarrollar soluciones digitales. La marca debe transmitir profesionalismo y confianza.',
        },
      ],
      hasKnowledge: true,
    });

    expect(reply).toMatch(/soluciones digitales|profesionalismo/i);
    expect(reply).not.toMatch(/\(1\)/);
    expect(reply).not.toMatch(/según nuestra información/i);
    expect(reply).toMatch(/\?/);
  });

  it('answers services from the service list, not the prompt preamble', () => {
    const reply = composeConversationalReply({
      agent: { ...agent, companyName: 'Nuvcore' },
      message: 'que venden?',
      chunks: [
        {
          content: `# PROMPT MAESTRO
### 1. CONTEXTO GENERAL DEL PROYECTO
Estás trabajando en Nuvcore, una marca tecnológica orientada al desarrollo de soluciones web.
### 6. IDENTIDAD Y SERVICIOS DE NUVCORE
Nuvcore es una marca tecnológica que busca transformar necesidades reales en soluciones digitales útiles.
Puedes orientar las conversaciones hacia áreas como:
- Desarrollo de páginas web.
- Desarrollo de aplicaciones y sistemas digitales.
- Automatización de tareas y procesos.
- Asistentes virtuales y soluciones con inteligencia artificial.
- Integraciones entre herramientas y servicios.
- Consultoría y orientación tecnológica.
No inventes precios, plazos ni planes.`,
        },
      ],
      hasKnowledge: true,
    });

    expect(reply).toMatch(/páginas web/i);
    expect(reply).toMatch(/asistentes virtuales/i);
    expect(reply).toMatch(/consultoría/i);
    expect(reply).not.toMatch(/contexto general|estás trabajando|no inventes/i);
  });

  it('describes the company without dumping agent instructions', () => {
    const reply = composeConversationalReply({
      agent: { ...agent, companyName: 'Nuvcore' },
      message: 'de que se trata la empresa?',
      chunks: [
        {
          content: `Eres el asistente conversacional de Nuvcore.
Nuvcore es una marca tecnológica que busca transformar necesidades reales en soluciones digitales útiles.`,
        },
      ],
      hasKnowledge: true,
    });

    expect(reply).toMatch(/soluciones digitales útiles/i);
    expect(reply).not.toMatch(/eres el asistente/i);
  });

  it('does not invent prices', () => {
    const reply = composeConversationalReply({
      agent: { ...agent, companyName: 'Nuvcore' },
      message: 'cuanto cuesta?',
      chunks: [
        {
          content: '- Desarrollo de páginas web.\n- Consultoría y orientación tecnológica.',
        },
      ],
      hasKnowledge: true,
    });

    expect(reply).toMatch(/no tengo precios/i);
    expect(reply).not.toMatch(/páginas web/i);
  });
});
