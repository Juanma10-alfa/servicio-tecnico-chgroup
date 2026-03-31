type SuccessPageProps = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function PublicReportSuccessPage({ searchParams }: SuccessPageProps) {
  const { ref } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-emerald-900">Incidencia enviada</h1>
        <p className="mt-2 text-sm text-emerald-800">
          Gracias. Hemos recibido tu incidencia y nuestro equipo la revisará lo antes posible.
        </p>

        <div className="mt-5 rounded-xl bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Código de referencia</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{ref ?? 'Pendiente de asignación'}</p>
        </div>
      </section>
    </main>
  );
}
