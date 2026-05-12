/**
 * Script de configuración inicial de MedicAdmin.
 * Uso: node scripts/setup.mjs
 */

import initSqlJs from 'sql.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(projectRoot, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

function createDb(SQL, dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = fs.existsSync(dbPath)
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();

  db.run(`
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

  const persist = () => fs.writeFileSync(dbPath, Buffer.from(db.export()));
  persist();
  return { db, persist };
}

function ask(rl, prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  loadEnv();

  const dbPath = process.env.ADMIN_DB_PATH
    ? path.resolve(process.env.ADMIN_DB_PATH)
    : path.join(projectRoot, 'database', 'medicadmin.db');

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(projectRoot, 'node_modules', 'sql.js', 'dist', file),
  });

  const { db, persist } = createDb(SQL, dbPath);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n=== MedicAdmin — Configuración inicial ===\n');

  const username = await ask(rl, 'Nombre de usuario del administrador: ');
  const nombre = await ask(rl, 'Nombre completo del administrador: ');
  const password = await ask(rl, 'Contraseña (mínimo 8 caracteres): ');

  rl.close();

  if (!username.trim() || !password.trim() || !nombre.trim()) {
    console.error('\nError: Todos los campos son obligatorios.');
    process.exit(1);
  }
  if (password.trim().length < 8) {
    console.error('\nError: La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password.trim(), 10);

  const stmt = db.prepare('SELECT id FROM admin_users WHERE username = ?');
  stmt.bind([username.trim()]);
  const exists = stmt.step();
  stmt.free();

  if (exists) {
    db.run('UPDATE admin_users SET password = ?, nombre = ? WHERE username = ?',
      [hash, nombre.trim(), username.trim()]);
    persist();
    console.log(`\nAdministrador "${username.trim()}" actualizado exitosamente.\n`);
  } else {
    db.run('INSERT INTO admin_users (username, password, nombre) VALUES (?, ?, ?)',
      [username.trim(), hash, nombre.trim()]);
    persist();
    console.log(`\nAdministrador "${username.trim()}" creado exitosamente.`);
    console.log(`Base de datos en: ${dbPath}\n`);
  }

  db.close();
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
