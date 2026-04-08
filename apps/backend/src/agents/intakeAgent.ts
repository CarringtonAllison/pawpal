import type { AgentResult, UserPreferences } from '@pawpal/shared';
import { UserPreferencesSchema } from '@pawpal/shared';
import { geocodeZip, type GeocoderResult } from '../services/geocoder.js';

export interface IntakeResult {
  validatedPrefs: UserPreferences;
  coordinates: { latitude: number; longitude: number } | null;
  locationLabel: string;
  geocodeFallback: boolean;
}

export async function intakeAgent(
  answers: Record<string, unknown>,
): Promise<AgentResult<IntakeResult>> {
  // Validate preferences
  const parseResult = UserPreferencesSchema.safeParse(answers);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return {
      ok: false,
      error: {
        code: 'INVALID_PREFERENCES',
        stage: 'intake',
        message: firstIssue?.message ?? 'Invalid preferences',
        detail: JSON.stringify(parseResult.error.issues),
        recoverable: false,
      },
    };
  }

  const prefs = parseResult.data;

  // Geocode zip
  const geoResult = await geocodeZip(prefs.zipCode);

  if (!geoResult.ok) {
    if (geoResult.error.code === 'INVALID_ZIP') {
      return { ok: false, error: geoResult.error };
    }

    // Geocoder unavailable — fall back to zip-only mode
    return {
      ok: true,
      data: {
        validatedPrefs: prefs,
        coordinates: null,
        locationLabel: `ZIP ${prefs.zipCode}`,
        geocodeFallback: true,
      },
    };
  }

  return {
    ok: true,
    data: {
      validatedPrefs: prefs,
      coordinates: {
        latitude: geoResult.data.latitude,
        longitude: geoResult.data.longitude,
      },
      locationLabel: `${geoResult.data.city}, ${geoResult.data.state}`,
      geocodeFallback: false,
    },
  };
}
