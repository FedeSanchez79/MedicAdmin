import { getAdminDb } from '@/lib/db';
import Header from '@/components/Header';

function getStats() {
  try {
    const db = getAdminDb();
    const totalAudit = (db.prepare('SELECT COUNT(*) as c FROM audit_log').get() as { c: number }).c;
    const lastEntries = db.prepare(`
      SELECT admin_username, proyecto, accion, tabla, created_at
      FROM audit_log ORDER BY created_at DESC LIMIT 5
    `).all() as { admin_username: string; proyecto: string; accion: string; tabla: string; created_at: string }[];
    return { totalAudit, lastEntries };
  } catch {
    return { totalAudit: 0, lastEntries: [] };
  }
}

const projectColors: Record<string, string> = {
  medicdata: 'bg-azul-suave text-azul',
  medicprofessionals: 'bg-verde-bg text-verde',
};

const accionColors: Record<string, string> = {
  MODIFICAR: 'bg-warning-bg text-warning',
  CREAR: 'bg-verde-bg text-verde',
  ELIMINAR: 'bg-error-bg text-error',
};

export default function DashboardPage() {
  const { totalAudit, lastEntries } = getStats();

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
  ];

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Resumen general del sistema"
      />

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
