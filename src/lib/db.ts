import 'server-only';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

type SqlRow = Record<string, string | number | null | Uint8Array>;

let SqlJs: Awaited<ReturnType<typeof initSqlJs>> | null = null;

async function getSqlJs() {
  if (!SqlJs) {
    SqlJs = await initSqlJs({
      locateFile: (file: string) =>
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    });
  }
  return SqlJs;
}

export class SqlDb {
  private db: InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>;
  private filePath: string;

  private constructor(db: any, filePath: string) {
    this.db = db;
    this.filePath = filePath;
  }

  static async open(filePath: string): Promise<SqlDb> {
    const SQL = await getSqlJs();
    const absPath = path.resolve(filePath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let db: any;
    if (fs.existsSync(absPath)) {
      const buf = fs.readFileSync(absPath);
      db = new SQL.Database(buf);
    } else {
      db = new SQL.Database();
    }
    return new SqlDb(db, absPath);
  }

  exec(sql: string): void {
    this.db.run(sql);
    this.persist();
  }

  run(sql: string, params: (string | number | null | undefined)[] = []): void {
    this.db.run(sql, params as any);
    this.persist();
  }

  get(sql: string, params: (string | number | null | undefined)[] = []): SqlRow | undefined {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as any);
    const found = stmt.step();
    const row = found ? (stmt.getAsObject() as SqlRow) : undefined;
    stmt.free();
    return row;
  }

  all(sql: string, params: (string | number | null | undefined)[] = []): SqlRow[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as any);
    const rows: SqlRow[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as SqlRow);
    }
    stmt.free();
    return rows;
  }

  private persist(): void {
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
  }

  close(): void {
    this.db.close();
  }
}

export async function getAdminDb(): Promise<SqlDb> {
  const dbPath = process.env.ADMIN_DB_PATH || path.join(process.cwd(), 'database', 'medicadmin.db');
  const db = await SqlDb.open(dbPath);
  await initAdminSchema(db);
  return db;
}

export async function getMedicDataDb(): Promise<SqlDb> {
  const dbPath = process.env.MEDICDATA_DB_PATH;
  if (!dbPath) throw new Error('MEDICDATA_DB_PATH no está configurado en .env.local');
  return SqlDb.open(dbPath);
}

export async function getMedicProfessionalsDb(): Promise<SqlDb> {
  const dbPath = process.env.MEDICPROFESSIONALS_DB_PATH;
  if (!dbPath) throw new Error('MEDICPROFESSIONALS_DB_PATH no está configurado en .env.local');
  return SqlDb.open(dbPath);
}

async function initAdminSchema(db: SqlDb): Promise<void> {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
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
      BEGIN SELECT RAISE(ABORT, 'El registro de auditoria es inmutable'); END;

    CREATE TRIGGER IF NOT EXISTS no_delete_audit
      BEFORE DELETE ON audit_log
      BEGIN SELECT RAISE(ABORT, 'El registro de auditoria es inmutable'); END;
  `);
}

function getAdminHeaders(): Record<string, string> {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) throw new Error('ADMIN_API_SECRET no está configurado en .env.local');
  return {
    'Content-Type': 'application/json',
    'x-admin-token': secret,
  };
}

export async function medicDataFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = process.env.MEDICDATA_URL;
  if (!baseUrl) throw new Error('MEDICDATA_URL no está configurado en .env.local');
  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...getAdminHeaders(),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

export async function medicProfessionalsFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = process.env.MEDICPROFESSIONALS_URL;
  if (!baseUrl) throw new Error('MEDICPROFESSIONALS_URL no está configurado en .env.local');
  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...getAdminHeaders(),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}
