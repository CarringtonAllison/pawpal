import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client.js';

interface SessionStatusResult {
  status: string | null;
  isLoading: boolean;
  error: string | null;
}

const cache = new Map<string, string>();

export function useSessionStatus(sessionId: string | undefined): SessionStatusResult {
  const [status, setStatus] = useState<string | null>(
    sessionId ? cache.get(sessionId) ?? null : null,
  );
  const [isLoading, setIsLoading] = useState(!cache.has(sessionId ?? ''));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      setError('No session ID');
      return;
    }

    if (cache.has(sessionId)) {
      setStatus(cache.get(sessionId)!);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    api.getSession(sessionId)
      .then((session) => {
        if (!cancelled) {
          cache.set(sessionId, session.status);
          setStatus(session.status);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load session');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [sessionId]);

  return { status, isLoading, error };
}

export function invalidateSessionCache(sessionId: string): void {
  cache.delete(sessionId);
}
