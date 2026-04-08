import { describe, it, expect } from 'vitest';
import { deduplicate } from '../../agents/tools/deduplicate.js';
import type { RawPet } from '@pawpal/shared';

function makePet(overrides: Partial<RawPet> & { id: string }): RawPet {
  return {
    source: 'rescuegroups',
    sourceUrl: '',
    listingType: 'rescue',
    name: 'Buddy',
    species: 'dog',
    breedPrimary: 'Golden Retriever',
    breedMixed: false,
    age: 'young',
    gender: 'male',
    size: 'large',
    description: null,
    photos: [],
    shelterTraits: {
      environment: { children: null, dogs: null, cats: null },
      attributes: { spayed_neutered: false, house_trained: null, special_needs: false, shots_current: false },
      tags: [],
    },
    shelter: { name: 'Happy Tails', address: '', city: '', state: '', zip: '10001', phone: null, website: null, distanceMiles: 5 },
    listedAt: null,
    ...overrides,
  };
}

describe('deduplicate', () => {
  it('does NOT flag as duplicate when same source (single source mode)', () => {
    const pets = [
      makePet({ id: 'rg-1' }),
      makePet({ id: 'rg-2' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(2);
  });

  it('returns all pets unchanged when all from same source', () => {
    const pets = [
      makePet({ id: 'rg-1', name: 'Buddy' }),
      makePet({ id: 'rg-2', name: 'Max' }),
      makePet({ id: 'rg-3', name: 'Luna' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    const result = deduplicate([]);
    expect(result).toHaveLength(0);
  });

  it('returns single pet unchanged', () => {
    const pets = [makePet({ id: 'rg-1' })];
    const result = deduplicate(pets);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('rg-1');
  });

  it('preserves pet order', () => {
    const pets = [
      makePet({ id: 'rg-1', name: 'Alpha' }),
      makePet({ id: 'rg-2', name: 'Beta' }),
      makePet({ id: 'rg-3', name: 'Charlie' }),
    ];
    const result = deduplicate(pets);
    expect(result[0].name).toBe('Alpha');
    expect(result[1].name).toBe('Beta');
    expect(result[2].name).toBe('Charlie');
  });
});
