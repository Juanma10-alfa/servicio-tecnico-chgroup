'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export type LoginState = {
  success: boolean;
  error?: string;
};

export async function authenticate(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: 'No se pudo iniciar sesión. Verifica tus credenciales.',
      };
    }

    return {
      success: false,
      error: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
    };
  }
}
