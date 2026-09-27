import { chunkText } from './chunk-text';

describe('chunkText', () => {
  it('returns empty array for blank text', () => {
    expect(chunkText('   ')).toEqual([]);
  });

  it('returns a single chunk when text fits', () => {
    expect(chunkText('hola mundo', 100)).toEqual(['hola mundo']);
  });

  it('splits long text with overlap', () => {
    const text = 'a'.repeat(1000);
    const chunks = chunkText(text, 400, 50);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(400);
  });
});
