'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Professional } from '@/types';

export default function ProfessionalEditForm({ professional }: { professional: Professional }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [showBanPrompt, setShowBanPrompt] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

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

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/medicprofessionals/users/${professional.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      router.push('/dashboard/medicprofessionals');
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Error al eliminar');
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  async function handleVerification(action: 'approve' | 'reject') {
    setVerifyLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/medicprofessionals/users/${professional.id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'}`);
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleBan() {
    setBanLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/medicprofessionals/users/${professional.id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al banear');
      setShowBanPrompt(false);
      setBanReason('');
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al banear');
    } finally {
      setBanLoading(false);
    }
  }

  async function handleUnban() {
    setBanLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/medicprofessionals/users/${professional.id}/unban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reactivar');
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al reactivar');
    } finally {
      setBanLoading(false);
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

      {professional.verification_status === 'pendiente' && (
        <div className="px-5 py-4 bg-azul-suave border-b border-borde">
          <p className="text-sm font-semibold text-azul mb-3">Alta pendiente de aprobación</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleVerification('approve')}
              disabled={verifyLoading}
              className="flex-1 py-2.5 bg-verde hover:bg-green-700 text-white font-semibold rounded-lg
                         text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifyLoading ? 'Procesando...' : 'Aprobar'}
            </button>
            <button
              type="button"
              onClick={() => handleVerification('reject')}
              disabled={verifyLoading}
              className="flex-1 py-2.5 bg-error hover:bg-red-700 text-white font-semibold rounded-lg
                         text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifyLoading ? 'Procesando...' : 'Rechazar'}
            </button>
          </div>
        </div>
      )}

      {professional.verification_status && professional.verification_status !== 'pendiente' && (
        <div className="px-5 py-3 border-b border-borde">
          <span className="text-xs text-gris">Estado de verificación: </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${professional.verification_status === 'aprobado' ? 'bg-verde-bg text-verde' : 'bg-error-bg text-error'}`}>
            {professional.verification_status === 'aprobado' ? 'Aprobado' : 'Rechazado'}
          </span>
        </div>
      )}

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

      <div className="px-5 pb-5 flex flex-col gap-2">
        <hr className="border-borde mb-1" />

        {professional.banned_at ? (
          <div className="bg-warning-bg border border-warning/20 rounded-lg p-4 mb-2">
            <p className="text-sm font-semibold text-warning">Usuario baneado</p>
            <p className="text-xs text-gris mt-1">
              Fecha: {new Date(professional.banned_at).toLocaleString('es-AR')}
            </p>
            {professional.ban_reason && (
              <p className="text-xs text-gris mt-0.5">Motivo: {professional.ban_reason}</p>
            )}
            <button
              type="button"
              onClick={handleUnban}
              disabled={banLoading}
              className="mt-3 w-full py-2.5 border border-verde text-verde bg-white hover:bg-verde-bg
                         font-semibold rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {banLoading ? 'Reactivando...' : 'Reactivar usuario'}
            </button>
          </div>
        ) : (
          <>
            {showBanPrompt ? (
              <div className="bg-warning-bg border border-warning/20 rounded-lg p-4 mb-2">
                <p className="text-sm font-semibold text-warning mb-2">Banear usuario</p>
                <input
                  type="text"
                  placeholder="Motivo del ban (opcional)"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-borde bg-white text-texto text-sm
                             focus:outline-none focus:ring-2 focus:ring-warning focus:border-transparent transition mb-3"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowBanPrompt(false); setBanReason(''); }}
                    disabled={banLoading}
                    className="flex-1 py-2.5 border border-borde text-texto font-semibold rounded-lg
                               text-sm hover:bg-fondo transition disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleBan}
                    disabled={banLoading}
                    className="flex-1 py-2.5 bg-warning hover:bg-yellow-700 text-white font-semibold rounded-lg
                               text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {banLoading ? 'Baneando...' : 'Confirmar ban'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBanPrompt(true)}
                className="w-full py-2.5 border border-warning text-warning bg-white hover:bg-warning-bg
                           font-semibold rounded-lg text-sm transition"
              >
                Banear usuario
              </button>
            )}
          </>
        )}

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
