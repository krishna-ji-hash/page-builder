'use client';

import { useEffect, useState } from 'react';
import {
  FONT_CATEGORIES,
  fontOptionIdFromStack,
  resolveFontStack,
} from '@/lib/fontPresets';

/**
 * Categorized font-family dropdown (Serif, Sans-serif, Monospace, Cursive, Fantasy).
 * @param {object} props
 * @param {string} [props.id]
 * @param {string} [props.className]
 * @param {string} props.value — stored CSS stack or preset id
 * @param {(stack: string) => void} props.onChange
 * @param {boolean} [props.includeCustom]
 * @param {boolean} [props.includeInherit] — per-widget: use project theme font
 */
export default function FontFamilySelect({
  id,
  className = 'bld-input',
  value,
  onChange,
  includeCustom = true,
  includeInherit = false,
}) {
  const [customMode, setCustomMode] = useState(false);
  const resolved = resolveFontStack(value);
  const optionId = value === '' || value === '__inherit__' ? '__inherit__' : fontOptionIdFromStack(value);
  const showCustom = includeCustom && (customMode || optionId === 'custom');

  useEffect(() => {
    if (optionId !== 'custom') setCustomMode(false);
  }, [optionId]);

  const selectValue =
    optionId === '__inherit__' ? '__inherit__' : showCustom ? 'custom' : optionId;

  return (
    <>
      <select
        id={id}
        className={className}
        value={selectValue}
        style={{ fontFamily: resolved }}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '__inherit__') {
            setCustomMode(false);
            onChange('');
            return;
          }
          if (next === 'custom') {
            setCustomMode(true);
            return;
          }
          setCustomMode(false);
          onChange(resolveFontStack(next));
        }}
      >
        {includeInherit ? (
          <option value="__inherit__">Project default</option>
        ) : null}
        {FONT_CATEGORIES.map((cat) => (
          <optgroup key={cat.id} label={cat.label}>
            {cat.options.map((opt) => (
              <option key={opt.id} value={opt.id} style={{ fontFamily: opt.stack }}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
        {includeCustom ? <option value="custom">Custom…</option> : null}
      </select>
      {showCustom ? (
        <input
          type="text"
          className="bld-input"
          style={{ marginTop: 8 }}
          value={value || ''}
          placeholder='"My Font", system-ui, sans-serif'
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </>
  );
}
