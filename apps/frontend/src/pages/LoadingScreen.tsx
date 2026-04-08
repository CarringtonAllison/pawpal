import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { SSEEvent } from '@pawpal/shared';
import { useSessionStore } from '../store/sessionStore.js';
import { useSSE } from '../hooks/useSSE.js';

const STAGES = ['intake', 'search', 'matching', 'enrichment'] as const;
const STAGE_LABELS: Record<string, string> = {
  intake: 'Verifying location',
  search: 'Searching pet databases',
  matching: 'Ranking matches by compatibility',
  enrichment: 'Preparing your top picks',
};

function getStageState(
  stage: string,
  events: SSEEvent[],
): 'pending' | 'active' | 'done' {
  const stageEvents = events.filter(
    (e) => e.stage === stage && (e.type === 'progress' || e.type === 'warning'),
  );
  if (stageEvents.length > 0) return 'done';

  // Check if a later stage is active — means this one is done
  const stageOrder = STAGES.indexOf(stage as (typeof STAGES)[number]);
  const laterActive = events.some((e) => {
    const eOrder = STAGES.indexOf(e.stage as (typeof STAGES)[number]);
    return eOrder > stageOrder && (e.type === 'progress' || e.type === 'warning');
  });
  if (laterActive) return 'done';

  // Check if this is the current active stage
  const lastProgress = [...events].reverse().find(
    (e) => e.type === 'progress' || e.type === 'warning',
  );
  if (lastProgress) {
    const lastOrder = STAGES.indexOf(lastProgress.stage as (typeof STAGES)[number]);
    if (lastOrder + 1 === stageOrder) return 'active';
  }

  // First stage is active if no events yet
  if (stageOrder === 0 && events.length === 0) return 'active';

  return 'pending';
}

export function LoadingScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { sseEvents, status } = useSessionStore();

  useSSE(sessionId ?? null);

  useEffect(() => {
    if (status === 'complete' || status === 'partial') {
      navigate(`/results/${sessionId}`, { replace: true });
    }
  }, [status, sessionId, navigate]);

  const pipelineError = sseEvents.find((e) => e.type === 'pipeline_error');
  const completedStages = STAGES.filter(
    (s) => getStageState(s, sseEvents) === 'done',
  ).length;
  const progress = Math.round((completedStages / STAGES.length) * 100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-teal-800 mb-8">
          Finding your matches...
        </h2>

        <div className="space-y-4 mb-8 text-left">
          {STAGES.map((stage) => {
            const state = getStageState(stage, sseEvents);
            const event = sseEvents.find(
              (e) => e.stage === stage && (e.type === 'progress' || e.type === 'warning'),
            );
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-xl w-6 text-center">
                  {state === 'done' && '✅'}
                  {state === 'active' && '⏳'}
                  {state === 'pending' && '○'}
                </span>
                <span className={`text-sm ${state === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>
                  {event?.message ?? STAGE_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-gray-500">
          This usually takes 15-30 seconds
        </p>

        {pipelineError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-red-700 text-sm">{pipelineError.message}</p>
            {pipelineError.recoverable && (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-600 text-white text-sm py-2 px-4 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
