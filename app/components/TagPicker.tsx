'use client';

import { useState } from 'react';

/**
 * Multi-value picker (chips + add-from-list + add-new). The "book module" Picker
 * generalized to an array field like film genres: current values render as
 * removable chips, and you add more from a dropdown of known options or by typing
 * a new one. Order is preserved; duplicates are ignored.
 */
export function TagPicker({
  label,
  values,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || values.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...values, v]);
    setDraft('');
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const available = options.filter((o) => !values.some((v) => v.toLowerCase() === o.toLowerCase()));

  return (
    <div className="field" style={{ gridColumn: '1 / -1' }}>
      <label>{label}</label>

      {values.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {values.map((v) => (
            <span key={v} className="chip" style={{ gap: 6 }}>
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                aria-label={`Remove ${v}`}
                style={{ border: 'none', background: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder={placeholder}
          list={`taglist-${label}`}
          style={{ flex: 1, minWidth: 0 }}
        />
        <datalist id={`taglist-${label}`}>
          {available.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <button type="button" className="btn sm" disabled={!draft.trim()} onClick={() => add(draft)}>
          + Add
        </button>
      </div>
    </div>
  );
}
