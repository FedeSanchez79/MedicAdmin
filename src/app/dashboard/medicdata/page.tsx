import Link from 'next/link';
import Header from '@/components/Header';
import { getMedicDataDb } from '@/lib/db';
import type { Patient } from '@/types';

function getPatients(): Patient[] {
  try {
    const db = getMedicDataDb();
    return db.prepare(`
      SELECT id, firstName, lastName, phone, email, username, role, created_at
      FROM users ORDER BY created_at DESC
    `).all() as Patient[];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(msg);
  }
}

export default function MedicDataPage() {
  let patients: Patient[] = [];
  let dbError = '';

  try {
    patients = getPatients();
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
        <div className="bg-white rounded-xl border border-borde overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde bg-fondo">
                <th className="px-4 py-3 text-left font-semibold text-gris">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Teléfono</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Rol</th>
                <th className="px-4 py-3 text-left font-semibold text-gris">Registro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gris">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-fondo transition">
                    <td className="px-4 py-3 font-medium text-texto">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3 text-gris">{p.email}</td>
                    <td className="px-4 py-3 text-gris">{p.username}</td>
                    <td className="px-4 py-3 text-gris">{p.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-azul-suave text-azul">
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gris-claro text-xs">
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/medicdata/${p.id}`}
                        className="text-azul hover:text-azul-hover text-xs font-semibold"
                      >
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
