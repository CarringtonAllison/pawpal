import { useState, useCallback } from 'react';
import { QUESTIONNAIRE, TOTAL_STEPS } from '@pawpal/shared';
import { useSessionStore } from '../store/sessionStore.js';
import { api } from '../api/client.js';

export function useWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { sessionId, answers, setAnswer } = useSessionStore();

  const currentQuestion = QUESTIONNAIRE[currentStep];

  const validateCurrentStep = useCallback((): boolean => {
    const question = QUESTIONNAIRE[currentStep];
    const value = answers[question.field];

    if (question.validation?.required && (value === undefined || value === null || value === '')) {
      setStepError('This field is required');
      return false;
    }

    if (question.type === 'text' && question.validation?.pattern && typeof value === 'string') {
      const regex = new RegExp(question.validation.pattern);
      if (!regex.test(value)) {
        setStepError(question.field === 'zipCode' ? 'Please enter a valid 5-digit zip code' : 'Invalid input');
        return false;
      }
    }

    if (question.type === 'text' && question.validation?.maxLength && typeof value === 'string') {
      if (value.length > question.validation.maxLength) {
        setStepError(`Must be ${question.validation.maxLength} characters or fewer`);
        return false;
      }
    }

    if (question.type === 'multi' && Array.isArray(value) && value.length === 0) {
      setStepError('Select at least one option');
      return false;
    }

    setStepError(null);
    return true;
  }, [currentStep, answers]);

  const goNext = useCallback(async () => {
    if (!validateCurrentStep()) return false;

    // Save answers to backend
    if (sessionId) {
      const question = QUESTIONNAIRE[currentStep];
      try {
        await api.saveAnswers(sessionId, { [question.field]: answers[question.field] });
      } catch {
        // Non-fatal — answers are in Zustand, will retry on submit
      }
    }

    // Skip conditional questions that don't apply
    let nextStep = currentStep + 1;
    while (nextStep < TOTAL_STEPS) {
      const nextQ = QUESTIONNAIRE[nextStep];
      if (nextQ.conditional) {
        const condValue = answers[nextQ.conditional.field];
        if (!nextQ.conditional.values.includes(condValue as string)) {
          // Set the conditional field to null since it's skipped
          setAnswer(nextQ.field, null);
          nextStep++;
          continue;
        }
      }
      break;
    }

    if (nextStep >= TOTAL_STEPS) {
      return true; // wizard complete
    }

    setCurrentStep(nextStep);
    setStepError(null);
    return false;
  }, [currentStep, validateCurrentStep, sessionId, answers, setAnswer]);

  const goBack = useCallback(() => {
    let prevStep = currentStep - 1;
    while (prevStep >= 0) {
      const prevQ = QUESTIONNAIRE[prevStep];
      if (prevQ.conditional) {
        const condValue = answers[prevQ.conditional.field];
        if (!prevQ.conditional.values.includes(condValue as string)) {
          prevStep--;
          continue;
        }
      }
      break;
    }

    if (prevStep >= 0) {
      setCurrentStep(prevStep);
      setStepError(null);
    }
  }, [currentStep, answers]);

  const setStepAnswer = useCallback(
    (value: unknown) => {
      setAnswer(currentQuestion.field, value);
      setStepError(null);
    },
    [currentQuestion, setAnswer],
  );

  return {
    currentStep,
    currentQuestion,
    totalSteps: TOTAL_STEPS,
    stepError,
    isSubmitting,
    setIsSubmitting,
    answers,
    setStepAnswer,
    goNext,
    goBack,
    canGoBack: currentStep > 0,
  };
}
