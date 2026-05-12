import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let adminDb: Database.Database | null = null;

export function getAdminDb(): Database.Database {
  if (!adminDb) {
    const dbPath = process.env.ADMIN_DB_PATH
      ? path.resolve(process.env.ADMIN_DB_PATH)
      : path.join(process.cwd(), 'database', 'medicadmin.db');

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    adminDb = new Database(dbPath);
    initAdminDb(adminDb);
  }
  return adminDb;
}

function initAdminDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      admin_username TEXT NOT NULL,
      proyecto TEXT NOT NULL,
      accion TEXT NOT NULL,
      tabla TEXT NOT NULL,
      registro_id TEXT,
      datos_anteriores TEXT,
      datos_nuevos TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS no_update_audit
      BEFORE UPDATE ON audit_log
      BEGIN SELECT RAISE(ABORT, 'El registro de auditoría es inmutable');
    END;

    CREATE TRIGGER IF NOT EXISTS no_delete_audit
      BEFORE DELETE ON audit_log
      BEGIN SELECT RAISE(ABORT, 'El registro de auditoría es inmutable');
    END;
  `);
}

export function getMedicDataDb(): Database.Database {
  const dbPath = process.env.MEDICDATA_DB_PATH;
  if (!dbPath) throw new Error('MEDICDATA_DB_PATH no está configurado en .env.local');
  return new Database(path.resolve(dbPath), { readonly: false });
}

export function getMedicProfessionalsDb(): Database.Database {
  const dbPath = process.env.MEDICPROFESSIONALS_DB_PATH;
  if (!dbPath) throw new Error('MEDICPROFESSIONALS_DB_PATH no está configurado en .env.local');
  return new Database(path.resolve(dbPath), { readonly: false });
}
