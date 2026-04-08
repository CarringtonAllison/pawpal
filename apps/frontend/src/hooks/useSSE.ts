import { useEffect, useRef } from 'react';
import type { SSEEvent } from '@pawpal/shared';
import { useSessionStore } from '../store/sessionStore.js';

export function useSSE(sessionId: string | null, radius = 25) {
  const { addSSEEvent, setStatus } = useSessionStore();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const url = `/api/sessions/${sessionId}/search?radius=${radius}`;
    const source = new EventSource(url, { withCredentials: false });
    sourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        addSSEEvent(data);

        if (data.type === 'results_ready') {
          setStatus('complete');
          source.close();
        } else if (data.type === 'pipeline_error') {
          setStatus('error');
          source.close();
        }
      } catch {
        // Ignore malformed SSE data
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [sessionId, radius, addSSEEvent, setStatus]);
}
