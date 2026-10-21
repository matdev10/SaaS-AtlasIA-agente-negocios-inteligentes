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
    expect(reply).toMatch(/\?/);
  });
});
