import { create } from 'zustand';
import type { EnrichedPet, SSEEvent } from '@pawpal/shared';

interface SessionState {
  sessionId: string | null;
  status: string | null;
  answers: Record<string, unknown>;
  favorites: string[];
  results: EnrichedPet[];
  sseEvents: SSEEvent[];
  isCreating: boolean;
  createError: string | null;

  setSessionId: (id: string) => void;
  setStatus: (status: string) => void;
  setAnswer: (field: string, value: unknown) => void;
  setAnswers: (answers: Record<string, unknown>) => void;
  setFavorites: (favorites: string[]) => void;
  toggleFavorite: (petId: string) => void;
  setResults: (results: EnrichedPet[]) => void;
  addSSEEvent: (event: SSEEvent) => void;
  clearSSEEvents: () => void;
  setIsCreating: (creating: boolean) => void;
  setCreateError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null as string | null,
  status: null as string | null,
  answers: {} as Record<string, unknown>,
  favorites: [] as string[],
  results: [] as EnrichedPet[],
  sseEvents: [] as SSEEvent[],
  isCreating: false,
  createError: null as string | null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  setAnswer: (field, value) =>
    set((state) => ({ answers: { ...state.answers, [field]: value } })),
  setAnswers: (answers) => set({ answers }),
  setFavorites: (favorites) => set({ favorites }),
  toggleFavorite: (petId) =>
    set((state) => ({
      favorites: state.favorites.includes(petId)
        ? state.favorites.filter((id) => id !== petId)
        : [...state.favorites, petId],
    })),
  setResults: (results) => set({ results }),
  addSSEEvent: (event) =>
    set((state) => ({ sseEvents: [...state.sseEvents, event] })),
  clearSSEEvents: () => set({ sseEvents: [] }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setCreateError: (error) => set({ createError: error }),
  reset: () => set(initialState),
}));
