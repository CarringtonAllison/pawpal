import type { AgentResult, RawPet, UserPreferences, EnrichedPet } from '@pawpal/shared';
import { scoreMatch, type ScoreResult } from './tools/scoreMatch.js';
import { getBreedTraits } from './tools/breedInfo.js';

export interface ScoredPet extends RawPet {
  matchScore: number;
  dimensionScores: Record<string, number>;
  breedTraits: import('@pawpal/shared').BreedTraits | null;
}

export async function matchingAgent(
  pets: RawPet[],
  prefs: UserPreferences,
): Promise<AgentResult<ScoredPet[]>> {
  const scored: ScoredPet[] = [];

  for (const pet of pets) {
    try {
      const traits = getBreedTraits(pet.breedPrimary, pet.species);
      const result: ScoreResult = scoreMatch(pet, prefs, traits);

      scored.push({
        ...pet,
        matchScore: result.matchScore,
        dimensionScores: result.dimensionScores,
        breedTraits: traits,
      });
    } catch {
      // Skip pets that fail scoring, don't crash the whole batch
      scored.push({
        ...pet,
        matchScore: 50,
        dimensionScores: {},
        breedTraits: null,
      });
    }
  }

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return { ok: true, data: scored };
}
