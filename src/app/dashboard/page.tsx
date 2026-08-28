import Link from 'next/link';
import { getAdminDb, getMedicDataDb, getMedicProfessionalsDb } from '@/lib/db';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

const projectColors: Record<string, string> = {
  medicdata: 'bg-azul-suave text-azul',
  medicprofessionals: 'bg-verde-bg text-verde',
};

const accionColors: Record<string, string> = {
  MODIFICAR: 'bg-warning-bg text-warning',
  CREAR: 'bg-verde-bg text-verde',
  ELIMINAR: 'bg-error-bg text-error',
};

interface PendingProfessional {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  matricula: string | null;
  created_at: string;
}

export default async function DashboardPage() {
  let totalAudit = 0;
  let lastEntries: { admin_username: string; proyecto: string; accion: string; tabla: string; created_at: string }[] = [];
  let totalPatients = 0;
  let totalProfessionals = 0;
  let pendingProfessionals: PendingProfessional[] = [];

  try {
    const db = await getAdminDb();
    const row = await db.get('SELECT COUNT(*) as c FROM audit_log');
    totalAudit = row ? Number(row.c) : 0;
    lastEntries = await db.all(
      'SELECT admin_username, proyecto, accion, tabla, created_at FROM audit_log ORDER BY created_at DESC LIMIT 5'
    ) as typeof lastEntries;
  } catch {
    // DB not yet initialized
  }

  try {
    const medicDataDb = await getMedicDataDb();
    const row = await medicDataDb.get("SELECT COUNT(*) as c FROM users WHERE role = 'patient'");
    totalPatients = row ? Number(row.c) : 0;
  } catch {
    // DB not configured or unavailable
  }

  try {
    const profDb = await getMedicProfessionalsDb();
    const row = await profDb.get("SELECT COUNT(*) as c FROM users WHERE role = 'professional'");
    totalProfessionals = row ? Number(row.c) : 0;

    pendingProfessionals = await profDb.all(
      `SELECT u.id, u.first_name as firstName, u.last_name as lastName, u.email, u.created_at,
              pp.matricula
       FROM users u
       LEFT JOIN professional_profiles pp ON pp.user_id = u.id
       WHERE u.verification_status = 'pendiente'
       ORDER BY u.created_at DESC`
    ) as unknown as PendingProfessional[];
  } catch {
    // DB not configured or unavailable
  }

  const statCards = [
    {
      label: 'Registros de auditoría',
      value: totalAudit,
      icon: (
        <svg className="w-6 h-6 text-azul" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      bg: 'bg-azul-suave',
    },
    {
      label: 'Proyectos administrados',
      value: 2,
      icon: (
        <svg className="w-6 h-6 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      bg: 'bg-verde-bg',
    },
    {
      label: 'Pacientes registrados',
      value: totalPatients,
      icon: (
        <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bg: 'bg-warning-bg',
    },
    {
      label: 'Profesionales registrados',
      value: totalProfessionals,
      icon: (
        <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      bg: 'bg-error-bg',
    },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Resumen general del sistema" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-borde p-5 flex items-center gap-4">
            <div className={`${card.bg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-texto">{card.value}</p>
              <p className="text-sm text-gris">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {pendingProfessionals.length > 0 && (
        <div className="bg-white rounded-xl border border-warning/30 mb-8">
          <div className="px-5 py-4 border-b border-warning/20 bg-warning-bg rounded-t-xl">
            <h2 className="font-semibold text-warning">
              Profesionales pendientes de aprobación ({pendingProfessionals.length})
            </h2>
          </div>
          <div className="divide-y divide-borde">
            {pendingProfessionals.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-texto">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-gris">{p.email}{p.matricula ? ` · Mat. ${p.matricula}` : ''}</p>
                </div>
                <span className="text-xs text-gris-claro">
                  {new Date(p.created_at).toLocaleDateString('es-AR')}
                </span>
                <Link
                  href={`/dashboard/medicprofessionals/${p.id}`}
                  className="text-azul hover:text-azul-hover text-xs font-semibold"
                >
                  Revisar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-borde">
        <div className="px-5 py-4 border-b border-borde">
          <h2 className="font-semibold text-texto">Últimas acciones de auditoría</h2>
        </div>
        {lastEntries.length === 0 ? (
          <div className="px-5 py-8 text-center text-gris text-sm">
            No hay registros de auditoría aún.
          </div>
        ) : (
          <div className="divide-y divide-borde">
            {lastEntries.map((entry, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${projectColors[entry.proyecto] ?? 'bg-fondo text-gris'}`}>
                  {entry.proyecto}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accionColors[entry.accion] ?? 'bg-fondo text-gris'}`}>
                  {entry.accion}
                </span>
                <span className="text-sm text-texto flex-1">{entry.tabla}</span>
                <span className="text-xs text-gris-claro">{new Date(entry.created_at).toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
