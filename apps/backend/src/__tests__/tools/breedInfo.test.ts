import { describe, it, expect } from 'vitest';
import { getBreedTraits } from '../../agents/tools/breedInfo.js';

describe('getBreedTraits', () => {
  it('finds Golden Retriever by exact key form', () => {
    const traits = getBreedTraits('Golden Retriever', 'dog');
    expect(traits).not.toBeNull();
    expect(traits!.species).toBe('dog');
    expect(traits!.energyLevel).toBe(4);
  });

  it('finds by alias "Golden"', () => {
    const traits = getBreedTraits('Golden', 'dog');
    expect(traits).not.toBeNull();
    expect(traits!.aliases).toContain('Golden');
  });

  it('finds by alias "Lab"', () => {
    const traits = getBreedTraits('Lab', 'dog');
    expect(traits).not.toBeNull();
  });

  it('finds Siamese cat', () => {
    const traits = getBreedTraits('Siamese', 'cat');
    expect(traits).not.toBeNull();
    expect(traits!.species).toBe('cat');
  });

  it('finds Domestic Shorthair by alias "Tabby"', () => {
    const traits = getBreedTraits('Tabby', 'cat');
    expect(traits).not.toBeNull();
  });

  it('returns null for unknown breed', () => {
    const traits = getBreedTraits('Xoloitzcuintli', 'dog');
    expect(traits).toBeNull();
  });

  it('respects species filter — Golden Retriever is not a cat', () => {
    const traits = getBreedTraits('Golden Retriever', 'cat');
    expect(traits).toBeNull();
  });

  it('is case-insensitive', () => {
    const traits = getBreedTraits('FRENCH BULLDOG', 'dog');
    expect(traits).not.toBeNull();
  });

  it('handles leading/trailing whitespace', () => {
    const traits = getBreedTraits('  Beagle  ', 'dog');
    expect(traits).not.toBeNull();
  });

  it('finds via partial match (breed name contains alias)', () => {
    const traits = getBreedTraits('Labrador Retriever Mix', 'dog');
    expect(traits).not.toBeNull();
  });
});
