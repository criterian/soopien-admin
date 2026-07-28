'use client';

import { useState, useTransition } from 'react';
import { sendEmail } from './actions';
import type { EmailCategory, EmailSegment, EmailSendReport } from './types';

const SEGMENTS: { key: EmailSegment; label: string }[] = [
  { key: 'all', label: 'All users' },
  { key: 'premium', label: 'Premium only' },
  { key: 'freemium', label: 'Freemium only' },
];

const CATEGORIES: { key: EmailCategory; label: string; note: string }[] = [
  {
    key: 'product_news',
    label: 'Product news (marketing)',
    note: 'Only reaches users who opted in. One-click unsubscribe is attached.',
  },
  {
    key: 'transactional',
    label: 'Transactional (operational)',
    note: 'Reaches everyone except bounced/complained addresses. No unsubscribe — use only for account/service notices.',
  },
];

/**
 * Announcement composer. On the Emails page it targets a segment; embedded on a
 * user page (with `userId` + `userLabel`) it sends to that one person. Consent and
 * suppression are enforced server-side, so the report may show skips.
 */
export function ComposeForm({ userId, userLabel }: { userId?: string; userLabel?: string }) {
  const [pending, start] = useTransition();
  const [segment, setSegment] = useState<EmailSegment>('all');
  const [category, setCategory] = useState<EmailCategory>('product_news');
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EmailSendReport | null>(null);

  const targetLabel = userId
    ? userLabel ?? 'this user'
    : SEGMENTS.find((s) => s.key === segment)?.label;

  const send = () => {
    setError(null);
    setReport(null);
    if (!window.confirm(`Send this ${category === 'product_news' ? 'announcement' : 'notice'} to ${targetLabel}?`)) {
      return;
    }
    start(async () => {
      const res = await sendEmail({
        userId,
        segment: userId ? undefined : segment,
        category,
        subject,
        heading,
        body,
        cta: ctaLabel.trim() && ctaUrl.trim() ? { label: ctaLabel, url: ctaUrl } : undefined,
      });
      if ('error' in res) setError(res.error);
      else {
        setReport(res.report);
        setSubject('');
        setHeading('');
        setBody('');
        setCtaLabel('');
        setCtaUrl('');
      }
    });
  };

  const catNote = CATEGORIES.find((c) => c.key === category)?.note;

  return (
    <div className="card" style={{ padding: 20, maxWidth: 620 }}>
      <h2 style={{ fontSize: 16, marginBottom: 14 }}>{userId ? 'Send an email' : 'New announcement'}</h2>
      {error ? <div className="error-banner">{error}</div> : null}
      {report != null ? (
        <div
          className="error-banner"
          style={{ background: 'rgba(46,125,82,0.1)', borderColor: 'rgba(46,125,82,0.35)', color: '#1f6b43' }}
        >
          ✓ Sent {report.sent}/{report.recipients}.{' '}
          {report.failed ? `${report.failed} failed. ` : ''}
          {report.skippedNotOptedIn ? `${report.skippedNotOptedIn} not opted in. ` : ''}
          {report.skippedSuppressed ? `${report.skippedSuppressed} suppressed. ` : ''}
          {report.skippedNoEmail ? `${report.skippedNoEmail} without email.` : ''}
        </div>
      ) : null}

      {!userId ? (
        <div className="field">
          <label>Segment</label>
          <select value={segment} onChange={(e) => setSegment(e.target.value as EmailSegment)}>
            {SEGMENTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <label>Type</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as EmailCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        {catNote ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{catNote}</div> : null}
      </div>

      <div className="field">
        <label>Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} placeholder="Email subject line" />
      </div>
      <div className="field">
        <label>Heading</label>
        <input value={heading} onChange={(e) => setHeading(e.target.value)} maxLength={140} placeholder="Big heading inside the email" />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          placeholder={'Write the email body.\n\nLeave a blank line between paragraphs.'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Button label (optional)</label>
          <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={40} placeholder="Open Soopien" />
        </div>
        <div className="field">
          <label>Button URL (optional)</label>
          <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://soopien.com/…" />
        </div>
      </div>

      <button
        className="btn primary"
        disabled={pending || !subject.trim() || !heading.trim() || !body.trim()}
        onClick={send}
      >
        {pending ? 'Sending…' : userId ? 'Send email' : 'Send announcement'}
      </button>
    </div>
  );
}
