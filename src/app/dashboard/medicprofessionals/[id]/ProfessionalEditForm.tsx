'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Professional } from '@/types';

export default function ProfessionalEditForm({ professional }: { professional: Professional }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    const form = e.currentTarget;
    const getValue = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;

    const body = {
      firstName: getValue('firstName'),
      lastName: getValue('lastName'),
      email: getValue('email'),
      phone: getValue('phone'),
      username: getValue('username'),
      especialidad: getValue('especialidad'),
      matricula: getValue('matricula'),
      institucion: getValue('institucion'),
    };

    try {
      const res = await fetch(`/api/medicprofessionals/users/${professional.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      setSuccess('Datos actualizados correctamente.');
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  const isProfessional = professional.role === 'professional';

  return (
    <div className="bg-white rounded-xl border border-borde">
      <div className="px-5 py-4 border-b border-borde flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-texto">Datos del usuario</h2>
          <p className="text-xs text-gris mt-0.5">ID #{professional.id}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
          ${isProfessional ? 'bg-verde-bg text-verde' : 'bg-azul-suave text-azul'}`}>
          {isProfessional ? 'Profesional' : 'Paciente'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" name="firstName" defaultValue={professional.firstName} />
          <Field label="Apellido" name="lastName" defaultValue={professional.lastName} />
        </div>
        <Field label="Email" name="email" type="email" defaultValue={professional.email} />
        <Field label="Teléfono" name="phone" defaultValue={professional.phone ?? ''} />
        <Field label="Usuario" name="username" defaultValue={professional.username} />

        {isProfessional && (
          <>
            <hr className="border-borde" />
            <p className="text-xs font-semibold text-gris uppercase tracking-wide">Perfil profesional</p>
            <Field label="Especialidad" name="especialidad" defaultValue={professional.especialidad ?? ''} />
            <Field label="Matrícula" name="matricula" defaultValue={professional.matricula ?? ''} />
            <Field label="Institución" name="institucion" defaultValue={professional.institucion ?? ''} />
          </>
        )}

        {!isProfessional && (
          <>
            <input type="hidden" name="especialidad" value="" />
            <input type="hidden" name="matricula" value="" />
            <input type="hidden" name="institucion" value="" />
          </>
        )}

        {success && (
          <p className="text-sm text-verde bg-verde-bg rounded-lg px-3 py-2">{success}</p>
        )}
        {error && (
          <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-azul hover:bg-azul-hover text-white font-semibold rounded-lg
                     text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, type = 'text' }: {
  label: string; name: string; defaultValue: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-texto">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 rounded-lg border border-borde bg-white text-texto text-sm
                   focus:outline-none focus:ring-2 focus:ring-azul focus:border-transparent transition"
      />
    </div>
  );
}
