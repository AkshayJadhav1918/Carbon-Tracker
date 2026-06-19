import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CarbonInputs } from '../types';

interface InputFieldProps {
  id: keyof CarbonInputs;
  label: string;
  value: number;
  unit: string;
  helper: string;
  error?: string;
  step?: number | string;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  onBlur: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  unit,
  helper,
  error,
  step = 'any',
  min = 0,
  max,
  onChange,
  onBlur,
}) => {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const ariaDescribedBy = [helper ? helperId : '', error ? errorId : ''].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
        {label}
        {unit && <span className="text-gray-600 font-normal ml-1">({unit})</span>}
      </label>
      <input
        id={id}
        type="number"
        value={value === 0 ? '' : value}
        min={min}
        max={max}
        step={step}
        placeholder="0"
        aria-describedby={ariaDescribedBy || undefined}
        aria-invalid={!!error}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        onBlur={onBlur}
        className={`
          w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-all duration-150 font-mono
          ${error ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}
        `}
      />
      {helper && (
        <span id={helperId} className="block text-xs text-gray-600 leading-normal">
          {helper}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
};

export default React.memo(InputField);
