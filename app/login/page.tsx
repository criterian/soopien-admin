import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign in · Soopien Admin' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const notice = error === 'not_admin' ? 'This account does not have admin access.' : undefined;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 34,
              color: 'var(--terracotta)',
              letterSpacing: '-0.01em',
            }}
          >
            Soopien
          </div>
          <div style={{ color: 'var(--text3)', fontSize: 13.5, marginTop: 2 }}>
            Platform administration
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <LoginForm notice={notice} />
        </div>

        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 18 }}>
          Restricted access. Admin accounts only.
        </p>
      </div>
    </main>
  );
}
