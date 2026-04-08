import type { RawPet, BreedTraits, UserPreferences } from '@pawpal/shared';

export interface ScoreResult {
  matchScore: number;
  dimensionScores: Record<string, number>;
}

const WEIGHTS = {
  activity: 0.20,
  livingSpace: 0.15,
  hypoallergenic: 0.15,
  age: 0.10,
  size: 0.10,
  experience: 0.10,
  temperament: 0.10,
  noise: 0.05,
  compatibility: 0.05,
} as const;

export function scoreMatch(
  pet: RawPet,
  prefs: UserPreferences,
  breedTraits: BreedTraits | null,
): ScoreResult {
  const dimensions: Record<string, number> = {};

  // Activity match: prefs.activityLevel × breed energyLevel
  dimensions.activity = scoreActivity(prefs.activityLevel, breedTraits?.energyLevel ?? 3);

  // Living space fit
  dimensions.livingSpace = scoreLivingSpace(prefs.livingSpace, breedTraits, pet.size);

  // Hypoallergenic match
  dimensions.hypoallergenic = scoreAllergy(prefs.allergies, breedTraits);

  // Age match
  dimensions.age = scoreAge(prefs.agePreference, pet.age);

  // Size match
  dimensions.size = scoreSize(prefs.sizePreference, pet.size);

  // Experience fit
  dimensions.experience = scoreExperience(prefs.experience, breedTraits?.experienceRequired ?? 'none');

  // Temperament style
  dimensions.temperament = scoreTemperament(prefs.temperamentStyle, breedTraits, pet.shelterTraits.tags);

  // Noise tolerance
  dimensions.noise = scoreNoise(prefs.noiseTolerance, breedTraits?.barkingLevel ?? 3);

  // Compatibility (individual animal data takes priority)
  dimensions.compatibility = scoreCompatibility(prefs.household, pet, breedTraits);

  // Weighted total
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    total += (dimensions[key] ?? 50) * weight;
  }

  return {
    matchScore: Math.round(total),
    dimensionScores: dimensions,
  };
}

function scoreActivity(pref: string, energyLevel: number): number {
  const prefMap: Record<string, number> = { sedentary: 1, low: 2, moderate: 3, high: 5 };
  const prefLevel = prefMap[pref] ?? 3;
  const diff = Math.abs(prefLevel - energyLevel);
  return Math.max(0, 100 - diff * 25);
}

function scoreLivingSpace(
  space: string,
  traits: BreedTraits | null,
  petSize: string,
): number {
  if (space === 'apartment') {
    if (traits?.apartmentFriendly) return 100;
    if (petSize === 'small') return 80;
    if (petSize === 'medium') return 50;
    return 20;
  }
  if (space === 'rural') return 100; // everything fits in rural
  if (space === 'large_yard') return petSize === 'xlarge' ? 100 : 90;
  // small_yard
  return petSize === 'xlarge' ? 50 : 80;
}

function scoreAllergy(pref: string, traits: BreedTraits | null): number {
  if (pref === 'none') return 100;
  if (pref === 'strict') {
    return traits?.hypoallergenic ? 100 : 0;
  }
  // mild
  if (traits?.hypoallergenic) return 100;
  const shedding = traits?.sheddingLevel ?? 3;
  return shedding <= 2 ? 80 : shedding <= 3 ? 50 : 20;
}

function scoreAge(pref: string, petAge: string): number {
  if (pref === 'any') return 100;
  return pref === petAge ? 100 : 40;
}

function scoreSize(pref: string, petSize: string): number {
  if (pref === 'any') return 100;
  return pref === petSize ? 100 : 40;
}

function scoreExperience(pref: string, required: string): number {
  const levels: Record<string, number> = { none: 0, some: 1, experienced: 2, expert: 3 };
  const userLevel = levels[pref] ?? 0;
  const requiredLevel = levels[required] ?? 0;
  if (userLevel >= requiredLevel) return 100;
  return Math.max(0, 100 - (requiredLevel - userLevel) * 40);
}

function scoreTemperament(
  pref: string,
  traits: BreedTraits | null,
  shelterTags: string[],
): number {
  // Check shelter tags first (higher authority)
  const tagStr = shelterTags.join(' ').toLowerCase();

  const prefKeywords: Record<string, string[]> = {
    cuddly_affectionate: ['cuddly', 'affectionate', 'lap', 'snuggle', 'loving'],
    playful_energetic: ['playful', 'energetic', 'active', 'fun', 'bouncy'],
    calm_easygoing: ['calm', 'gentle', 'easygoing', 'relaxed', 'mellow'],
    independent_low_maintenance: ['independent', 'aloof', 'quiet', 'self-sufficient'],
  };

  const keywords = prefKeywords[pref] ?? [];
  const tagMatches = keywords.filter((k) => tagStr.includes(k)).length;
  if (tagMatches > 0) return Math.min(100, 70 + tagMatches * 15);

  // Fall back to breed traits
  if (!traits) return 50;

  switch (pref) {
    case 'cuddly_affectionate':
      return traits.affectionLevel * 20;
    case 'playful_energetic':
      return traits.playfulness * 20;
    case 'calm_easygoing':
      return (6 - traits.energyLevel) * 20; // invert energy
    case 'independent_low_maintenance':
      return (6 - traits.affectionLevel) * 20; // invert affection
    default:
      return 50;
  }
}

function scoreNoise(pref: string, barkingLevel: number): number {
  if (pref === 'fine_with_noise') return 100;
  // prefer_quiet: lower barking = better
  return Math.max(0, 100 - (barkingLevel - 1) * 25);
}

function scoreCompatibility(
  household: string[],
  pet: RawPet,
  traits: BreedTraits | null,
): number {
  let total = 0;
  let count = 0;

  if (household.includes('young_kids') || household.includes('older_kids')) {
    count++;
    const shelterVal = pet.shelterTraits.environment.children;
    if (shelterVal === true) total += 100;
    else if (shelterVal === false) total += 0;
    else total += (traits?.goodWithKids ? 50 : 25); // 50% confidence for breed estimate
  }

  if (household.includes('other_dogs')) {
    count++;
    const shelterVal = pet.shelterTraits.environment.dogs;
    if (shelterVal === true) total += 100;
    else if (shelterVal === false) total += 0;
    else total += (traits?.goodWithDogs ? 50 : 25);
  }

  if (household.includes('other_cats')) {
    count++;
    const shelterVal = pet.shelterTraits.environment.cats;
    if (shelterVal === true) total += 100;
    else if (shelterVal === false) total += 0;
    else total += (traits?.goodWithCats ? 50 : 25);
  }

  if (count === 0) return 100; // adults_only — no compatibility constraints
  return Math.round(total / count);
}
