'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate, type LoginState } from './actions';

const initialState: LoginState = { success: false };

export function LoginForm() {
  const [state, formAction] = useActionState(authenticate, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.replace('/admin');
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="row" noValidate>
      <div>
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? <p className="error">{state.error}</p> : null}
      <button type="submit">Entrar</button>
    </form>
  );
}
