export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  timeoutMs: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 500,
  timeoutMs: 8000,
};

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  config: Partial<RetryConfig> = {},
): Promise<Response> {
  const { maxRetries, baseDelayMs, timeoutMs } = { ...DEFAULT_RETRY, ...config };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Don't retry 4xx (client errors) — except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on 429 with Retry-After
      if (response.status === 429) {
        if (attempt < maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
          await delay(waitMs);
          continue;
        }
        return response;
      }

      // Retry on 5xx
      if (response.status >= 500) {
        if (attempt < maxRetries) {
          await delay(baseDelayMs * Math.pow(2, attempt));
          continue;
        }
        return response;
      }

      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        await delay(baseDelayMs * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError ?? new Error('Request failed');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
