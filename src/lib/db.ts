import 'server-only';
import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurado');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 8000,
    });
  }
  return pool;
}

// Traduce placeholders estilo sqlite ("?") a placeholders de Postgres ($1, $2, ...)
function toPgParams(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

type SqlParam = string | number | boolean | null | undefined;
type SqlRow = Record<string, unknown>;

// Wrapper con la misma interfaz que se usaba con sql.js (get/all/run/exec),
// para no reescribir cada consulta de las rutas y páginas del panel.
// Ahora es async porque habla por red con Postgres — todo caller pasó a usar
// `await db.get/all/run(...)`.
export class SqlDb {
  constructor(private schema: string) {}

  private async query(sql: string, params: SqlParam[] = []) {
    const client = await getPool().connect();
    try {
      await client.query(`SET search_path TO ${this.schema}, public`);
      return await client.query(toPgParams(sql), params);
    } finally {
      client.release();
    }
  }

  async exec(sql: string): Promise<void> {
    await this.query(sql);
  }

  async run(sql: string, params: SqlParam[] = []): Promise<void> {
    await this.query(sql, params);
  }

  async get(sql: string, params: SqlParam[] = []): Promise<SqlRow | undefined> {
    const r = await this.query(sql, params);
    return r.rows[0] as SqlRow | undefined;
  }

  async all(sql: string, params: SqlParam[] = []): Promise<SqlRow[]> {
    const r = await this.query(sql, params);
    return r.rows as SqlRow[];
  }
}

async function initAdminSchema(db: SqlDb): Promise<void> {
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS medicadmin;

    CREATE TABLE IF NOT EXISTS medicadmin.admin_users (
      id          SERIAL PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      nombre      TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS medicadmin.reset_tokens (
      id          SERIAL PRIMARY KEY,
      token       TEXT UNIQUE NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS medicadmin.audit_log (
      id                SERIAL PRIMARY KEY,
      admin_id          INTEGER NOT NULL,
      admin_username    TEXT NOT NULL,
      proyecto          TEXT NOT NULL,
      accion            TEXT NOT NULL,
      tabla             TEXT NOT NULL,
      registro_id       TEXT,
      datos_anteriores  TEXT,
      datos_nuevos      TEXT,
      ip_address        TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE OR REPLACE FUNCTION medicadmin.no_mutate_audit() RETURNS trigger AS $f$
    BEGIN
      RAISE EXCEPTION 'El registro de auditoria es inmutable';
    END;
    $f$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS no_update_audit ON medicadmin.audit_log;
    CREATE TRIGGER no_update_audit BEFORE UPDATE ON medicadmin.audit_log
      FOR EACH ROW EXECUTE FUNCTION medicadmin.no_mutate_audit();

    DROP TRIGGER IF EXISTS no_delete_audit ON medicadmin.audit_log;
    CREATE TRIGGER no_delete_audit BEFORE DELETE ON medicadmin.audit_log
      FOR EACH ROW EXECUTE FUNCTION medicadmin.no_mutate_audit();
  `);
}

export async function getAdminDb(): Promise<SqlDb> {
  const db = new SqlDb('medicadmin');
  await initAdminSchema(db);
  return db;
}

export async function getMedicDataDb(): Promise<SqlDb> {
  return new SqlDb('medicdata');
}

export async function getMedicProfessionalsDb(): Promise<SqlDb> {
  return new SqlDb('medicprofessionals');
}

function getAdminHeaders(): Record<string, string> {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) throw new Error('ADMIN_API_SECRET no está configurado');
  return {
    'Content-Type': 'application/json',
    'x-admin-token': secret,
  };
}

export async function medicDataFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = process.env.MEDICDATA_URL;
  if (!baseUrl) throw new Error('MEDICDATA_URL no está configurado');
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
  if (!baseUrl) throw new Error('MEDICPROFESSIONALS_URL no está configurado');
  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...getAdminHeaders(),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}
