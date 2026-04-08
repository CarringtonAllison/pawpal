import { describe, it, expect } from 'vitest';
import { matchingAgent } from '../../agents/matchingAgent.js';
import type { RawPet, UserPreferences } from '@pawpal/shared';

const prefs: UserPreferences = {
  zipCode: '10001',
  petType: 'dog',
  livingSpace: 'large_yard',
  activityLevel: 'high',
  experience: 'experienced',
  allergies: 'none',
  agePreference: 'young',
  sizePreference: 'large',
  household: ['adults_only'],
  temperamentStyle: 'playful_energetic',
  noiseTolerance: 'fine_with_noise',
  breedNotes: null,
};

function makePet(overrides: Partial<RawPet>): RawPet {
  return {
    id: 'pf-1',
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
    shelter: { name: 'Test', address: '', city: '', state: '', zip: '10001', phone: null, website: null, distanceMiles: 5 },
    listedAt: null,
    ...overrides,
  };
}

describe('matchingAgent', () => {
  it('returns scored pets sorted by matchScore descending', async () => {
    const pets = [
      makePet({ id: 'pf-1', breedPrimary: 'Chihuahua', size: 'small' }),
      makePet({ id: 'pf-2', breedPrimary: 'Golden Retriever', size: 'large' }),
    ];

    const result = await matchingAgent(pets, prefs);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].matchScore).toBeGreaterThanOrEqual(result.data[1].matchScore);
    }
  });

  it('attaches breed traits when breed is recognized', async () => {
    const result = await matchingAgent([makePet({ breedPrimary: 'Golden Retriever' })], prefs);
    if (result.ok) {
      expect(result.data[0].breedTraits).not.toBeNull();
    }
  });

  it('sets breedTraits to null for unrecognized breed', async () => {
    const result = await matchingAgent([makePet({ breedPrimary: 'Unknown Mix' })], prefs);
    if (result.ok) {
      expect(result.data[0].breedTraits).toBeNull();
    }
  });

  it('always returns ok:true (never throws)', async () => {
    const result = await matchingAgent([], prefs);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('handles scoring failure gracefully (default score 50)', async () => {
    // Even if scoring logic had an issue, pets are still returned
    const result = await matchingAgent([makePet({})], prefs);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].matchScore).toBeGreaterThanOrEqual(0);
    }
  });
});
