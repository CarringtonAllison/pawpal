import { describe, it, expect } from 'vitest';
import { UserPreferencesSchema, PartialPreferencesSchema } from '../types/preferences.js';

describe('UserPreferencesSchema', () => {
  const validPreferences = {
    zipCode: '10001',
    petType: 'dog',
    livingSpace: 'apartment',
    activityLevel: 'moderate',
    experience: 'some',
    allergies: 'none',
    agePreference: 'young',
    sizePreference: 'medium',
    household: ['adults_only'],
    temperamentStyle: 'cuddly_affectionate',
    noiseTolerance: 'fine_with_noise',
    breedNotes: null,
  };

  it('accepts valid complete preferences', () => {
    const result = UserPreferencesSchema.safeParse(validPreferences);
    expect(result.success).toBe(true);
  });

  it('accepts breedNotes as a string', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      breedNotes: 'Love Golden Retrievers',
    });
    expect(result.success).toBe(true);
  });

  it('accepts breedNotes as null', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      breedNotes: null,
    });
    expect(result.success).toBe(true);
  });

  // Zip code validation
  it('rejects non-numeric zip code', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      zipCode: 'abc12',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zip code shorter than 5 digits', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      zipCode: '1234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zip code longer than 5 digits', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      zipCode: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty zip code', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      zipCode: '',
    });
    expect(result.success).toBe(false);
  });

  // Enum validation
  it('rejects invalid petType', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      petType: 'hamster',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid livingSpace', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      livingSpace: 'mansion',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid activityLevel', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      activityLevel: 'extreme',
    });
    expect(result.success).toBe(false);
  });

  // Household validation
  it('rejects empty household array', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      household: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid household member', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      household: ['adults_only', 'teenagers'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts multiple valid household members', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      household: ['adults_only', 'young_kids', 'other_dogs'],
    });
    expect(result.success).toBe(true);
  });

  // breedNotes length
  it('rejects breedNotes over 500 characters', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      breedNotes: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts breedNotes at exactly 500 characters', () => {
    const result = UserPreferencesSchema.safeParse({
      ...validPreferences,
      breedNotes: 'a'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  // Missing required fields
  it('rejects when required fields are missing', () => {
    const result = UserPreferencesSchema.safeParse({
      zipCode: '10001',
    });
    expect(result.success).toBe(false);
  });

  // All enum values accepted
  it('accepts all valid petType values', () => {
    for (const petType of ['dog', 'cat', 'either']) {
      const result = UserPreferencesSchema.safeParse({
        ...validPreferences,
        petType,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid temperamentStyle values', () => {
    for (const style of [
      'cuddly_affectionate',
      'playful_energetic',
      'calm_easygoing',
      'independent_low_maintenance',
    ]) {
      const result = UserPreferencesSchema.safeParse({
        ...validPreferences,
        temperamentStyle: style,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('PartialPreferencesSchema', () => {
  it('accepts empty object', () => {
    const result = PartialPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial fields', () => {
    const result = PartialPreferencesSchema.safeParse({
      zipCode: '10001',
      petType: 'dog',
    });
    expect(result.success).toBe(true);
  });

  it('still validates individual field types', () => {
    const result = PartialPreferencesSchema.safeParse({
      zipCode: 'bad',
    });
    expect(result.success).toBe(false);
  });
});
