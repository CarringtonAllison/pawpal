import type { AgentResult, RawPet } from '@pawpal/shared';
import { searchRescueGroups } from '../services/rescueGroups.js';
import type { IntakeResult } from './intakeAgent.js';

export interface SearchResult {
  pets: RawPet[];
  warnings: string[];
}

export interface SearchConfig {
  rescueGroupsApiKey?: string;
}

export async function searchAgent(
  intake: IntakeResult,
  radius: number,
  config: SearchConfig,
): Promise<AgentResult<SearchResult>> {
  const petType = intake.validatedPrefs.petType === 'either'
    ? undefined
    : intake.validatedPrefs.petType;

  const result = await searchRescueGroups(
    { species: petType, postalCode: intake.validatedPrefs.zipCode, miles: radius },
    config.rescueGroupsApiKey,
  );

  if (!result.ok) {
    return {
      ok: false,
      error: {
        code: 'RESCUE_GROUPS_UNAVAILABLE',
        stage: 'search',
        message: 'Pet search service is temporarily unavailable. Please try again in a few minutes.',
        recoverable: true,
      },
    };
  }

  if (result.data.length === 0) {
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
    ok: true,
    data: { pets: result.data, warnings: [] },
  };
}
