'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/types';

export default function PatientEditForm({ patient }: { patient: Patient }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    const form = e.currentTarget;
    const body = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      username: (form.elements.namedItem('username') as HTMLInputElement).value,
    };

    try {
      const res = await fetch(`/api/medicdata/patients/${patient.id}`, {
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

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/medicdata/patients/${patient.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      router.push('/dashboard/medicdata');
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Error al eliminar');
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-borde">
      <div className="px-5 py-4 border-b border-borde">
        <h2 className="font-semibold text-texto">Datos del usuario</h2>
        <p className="text-xs text-gris mt-0.5">ID #{patient.id} · {patient.role}</p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" name="firstName" defaultValue={patient.firstName} />
          <Field label="Apellido" name="lastName" defaultValue={patient.lastName} />
        </div>
        <Field label="Email" name="email" type="email" defaultValue={patient.email} />
        <Field label="Teléfono" name="phone" defaultValue={patient.phone ?? ''} />
        <Field label="Usuario" name="username" defaultValue={patient.username} />

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

      <div className="px-5 pb-5 flex flex-col gap-2">
        <hr className="border-borde mb-1" />
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="w-full py-2.5 border border-error text-error bg-white hover:bg-error-bg
                     font-semibold rounded-lg text-sm transition"
        >
          Eliminar usuario
        </button>
        {deleteError && (
          <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2">{deleteError}</p>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-borde p-6 max-w-sm w-full mx-4 shadow-lg">
            <h3 className="font-semibold text-texto text-base mb-2">¿Eliminar usuario?</h3>
            <p className="text-sm text-gris mb-5">
              Esta acción no se puede deshacer. El usuario y todos sus datos serán eliminados permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-borde text-texto font-semibold rounded-lg
                           text-sm hover:bg-fondo transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-error hover:bg-red-700 text-white font-semibold rounded-lg
                           text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
