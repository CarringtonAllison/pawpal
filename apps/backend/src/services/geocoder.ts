import type { AgentResult, AgentError } from '@pawpal/shared';
import { fetchWithRetry } from './httpClient.js';

export interface GeocoderResult {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

const CENSUS_BASE = 'https://geocoding.geo.census.gov/geocoder/locations/address';

export async function geocodeZip(zip: string): Promise<AgentResult<GeocoderResult>> {
  const url = `${CENSUS_BASE}?zip=${zip}&benchmark=Public_AR_Current&format=json`;

  let response: Response;
  try {
    response = await fetchWithRetry(url, {}, { timeoutMs: 5000, maxRetries: 1 });
  } catch {
    return makeError('GEOCODE_UNAVAILABLE', 'Location service is temporarily unavailable');
  }

  if (!response.ok) {
    return makeError('GEOCODE_UNAVAILABLE', 'Location service returned an error');
  }

  let data: CensusResponse;
  try {
    data = await response.json() as CensusResponse;
  } catch {
    return makeError('GEOCODE_UNAVAILABLE', 'Location service returned invalid data');
  }

  const matches = data.result?.addressMatches;
  if (!matches || matches.length === 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ZIP',
        stage: 'intake',
        message: "We couldn't find that zip code. Please check and try again.",
        recoverable: false,
      },
    };
  }

  const match = matches[0];
  return {
    ok: true,
    data: {
      latitude: match.coordinates.y,
      longitude: match.coordinates.x,
      city: match.addressComponents?.city ?? '',
      state: match.addressComponents?.state ?? '',
    },
  };
}

function makeError(code: 'GEOCODE_UNAVAILABLE' | 'INVALID_ZIP', message: string): { ok: false; error: AgentError } {
  return {
    ok: false,
    error: {
      code,
      stage: 'intake',
      message,
      recoverable: code === 'GEOCODE_UNAVAILABLE',
    },
  };
}

interface CensusResponse {
  result?: {
    addressMatches: Array<{
      coordinates: { x: number; y: number };
      addressComponents?: { city: string; state: string };
    }>;
  };
}
