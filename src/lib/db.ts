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

let adminDbInstance: SqlDb | null = null;

export async function getAdminDb(): Promise<SqlDb> {
  if (!adminDbInstance) {
    const dbPath = process.env.ADMIN_DB_PATH || path.join(process.cwd(), 'database', 'medicadmin.db');
    adminDbInstance = await SqlDb.open(dbPath);
    await initAdminSchema(adminDbInstance);
  }
  return adminDbInstance;
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

export async function getMedicDataDb(): Promise<SqlDb> {
  const dbPath = process.env.MEDICDATA_DB_PATH;
  if (!dbPath) throw new Error('MEDICDATA_DB_PATH no está configurado en .env.local');
  return SqlDb.open(path.resolve(dbPath));
}

export async function getMedicProfessionalsDb(): Promise<SqlDb> {
  const dbPath = process.env.MEDICPROFESSIONALS_DB_PATH;
  if (!dbPath) throw new Error('MEDICPROFESSIONALS_DB_PATH no está configurado en .env.local');
  return SqlDb.open(path.resolve(dbPath));
}
