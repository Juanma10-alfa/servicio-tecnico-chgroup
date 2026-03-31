import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export default async function AdminLoginPage() {
  const session = await auth();

  if (session?.user?.role === 'admin') {
    redirect('/admin');
  }

  return (
    <main>
      <h1>Acceso administrador</h1>
      <p className="muted">Introduce tus credenciales para continuar.</p>
      <LoginForm />
    </main>
  );
}
