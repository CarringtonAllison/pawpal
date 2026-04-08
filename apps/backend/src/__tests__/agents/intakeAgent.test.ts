import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { intakeAgent } from '../../agents/intakeAgent.js';

const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/address*';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const validAnswers = {
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

function mockCensusSuccess() {
  server.use(
    http.get(CENSUS_URL, () =>
      HttpResponse.json({
        result: {
          addressMatches: [{
            coordinates: { x: -73.99, y: 40.74 },
            addressComponents: { city: 'New York', state: 'NY' },
          }],
        },
      }),
    ),
  );
}

describe('intakeAgent', () => {
  it('validates preferences and geocodes zip on success', async () => {
    mockCensusSuccess();
    const result = await intakeAgent(validAnswers);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.validatedPrefs.zipCode).toBe('10001');
      expect(result.data.coordinates).toEqual({ latitude: 40.74, longitude: -73.99 });
      expect(result.data.locationLabel).toBe('New York, NY');
      expect(result.data.geocodeFallback).toBe(false);
    }
  });

  it('returns INVALID_PREFERENCES when validation fails', async () => {
    const result = await intakeAgent({ zipCode: 'bad' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_PREFERENCES');
      expect(result.error.recoverable).toBe(false);
    }
  });

  it('returns field-level error details', async () => {
    const result = await intakeAgent({ ...validAnswers, petType: 'hamster' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_PREFERENCES');
      expect(result.error.detail).toBeDefined();
    }
  });

  it('falls back to zip-only mode when Census API times out', async () => {
    server.use(
      http.get(CENSUS_URL, () => HttpResponse.error()),
    );
    const result = await intakeAgent(validAnswers);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.coordinates).toBeNull();
      expect(result.data.geocodeFallback).toBe(true);
      expect(result.data.locationLabel).toBe('ZIP 10001');
    }
  });

  it('returns INVALID_ZIP when geocoder finds no matches', async () => {
    server.use(
      http.get(CENSUS_URL, () =>
        HttpResponse.json({ result: { addressMatches: [] } }),
      ),
    );
    const result = await intakeAgent(validAnswers);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_ZIP');
    }
  });
});
