import { describe, it, expect } from 'vitest';
import { scoreMatch } from '../../agents/tools/scoreMatch.js';
import type { RawPet, BreedTraits, UserPreferences } from '@pawpal/shared';

const basePet: RawPet = {
  id: 'pf-1',
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
    environment: { children: true, dogs: true, cats: null },
    attributes: { spayed_neutered: true, house_trained: true, special_needs: false, shots_current: true },
    tags: ['friendly', 'playful'],
  },
  shelter: { name: 'Test', address: '', city: '', state: '', zip: '10001', phone: null, website: null, distanceMiles: 5 },
  listedAt: null,
};

const baseTraits: BreedTraits = {
  species: 'dog',
  aliases: ['Golden'],
  sizeGroup: 'large',
  weightRangeLbs: [55, 75],
  coatLength: 'long',
  hypoallergenic: false,
  sheddingLevel: 4,
  energyLevel: 4,
  affectionLevel: 5,
  trainability: 5,
  barkingLevel: 2,
  playfulness: 5,
  adaptability: 4,
  goodWithKids: true,
  goodWithDogs: true,
  goodWithCats: false,
  goodWithStrangers: true,
  apartmentFriendly: false,
  exerciseNeedsMinPerDay: 60,
  groomingNeedsLevel: 3,
  separationAnxietyRisk: 'medium',
  experienceRequired: 'none',
  temperamentTags: ['loyal', 'friendly'],
};

const basePrefs: UserPreferences = {
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

describe('scoreMatch', () => {
  it('returns a score between 0 and 100', () => {
    const result = scoreMatch(basePet, basePrefs, baseTraits);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });

  it('returns all dimension scores', () => {
    const result = scoreMatch(basePet, basePrefs, baseTraits);
    expect(result.dimensionScores).toHaveProperty('activity');
    expect(result.dimensionScores).toHaveProperty('livingSpace');
    expect(result.dimensionScores).toHaveProperty('hypoallergenic');
    expect(result.dimensionScores).toHaveProperty('age');
    expect(result.dimensionScores).toHaveProperty('size');
    expect(result.dimensionScores).toHaveProperty('experience');
    expect(result.dimensionScores).toHaveProperty('temperament');
    expect(result.dimensionScores).toHaveProperty('noise');
    expect(result.dimensionScores).toHaveProperty('compatibility');
  });

  it('scores high for a well-matched pet', () => {
    const result = scoreMatch(basePet, basePrefs, baseTraits);
    expect(result.matchScore).toBeGreaterThanOrEqual(75);
  });

  it('scores age at 100 when preference matches pet age', () => {
    const result = scoreMatch(basePet, { ...basePrefs, agePreference: 'young' }, baseTraits);
    expect(result.dimensionScores.age).toBe(100);
  });

  it('scores age at 100 for "any" preference', () => {
    const result = scoreMatch(basePet, { ...basePrefs, agePreference: 'any' }, baseTraits);
    expect(result.dimensionScores.age).toBe(100);
  });

  it('penalizes age mismatch', () => {
    const result = scoreMatch(basePet, { ...basePrefs, agePreference: 'senior' }, baseTraits);
    expect(result.dimensionScores.age).toBeLessThan(100);
  });

  it('scores size at 100 when preference matches', () => {
    const result = scoreMatch(basePet, { ...basePrefs, sizePreference: 'large' }, baseTraits);
    expect(result.dimensionScores.size).toBe(100);
  });

  it('scores size at 100 for "any" preference', () => {
    const result = scoreMatch(basePet, { ...basePrefs, sizePreference: 'any' }, baseTraits);
    expect(result.dimensionScores.size).toBe(100);
  });

  it('scores 0 for strict allergy with non-hypoallergenic breed', () => {
    const result = scoreMatch(basePet, { ...basePrefs, allergies: 'strict' }, baseTraits);
    expect(result.dimensionScores.hypoallergenic).toBe(0);
  });

  it('scores 100 for strict allergy with hypoallergenic breed', () => {
    const hypoTraits = { ...baseTraits, hypoallergenic: true };
    const result = scoreMatch(basePet, { ...basePrefs, allergies: 'strict' }, hypoTraits);
    expect(result.dimensionScores.hypoallergenic).toBe(100);
  });

  it('uses neutral scores (50) when breed traits are null', () => {
    const result = scoreMatch(basePet, basePrefs, null);
    // Activity uses default energyLevel of 3
    expect(result.dimensionScores.activity).toBeDefined();
    // Should still produce a valid score
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });

  it('scores compatibility using shelter data when available (children=true)', () => {
    const prefs = { ...basePrefs, household: ['young_kids'] };
    const result = scoreMatch(basePet, prefs, baseTraits);
    expect(result.dimensionScores.compatibility).toBe(100); // shelter says children=true
  });

  it('uses breed estimate at 50% confidence when shelter data is null', () => {
    const pet = {
      ...basePet,
      shelterTraits: {
        ...basePet.shelterTraits,
        environment: { children: null, dogs: null, cats: null },
      },
    };
    const prefs = { ...basePrefs, household: ['young_kids'] };
    const result = scoreMatch(pet, prefs, baseTraits);
    // Golden Retriever goodWithKids=true → 50% confidence = 50
    expect(result.dimensionScores.compatibility).toBe(50);
  });

  it('returns 100 compatibility for adults_only household', () => {
    const prefs = { ...basePrefs, household: ['adults_only'] };
    const result = scoreMatch(basePet, prefs, baseTraits);
    expect(result.dimensionScores.compatibility).toBe(100);
  });

  it('prefers shelter tags over breed traits for temperament', () => {
    const petWithCalmTags = {
      ...basePet,
      shelterTraits: { ...basePet.shelterTraits, tags: ['calm', 'gentle', 'relaxed'] },
    };
    const result = scoreMatch(petWithCalmTags, { ...basePrefs, temperamentStyle: 'calm_easygoing' }, baseTraits);
    expect(result.dimensionScores.temperament).toBeGreaterThan(70);
  });

  it('scores noise at 100 for fine_with_noise', () => {
    const result = scoreMatch(basePet, { ...basePrefs, noiseTolerance: 'fine_with_noise' }, baseTraits);
    expect(result.dimensionScores.noise).toBe(100);
  });

  it('penalizes noisy breeds when prefer_quiet', () => {
    const noisyTraits = { ...baseTraits, barkingLevel: 5 as const };
    const result = scoreMatch(basePet, { ...basePrefs, noiseTolerance: 'prefer_quiet' }, noisyTraits);
    expect(result.dimensionScores.noise).toBeLessThan(50);
  });

  it('apartment + large non-apartment-friendly breed scores low on livingSpace', () => {
    const result = scoreMatch(basePet, { ...basePrefs, livingSpace: 'apartment' }, baseTraits);
    expect(result.dimensionScores.livingSpace).toBeLessThanOrEqual(30);
  });

  it('apartment + apartment-friendly breed scores high', () => {
    const aptTraits = { ...baseTraits, apartmentFriendly: true };
    const result = scoreMatch(basePet, { ...basePrefs, livingSpace: 'apartment' }, aptTraits);
    expect(result.dimensionScores.livingSpace).toBe(100);
  });
});
