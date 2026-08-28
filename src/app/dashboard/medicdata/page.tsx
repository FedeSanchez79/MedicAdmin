import Header from '@/components/Header';
import { getMedicDataDb } from '@/lib/db';
import type { Patient } from '@/types';
import PatientsTable from './PatientsTable';

export const dynamic = 'force-dynamic';

export default async function MedicDataPage() {
  let patients: Patient[] = [];
  let dbError = '';

  try {
    const db = await getMedicDataDb();
    patients = await db.all(
      'SELECT id, firstName, lastName, phone, email, username, role, created_at, banned_at, banned_by, ban_reason FROM users ORDER BY created_at DESC'
    ) as unknown as Patient[];
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div>
      <Header
        title="MedicData — Pacientes"
        subtitle={`${patients.length} usuarios registrados`}
      />

      {dbError ? (
        <div className="bg-error-bg border border-error/20 rounded-xl p-5 text-sm text-error">
          <strong>No se pudo conectar a la base de datos de MedicData.</strong>
          <p className="mt-1 text-gris">{dbError}</p>
          <p className="mt-2">Verificá que <code className="bg-white px-1 rounded">MEDICDATA_DB_PATH</code> esté configurado correctamente en tu archivo <code className="bg-white px-1 rounded">.env.local</code>.</p>
        </div>
      ) : (
        <PatientsTable patients={patients} />
      )}
    </div>
  );
}
