import type { QuestionDefinition } from '@pawpal/shared';

interface WizardStepProps {
  question: QuestionDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error: string | null;
}

export function WizardStep({ question, value, onChange, error }: WizardStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{question.title}</h2>
      {question.subtitle && (
        <p className="text-gray-500 mb-6">{question.subtitle}</p>
      )}

      {question.type === 'text' && (
        <TextInput
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={question.placeholder}
        />
      )}

      {question.type === 'single' && question.options && (
        <SingleSelect
          options={question.options}
          value={value as string}
          onChange={onChange}
        />
      )}

      {question.type === 'multi' && question.options && (
        <MultiSelect
          options={question.options}
          value={(value as string[]) ?? []}
          onChange={onChange}
        />
      )}

      {error && (
        <p className="mt-3 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      autoFocus
    />
  );
}

function SingleSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full text-left px-4 py-3 min-h-[44px] rounded-xl border-2 transition-all ${
            value === opt.value
              ? 'border-teal-500 bg-teal-50 text-teal-800'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <span className="font-medium">{opt.label}</span>
          {opt.description && (
            <span className="block text-sm text-gray-500 mt-0.5">{opt.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className={`w-full text-left px-4 py-3 min-h-[44px] rounded-xl border-2 transition-all ${
            value.includes(opt.value)
              ? 'border-teal-500 bg-teal-50 text-teal-800'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              value.includes(opt.value) ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
            }`}>
              {value.includes(opt.value) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="font-medium">{opt.label}</span>
          </span>
          {opt.description && (
            <span className="block text-sm text-gray-500 mt-0.5 ml-7">{opt.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}
