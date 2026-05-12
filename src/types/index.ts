export interface AdminUser {
  id: number;
  username: string;
  nombre: string;
  created_at: string;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  username: string;
  role: string;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  professional_id: number;
  professional_name: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha_registro: string | null;
  activo: number;
  acepta_paciente: number;
  archivo_nombre: string | null;
  created_at: string;
}

export interface Professional {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  username: string;
  role: string;
  especialidad: string | null;
  matricula: string | null;
  institucion: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  admin_id: number;
  admin_username: string;
  proyecto: string;
  accion: string;
  tabla: string;
  registro_id: string | null;
  datos_anteriores: string | null;
  datos_nuevos: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface JWTPayload {
  adminId: number;
  username: string;
  nombre: string;
}
