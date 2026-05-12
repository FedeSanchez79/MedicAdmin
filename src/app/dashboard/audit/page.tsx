import Header from '@/components/Header';
import { getAdminDb } from '@/lib/db';
import type { AuditEntry } from '@/types';

function getAuditLog(): AuditEntry[] {
  const db = getAdminDb();
  return db.prepare(`
    SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500
  `).all() as AuditEntry[];
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

export default function AuditPage() {
  let entries: AuditEntry[] = [];
  try {
    entries = getAuditLog();
  } catch {
    entries = [];
  }

  return (
    <div>
      <Header
        title="Registro de Auditoría"
        subtitle={`${entries.length} entradas · Solo lectura — inmutable`}
      />

      <div className="bg-warning-bg border border-warning/20 rounded-xl px-5 py-3 mb-5 flex items-center gap-3">
        <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm text-warning">
          Este registro es <strong>inmutable</strong>. Cada modificación realizada por el administrador queda registrada aquí y no puede ser editada ni eliminada.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-borde overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde bg-fondo">
              <th className="px-4 py-3 text-left font-semibold text-gris">#</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Admin</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Proyecto</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Acción</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Tabla</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Registro ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Datos anteriores</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Datos nuevos</th>
              <th className="px-4 py-3 text-left font-semibold text-gris">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gris">
                  No hay registros de auditoría.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="hover:bg-fondo transition align-top">
                  <td className="px-4 py-3 text-gris-claro text-xs">{e.id}</td>
                  <td className="px-4 py-3 font-medium text-texto">{e.admin_username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${projectColors[e.proyecto] ?? 'bg-fondo text-gris'}`}>
                      {e.proyecto}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accionColors[e.accion] ?? 'bg-fondo text-gris'}`}>
                      {e.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gris">{e.tabla}</td>
                  <td className="px-4 py-3 text-gris-claro text-xs">{e.registro_id ?? '—'}</td>
                  <td className="px-4 py-3 max-w-xs">
                    {e.datos_anteriores ? (
                      <pre className="text-xs text-gris bg-fondo rounded p-1 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(JSON.parse(e.datos_anteriores), null, 2)}
                      </pre>
                    ) : <span className="text-gris-claro">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {e.datos_nuevos ? (
                      <pre className="text-xs text-verde bg-verde-bg rounded p-1 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(JSON.parse(e.datos_nuevos), null, 2)}
                      </pre>
                    ) : <span className="text-gris-claro">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gris-claro text-xs whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
