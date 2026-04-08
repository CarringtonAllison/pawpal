import { describe, it, expect } from 'vitest';
import { deduplicate } from '../../agents/tools/deduplicate.js';
import type { RawPet } from '@pawpal/shared';

function makePet(overrides: Partial<RawPet> & { id: string }): RawPet {
  return {
    source: 'petfinder',
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
  it('identifies duplicate when same name + same shelter name + same zip across sources', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder' }),
      makePet({ id: 'rg-1', source: 'rescuegroups' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(1);
  });

  it('identifies duplicate when same name + same breed + same zip across sources', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder', shelter: { name: 'Happy Tails Rescue', address: '', city: '', state: '', zip: '10001', phone: null, website: null, distanceMiles: 5 } }),
      makePet({ id: 'rg-1', source: 'rescuegroups', shelter: { name: 'Happy Tails', address: '', city: '', state: '', zip: '10001', phone: null, website: null, distanceMiles: 5 } }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(1);
  });

  it('does NOT flag as duplicate when names differ', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder', name: 'Buddy' }),
      makePet({ id: 'rg-1', source: 'rescuegroups', name: 'Max' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(2);
  });

  it('does NOT flag as duplicate when same source', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder' }),
      makePet({ id: 'pf-2', source: 'petfinder' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(2);
  });

  it('keeps Petfinder version when both sources have the same animal', () => {
    const pets = [
      makePet({ id: 'rg-1', source: 'rescuegroups' }),
      makePet({ id: 'pf-1', source: 'petfinder' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pf-1');
  });

  it('merges photos from dropped duplicate into kept pet', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder', photos: ['photo1.jpg'] }),
      makePet({ id: 'rg-1', source: 'rescuegroups', photos: ['photo2.jpg'] }),
    ];
    const result = deduplicate(pets);
    expect(result[0].photos).toEqual(['photo1.jpg', 'photo2.jpg']);
  });

  it('does not duplicate shared photos during merge', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder', photos: ['shared.jpg'] }),
      makePet({ id: 'rg-1', source: 'rescuegroups', photos: ['shared.jpg', 'extra.jpg'] }),
    ];
    const result = deduplicate(pets);
    expect(result[0].photos).toEqual(['shared.jpg', 'extra.jpg']);
  });

  it('merges personality tags (union, no duplicates)', () => {
    const pets = [
      makePet({
        id: 'pf-1',
        source: 'petfinder',
        shelterTraits: {
          environment: { children: null, dogs: null, cats: null },
          attributes: { spayed_neutered: false, house_trained: null, special_needs: false, shots_current: false },
          tags: ['friendly', 'playful'],
        },
      }),
      makePet({
        id: 'rg-1',
        source: 'rescuegroups',
        shelterTraits: {
          environment: { children: null, dogs: null, cats: null },
          attributes: { spayed_neutered: false, house_trained: null, special_needs: false, shots_current: false },
          tags: ['playful', 'gentle'],
        },
      }),
    ];
    const result = deduplicate(pets);
    expect(result[0].shelterTraits.tags).toEqual(['friendly', 'playful', 'gentle']);
  });

  it('handles case-insensitive name comparison', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder', name: 'BUDDY' }),
      makePet({ id: 'rg-1', source: 'rescuegroups', name: 'buddy' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(1);
  });

  it('handles whitespace in names and shelter names', () => {
    const pets = [
      makePet({ id: 'pf-1', source: 'petfinder', name: '  Buddy  ' }),
      makePet({ id: 'rg-1', source: 'rescuegroups', name: 'Buddy' }),
    ];
    const result = deduplicate(pets);
    expect(result).toHaveLength(1);
  });
});
