'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '../login/actions';

type Item = { href: string; label: string; icon: string; badge?: number };
type Group = { label: string; items: Item[] };

/**
 * Nav is grouped by the module roadmap. Modules not yet built are rendered as
 * disabled "soon" rows so the full surface is visible from day one.
 */
const GROUPS: Group[] = [
  {
    label: 'Overview',
    items: [{ href: '/', label: 'Dashboard', icon: '◵' }],
  },
  {
    label: 'People',
    items: [
      { href: '/users', label: 'Users', icon: '⌘' },
      { href: '/contact', label: 'Contact inbox', icon: '✉' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/moderation', label: 'Moderation', icon: '⚑' },
      { href: '/clips', label: 'Clips', icon: '✂' },
      { href: '/reviews', label: 'Reviews', icon: '★' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/books', label: 'Books', icon: '▤' },
      { href: '/films', label: 'Films', icon: '▦' },
      { href: '/authors', label: 'Authors', icon: '✎' },
      { href: '/publishers', label: 'Publishers', icon: '⌂' },
    ],
  },
  {
    label: 'Community',
    items: [{ href: '/clubs', label: 'Clubs', icon: '◍' }],
  },
  {
    label: 'Money',
    items: [
      { href: '/subscriptions', label: 'Subscriptions', icon: '✦' },
      { href: '/payouts', label: 'Payouts', icon: '➦' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { href: '/music', label: 'Music library', icon: '♪' },
      { href: '/gamification', label: 'Gamification', icon: '★' },
      { href: '/push', label: 'Push', icon: '◈' },
      { href: '/config', label: 'Limits & config', icon: '⚙' },
    ],
  },
];

// All modules are built — nothing pending.
const SOON: Group[] = [];

export function Sidebar({
  admin,
  openReports = 0,
}: {
  admin: { username: string; email: string | null };
  openReports?: number;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const badgeFor = (href: string) => (href === '/moderation' && openReports > 0 ? openReports : undefined);

  return (
    <aside className="sidebar">
      <div className="brand">Soopien</div>

      {GROUPS.map((group) => (
        <div key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive(item.href) ? ' active' : ''}`}
            >
              <span className="ico">{item.icon}</span>
              {item.label}
              {badgeFor(item.href) ? <span className="nav-badge">{badgeFor(item.href)}</span> : null}
            </Link>
          ))}
        </div>
      ))}

      {SOON.map((group) => (
        <div key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.items.map((item) => (
            <div
              key={item.href}
              className="nav-item"
              style={{ opacity: 0.42, cursor: 'default' }}
              title="Coming in a later phase"
            >
              <span className="ico">{item.icon}</span>
              {item.label}
              <span className="nav-badge" style={{ background: 'var(--faint)', color: '#fff' }}>
                soon
              </span>
            </div>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div style={{ color: 'var(--text2)', fontWeight: 600 }}>@{admin.username}</div>
        <div style={{ marginBottom: 10, wordBreak: 'break-all' }}>{admin.email}</div>
        <form action={signOut}>
          <button type="submit" className="btn sm" style={{ width: '100%', justifyContent: 'center' }}>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
