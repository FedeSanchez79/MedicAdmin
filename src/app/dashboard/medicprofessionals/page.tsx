import Link from 'next/link';
import Header from '@/components/Header';
import { getMedicProfessionalsDb } from '@/lib/db';
import type { Professional } from '@/types';

export default async function MedicProfessionalsPage() {
  let professionals: Professional[] = [];
  let dbError = '';

  try {
    const db = await getMedicProfessionalsDb();
    professionals = db.all(
      `SELECT u.id, u.firstName, u.lastName, u.phone, u.email, u.username, u.role, u.created_at,
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
        <div className="bg-white rounded-xl border border-borde overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde bg-fondo">
                <th className="px-4 py-3 text-left font-semibold text-gris">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Rol</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Especialidad</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Matrícula</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Registro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gris">No hay usuarios registrados.</td>
                </tr>
              ) : (
                professionals.map((p) => (
                  <tr key={p.id} className="hover:bg-fondo transition">
                    <td className="px-4 py-3 font-medium text-texto">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-gris">{p.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${p.role === 'professional' ? 'bg-verde-bg text-verde' : 'bg-azul-suave text-azul'}`}>
                        {p.role === 'professional' ? 'Profesional' : 'Paciente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gris">{p.especialidad ?? '—'}</td>
                    <td className="px-4 py-3 text-gris">{p.matricula ?? '—'}</td>
                    <td className="px-4 py-3 text-gris-claro text-xs">
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/medicprofessionals/${p.id}`} className="text-azul hover:text-azul-hover text-xs font-semibold">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
