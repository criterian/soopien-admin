'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [error, formAction] = useActionState(signIn, notice);

  return (
    <form action={formAction}>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton />
    </form>
  );
}
