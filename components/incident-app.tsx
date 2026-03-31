'use client';

import Image from 'next/image';
import { FormEvent, useMemo, useState } from 'react';
import { APARTMENTS, ROOM_OPTIONS } from '@/lib/constants';
import type { IncidentPayload, PreferredContact } from '@/lib/types';
import { AppNavbar } from './app-navbar';
import { SelectField } from './select-field';

type Screen = 'welcome' | 'form' | 'confirmation' | 'admin-login' | 'admin-dashboard';

const initialState: IncidentPayload = {
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  preferredContact: 'whatsapp',
  availability: [],
  apartment: '',
  room: '',
  incident: ''
};

export function IncidentApp() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [form, setForm] = useState<IncidentPayload>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState('');

  const showIncidentDetails = useMemo(() => Boolean(form.apartment && form.room), [form]);

  const updateAvailability = (value: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      availability: checked
        ? [...new Set([...current.availability, value])]
        : current.availability.filter((item) => item !== value)
    }));
  };

  const submitIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { message?: string; reference?: string };

      if (!response.ok || !data.reference) {
        throw new Error(data.message ?? 'No fue posible procesar la incidencia.');
      }

      setReference(data.reference);
      setScreen('confirmation');
      setForm(initialState);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const loginAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await fetch('/api/incidents/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword })
    });

    if (response.ok) {
      setAdminPassword('');
      setScreen('admin-dashboard');
      return;
    }

    setFeedback('Contraseña incorrecta.');
  };

  return (
    <div className="screen-container relative pb-20 pt-20">
      <AppNavbar onAdminClick={() => setScreen('admin-login')} />

      {screen === 'welcome' && (
        <section className="px-6">
          <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-40 w-40 items-center justify-center">
              <Image
                src="https://readdy.ai/api/search-image?query=technical%20service%2C%20maintenance%2C%20repair%20tools%2C%20professional%20equipment%2C%20blue%20and%20white%20color%20scheme%2C%20minimalist%20design%2C%20isolated%20on%20white%20background%2C%20centered%20composition&width=300&height=300&seq=1&orientation=squarish"
                alt="Servicio técnico"
                width={160}
                height={160}
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Bienvenidos al servicio técnico de CH GROUP</h2>
            <p className="mb-8 text-gray-600">Estamos aquí para ayudarte con cualquier incidencia técnica en tu apartamento.</p>
            <button
              type="button"
              onClick={() => setScreen('form')}
              className="rounded-button bg-primary px-8 py-3 text-white shadow-md transition hover:bg-primary/90"
            >
              Reportar incidencia
            </button>
            <p className="mt-6 text-sm text-gray-500">Tiempo máximo de espera: 2 días</p>
          </div>
        </section>
      )}

      {screen === 'form' && (
        <section className="space-y-5 px-6">
          <header>
            <h2 className="text-xl font-semibold text-gray-800">Reportar una incidencia</h2>
            <p className="text-sm text-gray-600">Completa el formulario para que el técnico pueda contactarte.</p>
          </header>

          <form className="space-y-4" onSubmit={submitIncident}>
            <h3 className="text-sm font-medium text-gray-700">Información de contacto</h3>
            <input className="form-input" placeholder="Nombre completo" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
            <input className="form-input" type="email" placeholder="Correo electrónico" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
            <input className="form-input" placeholder="Teléfono (9 dígitos)" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Método de contacto preferido</p>
              <div className="flex gap-4 text-sm">
                {(['whatsapp', 'email'] as PreferredContact[]).map((option) => (
                  <label className="flex items-center gap-2" key={option}>
                    <input
                      type="radio"
                      name="preferred-contact"
                      checked={form.preferredContact === option}
                      onChange={() => setForm({ ...form, preferredContact: option })}
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Disponibilidad</p>
              <div className="grid grid-cols-1 gap-2">
                {['Mañana (9:00 - 14:00)', 'Tarde (16:00 - 20:00)'].map((slot) => (
                  <label key={slot} className="flex items-center gap-2 rounded-button border border-gray-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.availability.includes(slot)}
                      onChange={(e) => updateAvailability(slot, e.target.checked)}
                    />
                    {slot}
                  </label>
                ))}
              </div>
            </div>

            <SelectField
              label="Apartamento"
              value={form.apartment}
              placeholder="Seleccionar apartamento"
              options={APARTMENTS}
              onChange={(value) => setForm({ ...form, apartment: value, room: '' })}
            />

            {form.apartment && (
              <SelectField
                label="Habitación"
                value={form.room}
                placeholder="Seleccionar habitación"
                options={ROOM_OPTIONS}
                onChange={(value) => setForm({ ...form, room: value })}
              />
            )}

            {showIncidentDetails && (
              <textarea
                className="form-input min-h-32"
                placeholder="Describe la incidencia"
                value={form.incident}
                onChange={(e) => setForm({ ...form, incident: e.target.value })}
              />
            )}

            {feedback && <p className="rounded-button border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{feedback}</p>}

            <button type="submit" disabled={submitting} className="w-full rounded-button bg-primary px-4 py-3 text-white disabled:opacity-60">
              {submitting ? 'Procesando...' : 'Enviar incidencia'}
            </button>
          </form>

          <button type="button" className="w-full rounded-button border border-gray-300 bg-white px-4 py-2" onClick={() => setScreen('welcome')}>
            Volver
          </button>
        </section>
      )}

      {screen === 'confirmation' && (
        <section className="px-6">
          <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
            <h2 className="mb-4 text-xl font-semibold">¡Incidencia reportada con éxito!</h2>
            <p className="mb-2 text-sm text-gray-600">Número de referencia</p>
            <p className="mb-6 text-lg font-semibold text-primary">{reference}</p>
            <p className="mb-8 rounded-button bg-blue-50 p-4 text-sm text-gray-700">El técnico se pondrá en contacto contigo para acordar día y hora.</p>
            <div className="w-full space-y-3">
              <button type="button" className="w-full rounded-button bg-primary py-3 text-white" onClick={() => setScreen('form')}>
                Nueva incidencia
              </button>
              <button type="button" className="w-full rounded-button border border-gray-300 py-3" onClick={() => setScreen('welcome')}>
                Volver al inicio
              </button>
            </div>
          </div>
        </section>
      )}

      {screen === 'admin-login' && (
        <section className="px-6">
          <div className="flex min-h-[600px] items-center justify-center">
            <form onSubmit={loginAdmin} className="w-full max-w-sm space-y-4">
              <h2 className="text-center text-2xl font-semibold">Acceso administrador</h2>
              <input
                type="password"
                className="form-input"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Contraseña"
              />
              <button type="submit" className="w-full rounded-button bg-primary py-3 text-white">Acceder</button>
              <button type="button" onClick={() => setScreen('welcome')} className="w-full rounded-button border border-gray-300 py-2">
                Volver
              </button>
            </form>
          </div>
        </section>
      )}

      {screen === 'admin-dashboard' && (
        <section className="space-y-4 px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Panel de incidencias</h2>
            <button type="button" className="text-sm text-primary" onClick={() => setScreen('welcome')}>
              Cerrar sesión
            </button>
          </div>
          <article className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="font-medium text-gray-800">Incidencias pendientes</h3>
            <p className="mt-2 text-sm text-gray-600">La versión App Router ya está lista para conectar con base de datos real desde Prisma.</p>
          </article>
        </section>
      )}
    </div>
  );
}
