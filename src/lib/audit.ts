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

export async function registrarAuditoria(params: AuditParams): Promise<void> {
  const db = await getAdminDb();
  db.run(
    `INSERT INTO audit_log
      (admin_id, admin_username, proyecto, accion, tabla, registro_id, datos_anteriores, datos_nuevos, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.adminId,
      params.adminUsername,
      params.proyecto,
      params.accion,
      params.tabla,
      String(params.registroId),
      params.datosAnteriores ? JSON.stringify(params.datosAnteriores) : null,
      params.datosNuevos ? JSON.stringify(params.datosNuevos) : null,
      params.ipAddress ?? null,
    ]
  );
}
