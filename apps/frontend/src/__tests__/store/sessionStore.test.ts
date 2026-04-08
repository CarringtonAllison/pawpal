import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../../store/sessionStore.js';

beforeEach(() => {
  useSessionStore.getState().reset();
});

describe('sessionStore', () => {
  it('starts with null sessionId', () => {
    expect(useSessionStore.getState().sessionId).toBeNull();
  });

  it('setSessionId updates the store', () => {
    useSessionStore.getState().setSessionId('abc-123');
    expect(useSessionStore.getState().sessionId).toBe('abc-123');
  });

  it('setAnswer merges into answers', () => {
    useSessionStore.getState().setAnswer('petType', 'dog');
    useSessionStore.getState().setAnswer('livingSpace', 'apartment');
    expect(useSessionStore.getState().answers).toEqual({
      petType: 'dog',
      livingSpace: 'apartment',
    });
  });

  it('setAnswers replaces all answers', () => {
    useSessionStore.getState().setAnswer('petType', 'dog');
    useSessionStore.getState().setAnswers({ petType: 'cat' });
    expect(useSessionStore.getState().answers).toEqual({ petType: 'cat' });
  });

  it('toggleFavorite adds and removes pet IDs', () => {
    useSessionStore.getState().toggleFavorite('pf-1');
    expect(useSessionStore.getState().favorites).toEqual(['pf-1']);

    useSessionStore.getState().toggleFavorite('pf-2');
    expect(useSessionStore.getState().favorites).toEqual(['pf-1', 'pf-2']);

    useSessionStore.getState().toggleFavorite('pf-1');
    expect(useSessionStore.getState().favorites).toEqual(['pf-2']);
  });

  it('addSSEEvent appends to events array', () => {
    useSessionStore.getState().addSSEEvent({
      type: 'progress',
      stage: 'intake',
      message: 'Located: New York, NY',
    });
    expect(useSessionStore.getState().sseEvents).toHaveLength(1);
  });

  it('reset clears all state', () => {
    useSessionStore.getState().setSessionId('abc');
    useSessionStore.getState().setAnswer('petType', 'dog');
    useSessionStore.getState().toggleFavorite('pf-1');
    useSessionStore.getState().reset();

    const state = useSessionStore.getState();
    expect(state.sessionId).toBeNull();
    expect(state.answers).toEqual({});
    expect(state.favorites).toEqual([]);
  });
});
