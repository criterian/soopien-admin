'use client';

import { useState } from 'react';

export type Option = { value: string; label: string };

/**
 * Single-select over known options + an "add new" escape hatch for anything not
 * listed. A value that isn't a known option (legacy/free-text data) is surfaced
 * as its own "custom" option rather than silently dropped.
 */
export function Picker({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
}) {
  const [adding, setAdding] = useState(false);
  const known = options.some((o) => o.value === value);
  const opts = !value || known ? options : [{ value, label: `${value} — custom` }, ...options];

  return (
    <div className="field">
      <label>{label}</label>
      {adding ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, minWidth: 0 }} />
          <button type="button" className="btn sm" onClick={() => setAdding(false)}>
            Done
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, minWidth: 0 }}>
            <option value="">— none —</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn sm" onClick={() => { onChange(''); setAdding(true); }} title={placeholder}>
            + New
          </button>
        </div>
      )}
    </div>
  );
}
