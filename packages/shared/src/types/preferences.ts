import { z } from 'zod';

export const PetType = z.enum(['dog', 'cat', 'either']);
export type PetType = z.infer<typeof PetType>;

export const LivingSpace = z.enum(['apartment', 'small_yard', 'large_yard', 'rural']);
export type LivingSpace = z.infer<typeof LivingSpace>;

export const ActivityLevel = z.enum(['sedentary', 'low', 'moderate', 'high']);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const ExperienceLevel = z.enum(['none', 'some', 'experienced', 'expert']);
export type ExperienceLevel = z.infer<typeof ExperienceLevel>;

export const AllergyLevel = z.enum(['none', 'mild', 'strict']);
export type AllergyLevel = z.infer<typeof AllergyLevel>;

export const AgePreference = z.enum(['baby', 'young', 'adult', 'senior', 'any']);
export type AgePreference = z.infer<typeof AgePreference>;

export const SizePreference = z.enum(['small', 'medium', 'large', 'any']);
export type SizePreference = z.infer<typeof SizePreference>;

export const HouseholdMember = z.enum([
  'adults_only',
  'young_kids',
  'older_kids',
  'other_dogs',
  'other_cats',
]);
export type HouseholdMember = z.infer<typeof HouseholdMember>;

export const TemperamentStyle = z.enum([
  'cuddly_affectionate',
  'playful_energetic',
  'calm_easygoing',
  'independent_low_maintenance',
]);
export type TemperamentStyle = z.infer<typeof TemperamentStyle>;

export const NoiseTolerance = z.enum(['fine_with_noise', 'prefer_quiet']);
export type NoiseTolerance = z.infer<typeof NoiseTolerance>;

export const UserPreferencesSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/, 'Zip code must be exactly 5 digits'),
  petType: PetType,
  livingSpace: LivingSpace,
  activityLevel: ActivityLevel,
  experience: ExperienceLevel,
  allergies: AllergyLevel,
  agePreference: AgePreference,
  sizePreference: SizePreference,
  household: z.array(HouseholdMember).min(1, 'Select at least one household option'),
  temperamentStyle: TemperamentStyle,
  noiseTolerance: NoiseTolerance,
  breedNotes: z.string().max(500, 'Breed notes must be 500 characters or fewer').nullable(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const PartialPreferencesSchema = UserPreferencesSchema.partial();
export type PartialPreferences = z.infer<typeof PartialPreferencesSchema>;
