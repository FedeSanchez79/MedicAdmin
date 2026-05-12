import { getAdminDb } from './db';

interface AuditParams {
  adminId: number;
  adminUsername: string;
  proyecto: 'medicdata' | 'medicprofessionals';
  accion: 'CREAR' | 'MODIFICAR' | 'ELIMINAR';
  tabla: string;
  registroId: string | number;
  datosAnteriores?: Record<string, unknown>;
  datosNuevos?: Record<string, unknown>;
  ipAddress?: string;
}

export function registrarAuditoria(params: AuditParams): void {
  const db = getAdminDb();
  const stmt = db.prepare(`
    INSERT INTO audit_log
      (admin_id, admin_username, proyecto, accion, tabla, registro_id, datos_anteriores, datos_nuevos, ip_address)
    VALUES
      (@adminId, @adminUsername, @proyecto, @accion, @tabla, @registroId, @datosAnteriores, @datosNuevos, @ipAddress)
  `);

  stmt.run({
    adminId: params.adminId,
    adminUsername: params.adminUsername,
    proyecto: params.proyecto,
    accion: params.accion,
    tabla: params.tabla,
    registroId: String(params.registroId),
    datosAnteriores: params.datosAnteriores ? JSON.stringify(params.datosAnteriores) : null,
    datosNuevos: params.datosNuevos ? JSON.stringify(params.datosNuevos) : null,
    ipAddress: params.ipAddress ?? null,
  });
}
