import { describe, it, expect } from 'vitest';
import {
  QUESTIONNAIRE,
  TOTAL_STEPS,
  DEFAULT_SEARCH_RADIUS,
  SEARCH_RADIUS_MIN,
  SEARCH_RADIUS_MAX,
  SEARCH_RADIUS_STEP,
} from '../constants/questionnaire.js';
import { UserPreferencesSchema } from '../types/preferences.js';

describe('QUESTIONNAIRE constants', () => {
  it('has the correct number of questions', () => {
    expect(QUESTIONNAIRE).toHaveLength(12);
  });

  it('TOTAL_STEPS matches questionnaire length', () => {
    expect(TOTAL_STEPS).toBe(QUESTIONNAIRE.length);
  });

  it('steps are sequential starting from 0', () => {
    const steps = QUESTIONNAIRE.map((q) => q.step);
    expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('every question has a unique id', () => {
    const ids = QUESTIONNAIRE.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every question has a unique field name', () => {
    const fields = QUESTIONNAIRE.map((q) => q.field);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it('every question has a non-empty title', () => {
    for (const q of QUESTIONNAIRE) {
      expect(q.title.length).toBeGreaterThan(0);
    }
  });

  it('every single/multi question has at least 2 options', () => {
    for (const q of QUESTIONNAIRE) {
      if (q.type === 'single' || q.type === 'multi') {
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('every option has a non-empty value and label', () => {
    for (const q of QUESTIONNAIRE) {
      if (q.options) {
        for (const opt of q.options) {
          expect(opt.value.length).toBeGreaterThan(0);
          expect(opt.label.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('text questions have no options', () => {
    for (const q of QUESTIONNAIRE) {
      if (q.type === 'text') {
        expect(q.options).toBeUndefined();
      }
    }
  });

  it('first question is zip code (text input)', () => {
    const first = QUESTIONNAIRE[0];
    expect(first.field).toBe('zipCode');
    expect(first.type).toBe('text');
    expect(first.validation?.required).toBe(true);
  });

  it('last question is breedNotes (conditional, optional)', () => {
    const last = QUESTIONNAIRE[QUESTIONNAIRE.length - 1];
    expect(last.field).toBe('breedNotes');
    expect(last.type).toBe('text');
    expect(last.validation?.required).toBe(false);
    expect(last.conditional).toBeDefined();
    expect(last.conditional!.field).toBe('petType');
    expect(last.conditional!.values).toContain('dog');
    expect(last.conditional!.values).toContain('either');
  });

  it('household question is multi-select', () => {
    const household = QUESTIONNAIRE.find((q) => q.field === 'household');
    expect(household).toBeDefined();
    expect(household!.type).toBe('multi');
  });

  it('all single-select question option values match their Zod schema', () => {
    const schema = UserPreferencesSchema;
    const singleQuestions = QUESTIONNAIRE.filter((q) => q.type === 'single');

    for (const q of singleQuestions) {
      const fieldSchema = schema.shape[q.field as keyof typeof schema.shape];
      expect(fieldSchema).toBeDefined();

      for (const opt of q.options!) {
        const result = fieldSchema.safeParse(opt.value);
        expect(result.success).toBe(true);
      }
    }
  });

  it('multi-select question option values match their Zod schema', () => {
    const household = QUESTIONNAIRE.find((q) => q.field === 'household');
    expect(household).toBeDefined();

    const schema = UserPreferencesSchema.shape.household;
    const result = schema.safeParse(household!.options!.map((o) => o.value));
    expect(result.success).toBe(true);
  });
});

describe('Search radius constants', () => {
  it('DEFAULT_SEARCH_RADIUS is 25', () => {
    expect(DEFAULT_SEARCH_RADIUS).toBe(25);
  });

  it('SEARCH_RADIUS_MIN is 10', () => {
    expect(SEARCH_RADIUS_MIN).toBe(10);
  });

  it('SEARCH_RADIUS_MAX is 100', () => {
    expect(SEARCH_RADIUS_MAX).toBe(100);
  });

  it('SEARCH_RADIUS_STEP is 5', () => {
    expect(SEARCH_RADIUS_STEP).toBe(5);
  });

  it('default radius is within min/max range', () => {
    expect(DEFAULT_SEARCH_RADIUS).toBeGreaterThanOrEqual(SEARCH_RADIUS_MIN);
    expect(DEFAULT_SEARCH_RADIUS).toBeLessThanOrEqual(SEARCH_RADIUS_MAX);
  });

  it('range is evenly divisible by step', () => {
    expect((SEARCH_RADIUS_MAX - SEARCH_RADIUS_MIN) % SEARCH_RADIUS_STEP).toBe(0);
  });
});
