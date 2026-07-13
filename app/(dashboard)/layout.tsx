import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

/**
 * Protected shell for every admin module. `requireAdmin()` runs on the server
 * for each request and redirects non-admins to /login before any child renders.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="app-shell">
      <Sidebar admin={{ username: admin.username, email: admin.email }} />
      <main className="content">{children}</main>
    </div>
  );
}
