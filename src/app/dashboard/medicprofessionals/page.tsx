import Header from '@/components/Header';
import { getMedicProfessionalsDb } from '@/lib/db';
import type { Professional } from '@/types';
import ProfessionalsTable from './ProfessionalsTable';

export default async function MedicProfessionalsPage() {
  let professionals: Professional[] = [];
  let dbError = '';

  try {
    const db = await getMedicProfessionalsDb();
    professionals = db.all(
      `SELECT u.id, u.first_name as firstName, u.last_name as lastName, u.phone, u.email,
              u.username, u.role, u.created_at, u.verification_status,
              u.banned_at, u.banned_by, u.ban_reason,
              pp.especialidad, pp.matricula, pp.institucion
       FROM users u
       LEFT JOIN professional_profiles pp ON pp.user_id = u.id
       ORDER BY u.created_at DESC`
    ) as unknown as Professional[];
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const patients = professionals.filter((p) => p.role === 'patient');
  const profs = professionals.filter((p) => p.role === 'professional');

  return (
    <div>
      <Header
        title="MedicProfessionals — Usuarios"
        subtitle={`${profs.length} profesionales · ${patients.length} pacientes`}
      />

      {dbError ? (
        <div className="bg-error-bg border border-error/20 rounded-xl p-5 text-sm text-error">
          <strong>No se pudo conectar a MedicProfessionals.</strong>
          <p className="mt-1 text-gris">{dbError}</p>
          <p className="mt-2">Verificá <code className="bg-white px-1 rounded">MEDICPROFESSIONALS_DB_PATH</code> en <code className="bg-white px-1 rounded">.env.local</code>.</p>
        </div>
      ) : (
        <ProfessionalsTable professionals={professionals} />
      )}
    </div>
  );
}
