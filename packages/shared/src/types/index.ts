export type {
  PetType,
  LivingSpace,
  ActivityLevel,
  ExperienceLevel,
  AllergyLevel,
  AgePreference,
  SizePreference,
  HouseholdMember,
  TemperamentStyle,
  NoiseTolerance,
  UserPreferences,
  PartialPreferences,
} from './preferences.js';

export {
  PetType as PetTypeSchema,
  LivingSpace as LivingSpaceSchema,
  ActivityLevel as ActivityLevelSchema,
  ExperienceLevel as ExperienceLevelSchema,
  AllergyLevel as AllergyLevelSchema,
  AgePreference as AgePreferenceSchema,
  SizePreference as SizePreferenceSchema,
  HouseholdMember as HouseholdMemberSchema,
  TemperamentStyle as TemperamentStyleSchema,
  NoiseTolerance as NoiseToleranceSchema,
  UserPreferencesSchema,
  PartialPreferencesSchema,
} from './preferences.js';

export type {
  Species,
  PetAge,
  PetGender,
  PetSize,
  ListingType,
  PetSource,
  AnimalAttributes,
  TraitScale,
  BreedTraits,
  EnrichedPet,
  RawPet,
} from './pet.js';

export type {
  AgentResult,
  AgentError,
  AgentStage,
  AgentErrorCode,
  SSEEventType,
  SSEEvent,
} from './agent.js';

export type {
  SessionStatus,
  Session,
  ErrorResponse,
  SearchParams,
} from './api.js';
