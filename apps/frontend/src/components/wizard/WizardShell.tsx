import { useNavigate, useParams } from 'react-router-dom';
import { useWizard } from '../../hooks/useWizard.js';
import { useSessionStore } from '../../store/sessionStore.js';
import { api } from '../../api/client.js';
import { WizardStep } from './WizardStep.js';

export function WizardShell() {
  const { sessionId: paramId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { sessionId } = useSessionStore();
  const wizard = useWizard();

  const activeSessionId = paramId ?? sessionId;

  const handleNext = async () => {
    const isComplete = await wizard.goNext();
    if (isComplete && activeSessionId) {
      wizard.setIsSubmitting(true);
      try {
        // Save all answers one final time
        await api.saveAnswers(activeSessionId, wizard.answers);
        navigate(`/quiz/${activeSessionId}/loading`);
      } catch (err) {
        wizard.setIsSubmitting(false);
      }
    }
  };

  const progress = ((wizard.currentStep + 1) / wizard.totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-10">
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-500 text-center">
            Step {wizard.currentStep + 1} of {wizard.totalSteps}
          </p>
        </div>
      </div>

      {/* Question content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16">
        <div className="max-w-lg w-full">
          <WizardStep
            question={wizard.currentQuestion}
            value={wizard.answers[wizard.currentQuestion.field]}
            onChange={wizard.setStepAnswer}
            error={wizard.stepError}
          />

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={wizard.goBack}
              disabled={!wizard.canGoBack}
              className="px-6 py-3 min-h-[44px] text-gray-600 hover:text-gray-800 disabled:invisible transition-colors"
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={wizard.isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 px-8 min-h-[44px] rounded-xl transition-colors"
            >
              {wizard.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : wizard.currentStep === wizard.totalSteps - 1 ? (
                'Find My Match'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
