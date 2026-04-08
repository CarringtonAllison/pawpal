import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { geocodeZip } from '../../services/geocoder.js';

const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/address*';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('geocodeZip', () => {
  it('returns coordinates for a valid zip', async () => {
    server.use(
      http.get(CENSUS_URL, () => {
        return HttpResponse.json({
          result: {
            addressMatches: [
              {
                coordinates: { x: -73.9967, y: 40.7484 },
                addressComponents: { city: 'New York', state: 'NY' },
              },
            ],
          },
        });
      }),
    );

    const result = await geocodeZip('10001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.latitude).toBe(40.7484);
      expect(result.data.longitude).toBe(-73.9967);
      expect(result.data.city).toBe('New York');
      expect(result.data.state).toBe('NY');
    }
  });

  it('returns INVALID_ZIP when no matches found', async () => {
    server.use(
      http.get(CENSUS_URL, () => {
        return HttpResponse.json({
          result: { addressMatches: [] },
        });
      }),
    );

    const result = await geocodeZip('00000');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_ZIP');
      expect(result.error.recoverable).toBe(false);
    }
  });

  it('returns GEOCODE_UNAVAILABLE on server error', async () => {
    server.use(
      http.get(CENSUS_URL, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const result = await geocodeZip('10001');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('GEOCODE_UNAVAILABLE');
      expect(result.error.recoverable).toBe(true);
    }
  });

  it('returns GEOCODE_UNAVAILABLE on network error', async () => {
    server.use(
      http.get(CENSUS_URL, () => {
        return HttpResponse.error();
      }),
    );

    const result = await geocodeZip('10001');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('GEOCODE_UNAVAILABLE');
    }
  });
});
