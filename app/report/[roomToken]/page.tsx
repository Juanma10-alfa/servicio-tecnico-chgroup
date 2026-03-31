import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { getPublicRoomContext } from './_lib/public-link';

type ReportPageProps = {
  params: Promise<{ roomToken: string }>;
};

async function submitIncident(formData: FormData) {
  'use server';

  const roomToken = String(formData.get('roomToken') ?? '');
  const issueType = String(formData.get('issueType') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!roomToken || !issueType || !description) {
    redirect(`/report/${roomToken}`);
  }

  const reference = `CH-${randomUUID().slice(0, 8).toUpperCase()}`;
  redirect(`/report/${roomToken}/success?ref=${reference}`);
}

function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-red-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-red-800">{body}</p>
      </section>
    </main>
  );
}

export default async function RoomReportPage({ params }: ReportPageProps) {
  const { roomToken } = await params;
  const context = await getPublicRoomContext(roomToken);

  if (context.status === 'invalid') {
    return (
      <ErrorState
        title="Enlace no válido"
        body={context.message ?? 'El enlace no existe o no está disponible.'}
      />
    );
  }

  if (context.status === 'inactive') {
    return (
      <ErrorState
        title="Enlace desactivado"
        body={context.message ?? 'Este enlace está desactivado temporalmente.'}
      />
    );
  }

  if (context.status === 'expired') {
    return (
      <ErrorState
        title="Enlace caducado"
        body={context.message ?? 'Este enlace ya no está disponible.'}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Reportar incidencia</h1>
        <p className="mt-2 text-sm text-slate-600">Indica qué ha ocurrido y el equipo lo revisará.</p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">Apartamento:</span>{' '}
            {context.apartmentName ?? context.apartmentCode ?? 'No disponible'}
          </p>
          <p className="mt-1">
            <span className="font-medium text-slate-900">Habitación:</span>{' '}
            {context.roomName ?? context.roomCode ?? 'No disponible'}
          </p>
        </div>

        <form action={submitIncident} className="mt-6 space-y-4">
          <input name="roomToken" type="hidden" value={roomToken} />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="issueType">
              Tipo de incidencia
            </label>
            <select
              required
              id="issueType"
              name="issueType"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              <option value="electricidad">Electricidad</option>
              <option value="fontaneria">Fontanería</option>
              <option value="limpieza">Limpieza</option>
              <option value="climatizacion">Climatización</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="description">
              Descripción
            </label>
            <textarea
              required
              id="description"
              name="description"
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Describe brevemente la incidencia"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Enviar incidencia
          </button>
        </form>
      </section>
    </main>
  );
}
