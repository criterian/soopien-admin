import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ContactRow, type ContactMessage } from './ContactRow';

export const metadata = { title: 'Contact inbox · Soopien Admin' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'new', label: 'New' },
  { key: 'read', label: 'Read' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
] as const;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = FILTERS.some((f) => f.key === statusParam) ? statusParam! : 'new';

  let query = supabaseAdmin
    .from('contact_messages')
    .select('id, name, email, topic, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  const messages = (data ?? []) as ContactMessage[];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Contact inbox</h1>
          <div className="sub">Submissions from the marketing site contact form</div>
        </div>
      </div>

      <div className="toolbar">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'new' ? '/contact' : `/contact?status=${f.key}`}
            className={`btn sm${status === f.key ? ' primary' : ''}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error ? <div className="error-banner">{error.message}</div> : null}

      {messages.length === 0 ? (
        <div className="card">
          <div className="empty">No {status === 'all' ? '' : status} messages.</div>
        </div>
      ) : (
        messages.map((m) => <ContactRow key={m.id} m={m} />)
      )}
    </div>
  );
}
