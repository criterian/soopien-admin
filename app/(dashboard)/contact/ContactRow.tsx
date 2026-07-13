'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setContactStatus, type ContactStatus } from './actions';
import { fmtDateTime } from '@/lib/format';

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string | null;
  message: string;
  status: string;
  created_at: string;
};

export function ContactRow({ m }: { m: ContactMessage }) {
  const router = useRouter();
  const [open, setOpen] = useState(m.status === 'new');
  const [pending, start] = useTransition();

  const update = (status: ContactStatus) =>
    start(async () => {
      await setContactStatus(m.id, status);
      router.refresh();
    });

  return (
    <div className="card" style={{ padding: 16, marginBottom: 12 }}>
      <div
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ color: 'var(--text)' }}>{m.name}</strong>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {m.email}
            </span>
            {m.topic ? <span className="chip">{m.topic}</span> : null}
            <StatusChip status={m.status} />
          </div>
          <div
            className="muted"
            style={{
              fontSize: 13,
              marginTop: 6,
              ...(open
                ? { whiteSpace: 'pre-wrap' }
                : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
            }}
          >
            {m.message}
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {fmtDateTime(m.created_at)}
        </div>
      </div>

      {open ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <a className="btn sm" href={`mailto:${m.email}?subject=Re: ${m.topic ?? 'Your message to Soopien'}`}>
            Reply by email
          </a>
          {m.status !== 'read' ? (
            <button className="btn sm" disabled={pending} onClick={() => update('read')}>
              Mark read
            </button>
          ) : null}
          {m.status !== 'archived' ? (
            <button className="btn sm" disabled={pending} onClick={() => update('archived')}>
              Archive
            </button>
          ) : (
            <button className="btn sm" disabled={pending} onClick={() => update('read')}>
              Unarchive
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === 'new') return <span className="chip new">new</span>;
  if (status === 'archived') return <span className="chip archived">archived</span>;
  return <span className="chip read">read</span>;
}
