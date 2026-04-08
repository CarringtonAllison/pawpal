export type AgentResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AgentError };

export interface AgentError {
  code: AgentErrorCode;
  stage: AgentStage;
  message: string;
  detail?: string;
  recoverable: boolean;
  partial?: unknown;
}

export type AgentStage =
  | 'intake'
  | 'search'
  | 'matching'
  | 'enrichment'
  | 'orchestrator';

export type AgentErrorCode =
  // Intake
  | 'INVALID_ZIP'
  | 'GEOCODE_UNAVAILABLE'
  | 'INVALID_PREFERENCES'
  // Search
  | 'RESCUE_GROUPS_UNAVAILABLE'
  | 'NO_PETS_FOUND'
  // Matching
  | 'MATCHING_FAILED'
  // Enrichment
  | 'ENRICHMENT_PARTIAL'
  | 'ENRICHMENT_FAILED'
  // General
  | 'AI_API_UNAVAILABLE'
  | 'AI_RATE_LIMITED'
  | 'SESSION_NOT_FOUND'
  | 'DB_WRITE_FAILED'
  | 'DB_READ_FAILED'
  | 'DB_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export type SSEEventType =
  | 'progress'
  | 'warning'
  | 'error'
  | 'results_ready'
  | 'pipeline_error';

export interface SSEEvent {
  type: SSEEventType;
  stage: AgentStage | 'pipeline';
  message: string;
  warnings?: string[];
  code?: AgentErrorCode;
  recoverable?: boolean;
}
