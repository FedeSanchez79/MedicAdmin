import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { getMedicDataDb } from '@/lib/db';
import type { Patient, MedicalRecord } from '@/types';
import PatientEditForm from './PatientEditForm';

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  let patient: Patient | null = null;
  let records: MedicalRecord[] = [];

  try {
    const db = await getMedicDataDb();

    patient = db.get(
      'SELECT id, firstName, lastName, phone, email, username, role, created_at FROM users WHERE id = ?',
      [id]
    ) as unknown as Patient | null ?? null;

    if (!patient) notFound();

    records = db.all(
      `SELECT mr.*, u.firstName || ' ' || u.lastName as professional_name
       FROM medical_records mr
       LEFT JOIN users u ON u.id = mr.professional_id
       WHERE mr.patient_id = ? ORDER BY mr.created_at DESC`,
      [id]
    ) as unknown as MedicalRecord[];
  } catch {
    return (
      <div className="bg-error-bg border border-error/20 rounded-xl p-5 text-sm text-error">
        No se pudo conectar a la base de datos de MedicData.
      </div>
    );
  }

  if (!patient) notFound();

  return (
    <div>
      <Header
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle="Editar datos del usuario — MedicData"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientEditForm patient={patient} />

        <div className="bg-white rounded-xl border border-borde">
          <div className="px-5 py-4 border-b border-borde">
            <h2 className="font-semibold text-texto">Historial médico</h2>
            <p className="text-xs text-gris mt-0.5">{records.length} registros</p>
          </div>
          {records.length === 0 ? (
            <div className="px-5 py-6 text-center text-gris text-sm">Sin registros médicos.</div>
          ) : (
            <div className="divide-y divide-borde max-h-96 overflow-y-auto">
              {records.map((r) => (
                <div key={r.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-texto truncate">{r.titulo}</p>
                      <p className="text-xs text-gris mt-0.5">{r.tipo} · {r.professional_name ?? 'Profesional desconocido'}</p>
                      {r.descripcion && (
                        <p className="text-xs text-gris-claro mt-1 line-clamp-2">{r.descripcion}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${r.activo ? 'bg-verde-bg text-verde' : 'bg-fondo text-gris'}`}>
                        {r.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-xs text-gris-claro">
                        {r.fecha_registro ?? new Date(r.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
