import type { AgentResult, RawPet } from '@pawpal/shared';
import { searchPetfinder } from '../services/petfinder.js';
import { searchRescueGroups } from '../services/rescueGroups.js';
import { deduplicate } from './tools/deduplicate.js';
import type { IntakeResult } from './intakeAgent.js';

export interface SearchResult {
  pets: RawPet[];
  warnings: string[];
}

export interface SearchConfig {
  petfinderApiKey: string;
  petfinderSecret: string;
  rescueGroupsApiKey?: string;
}

export async function searchAgent(
  intake: IntakeResult,
  radius: number,
  config: SearchConfig,
): Promise<AgentResult<SearchResult>> {
  const location = intake.coordinates
    ? `${intake.coordinates.latitude},${intake.coordinates.longitude}`
    : intake.validatedPrefs.zipCode;

  const petType = intake.validatedPrefs.petType === 'either'
    ? undefined
    : intake.validatedPrefs.petType;

  // Fire both APIs in parallel
  const [petfinderResult, rescueGroupsResult] = await Promise.allSettled([
    searchPetfinder(
      { type: petType, location, distance: radius },
      config.petfinderApiKey,
      config.petfinderSecret,
    ),
    searchRescueGroups(
      { species: petType, postalCode: intake.validatedPrefs.zipCode, miles: radius },
      config.rescueGroupsApiKey,
    ),
  ]);

  const pets: RawPet[] = [];
  const warnings: string[] = [];

  if (petfinderResult.status === 'fulfilled' && petfinderResult.value.ok) {
    pets.push(...petfinderResult.value.data);
  } else {
    const reason = petfinderResult.status === 'fulfilled' && !petfinderResult.value.ok
      ? petfinderResult.value.error.message
      : 'Petfinder request failed';
    warnings.push(`Petfinder results unavailable: ${reason}`);
  }

  if (rescueGroupsResult.status === 'fulfilled' && rescueGroupsResult.value.ok) {
    pets.push(...rescueGroupsResult.value.data);
  } else {
    const reason = rescueGroupsResult.status === 'fulfilled' && !rescueGroupsResult.value.ok
      ? rescueGroupsResult.value.error.message
      : 'RescueGroups request failed';
    warnings.push(`RescueGroups results unavailable: ${reason}`);
  }

  if (pets.length === 0) {
    // Check if both APIs actually returned empty results (vs errors)
    const bothSucceeded =
      petfinderResult.status === 'fulfilled' && petfinderResult.value.ok &&
      rescueGroupsResult.status === 'fulfilled' && rescueGroupsResult.value.ok;

    if (bothSucceeded || warnings.length < 2) {
      return {
        ok: false,
        error: {
          code: 'NO_PETS_FOUND',
          stage: 'search',
          message: `No pets found within ${radius} miles. Try expanding your search radius.`,
          recoverable: true,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'ALL_SOURCES_FAILED',
        stage: 'search',
        message: 'Pet search services are temporarily unavailable. Please try again in a few minutes.',
        recoverable: true,
      },
    };
  }

  const deduped = deduplicate(pets);

  return {
    ok: true,
    data: { pets: deduped, warnings },
  };
}
