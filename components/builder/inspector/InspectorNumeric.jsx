'use client';

import { clampFiniteNumber, numInputDisplayValue, parseFiniteNumber } from '@/lib/inspectorNumeric';

/**
 * Bare controlled number input — never passes NaN to React.
 */
export function InspectorNumInput({
  id,
  value,
  onChange,
  placeholder,
  min = 0,
  max = 2560,
  step = 1,
  disabled = false,
  className = 'bld-input',
}) {
  return (
    <input
      id={id}
      type="number"
      className={className}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      value={numInputDisplayValue(value)}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange?.(null);
          return;
        }
        const n = parseFiniteNumber(raw);
        if (n == null) return;
        onChange?.(clampFiniteNumber(n, { min, max, fallback: min }));
      }}
    />
  );
}

/** Field + label wrapper around {@link InspectorNumInput}. */
export function InspectorNumField({
  id,
  label,
  value,
  onChange,
  placeholder,
  min = 0,
  max = 2560,
  step = 1,
  disabled = false,
  className = 'bld-field',
  inputClassName = 'bld-input',
}) {
  return (
    <div className={className}>
      {label ? (
        <label className="bld-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <InspectorNumInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClassName}
      />
    </div>
  );
}

/** Legacy handlers that expect string values from inputs. */
export function inspectorNumStringChange(onUpdate, key) {
  return (n) => onUpdate(key, n == null ? '' : String(n));
}

export { numInputDisplayValue, parseFiniteNumber, clampFiniteNumber };
