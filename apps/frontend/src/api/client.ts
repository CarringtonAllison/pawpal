import type { ErrorResponse } from '@pawpal/shared';

const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ErrorResponse,
  ) {
    super(body.error.message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'An unexpected error occurred' },
    }));
    throw new ApiError(response.status, body as ErrorResponse);
  }

  return response.json() as Promise<T>;
}

export const api = {
  createSession(zipCode?: string) {
    return request<{ id: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(zipCode ? { zipCode } : {}),
    });
  },

  getSession(sessionId: string) {
    return request<{
      id: string;
      status: string;
      zipCode: string | null;
      answers: Record<string, unknown> | null;
      favorites: string[];
      createdAt: number;
      expiresAt: number;
    }>(`/sessions/${sessionId}`);
  },

  saveAnswers(sessionId: string, answers: Record<string, unknown>) {
    return request<{ ok: true }>(`/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      body: JSON.stringify(answers),
    });
  },

  saveFavorites(sessionId: string, favorites: string[]) {
    return request<{ ok: true }>(`/sessions/${sessionId}/favorites`, {
      method: 'PATCH',
      body: JSON.stringify({ favorites }),
    });
  },

  getResults(sessionId: string) {
    return request<{ results: import('@pawpal/shared').EnrichedPet[] }>(
      `/sessions/${sessionId}/results`,
    );
  },

  triggerSearch(sessionId: string, radius = 25): EventSource {
    return new EventSource(`${BASE_URL}/sessions/${sessionId}/search?radius=${radius}`);
  },
};
