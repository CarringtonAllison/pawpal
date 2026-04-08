import type { AgentErrorCode } from './agent.js';

export type SessionStatus =
  | 'questionnaire'
  | 'searching'
  | 'complete'
  | 'partial'
  | 'error';

export interface Session {
  id: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SessionStatus;
  answers: Record<string, unknown> | null;
  favorites: string[];
}

export interface ErrorResponse {
  error: {
    code: AgentErrorCode;
    message: string;
    field?: string;
  };
}

export interface SearchParams {
  sessionId: string;
  radius: number;
}
