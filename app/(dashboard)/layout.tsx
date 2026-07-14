import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { getOpenReportCount } from './moderation/data';

/**
 * Protected shell for every admin module. `requireAdmin()` runs on the server
 * for each request and redirects non-admins to /login before any child renders.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  // Best-effort badge — never let a missing reports table break the shell.
  const openReports = await getOpenReportCount().catch(() => 0);

  return (
    <div className="app-shell">
      <Sidebar admin={{ username: admin.username, email: admin.email }} openReports={openReports} />
      <main className="content">{children}</main>
    </div>
  );
}
