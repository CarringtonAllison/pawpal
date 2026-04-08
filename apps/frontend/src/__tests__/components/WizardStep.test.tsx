import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WizardStep } from '../../components/wizard/WizardStep.js';
import type { QuestionDefinition } from '@pawpal/shared';

const textQuestion: QuestionDefinition = {
  id: 'zip',
  step: 0,
  field: 'zipCode',
  title: "What's your zip code?",
  subtitle: "We'll find pets near you",
  type: 'text',
  placeholder: '10001',
  validation: { required: true, pattern: '^\\d{5}$' },
};

const singleQuestion: QuestionDefinition = {
  id: 'pet-type',
  step: 1,
  field: 'petType',
  title: 'Are you looking for a dog or a cat?',
  type: 'single',
  options: [
    { value: 'dog', label: 'Dog', description: 'Loyal companion' },
    { value: 'cat', label: 'Cat', description: 'Independent friend' },
    { value: 'either', label: 'Either' },
  ],
};

const multiQuestion: QuestionDefinition = {
  id: 'household',
  step: 8,
  field: 'household',
  title: 'Who lives in your household?',
  subtitle: 'Select all that apply',
  type: 'multi',
  options: [
    { value: 'adults_only', label: 'Adults only' },
    { value: 'young_kids', label: 'Young children' },
    { value: 'other_dogs', label: 'Other dogs' },
  ],
};

describe('WizardStep', () => {
  it('renders text input with title and placeholder', () => {
    render(<WizardStep question={textQuestion} value="" onChange={vi.fn()} error={null} />);
    expect(screen.getByText("What's your zip code?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('10001')).toBeInTheDocument();
  });

  it('renders subtitle when present', () => {
    render(<WizardStep question={textQuestion} value="" onChange={vi.fn()} error={null} />);
    expect(screen.getByText("We'll find pets near you")).toBeInTheDocument();
  });

  it('calls onChange for text input', async () => {
    const onChange = vi.fn();
    render(<WizardStep question={textQuestion} value="" onChange={onChange} error={null} />);
    await userEvent.type(screen.getByPlaceholderText('10001'), '1');
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('renders all single-select options', () => {
    render(<WizardStep question={singleQuestion} value="" onChange={vi.fn()} error={null} />);
    expect(screen.getByText('Dog')).toBeInTheDocument();
    expect(screen.getByText('Cat')).toBeInTheDocument();
    expect(screen.getByText('Either')).toBeInTheDocument();
  });

  it('calls onChange when single-select option is clicked', async () => {
    const onChange = vi.fn();
    render(<WizardStep question={singleQuestion} value="" onChange={onChange} error={null} />);
    await userEvent.click(screen.getByText('Dog'));
    expect(onChange).toHaveBeenCalledWith('dog');
  });

  it('renders multi-select options', () => {
    render(<WizardStep question={multiQuestion} value={[]} onChange={vi.fn()} error={null} />);
    expect(screen.getByText('Adults only')).toBeInTheDocument();
    expect(screen.getByText('Young children')).toBeInTheDocument();
    expect(screen.getByText('Other dogs')).toBeInTheDocument();
  });

  it('toggles multi-select on click', async () => {
    const onChange = vi.fn();
    render(<WizardStep question={multiQuestion} value={['adults_only']} onChange={onChange} error={null} />);
    await userEvent.click(screen.getByText('Other dogs'));
    expect(onChange).toHaveBeenCalledWith(['adults_only', 'other_dogs']);
  });

  it('removes from multi-select on second click', async () => {
    const onChange = vi.fn();
    render(<WizardStep question={multiQuestion} value={['adults_only', 'other_dogs']} onChange={onChange} error={null} />);
    await userEvent.click(screen.getByText('Adults only'));
    expect(onChange).toHaveBeenCalledWith(['other_dogs']);
  });

  it('displays error message', () => {
    render(<WizardStep question={textQuestion} value="" onChange={vi.fn()} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders option descriptions', () => {
    render(<WizardStep question={singleQuestion} value="" onChange={vi.fn()} error={null} />);
    expect(screen.getByText('Loyal companion')).toBeInTheDocument();
    expect(screen.getByText('Independent friend')).toBeInTheDocument();
  });
});
