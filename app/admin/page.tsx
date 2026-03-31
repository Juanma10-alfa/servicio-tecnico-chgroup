import { auth } from '@/auth';
import { logoutAdmin } from './actions';

export default async function AdminPage() {
  const session = await auth();

  return (
    <main>
      <h1>Panel de administración</h1>
      <p className="muted">Sesión iniciada: {session?.user.email}</p>
      <form action={logoutAdmin}>
        <button type="submit">Cerrar sesión</button>
      </form>
    </main>
  );
}
