/**
 * Script de configuración inicial de MedicAdmin.
 * Uso: node scripts/setup.mjs
 *
 * Crea la base de datos del administrador y el primer usuario admin.
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Cargar .env.local si existe
const envPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const dbPath = process.env.ADMIN_DB_PATH
  ? path.resolve(process.env.ADMIN_DB_PATH)
  : path.join(projectRoot, 'database', 'medicadmin.db');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);

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
    BEGIN SELECT RAISE(ABORT, 'El registro de auditoría es inmutable'); END;

  CREATE TRIGGER IF NOT EXISTS no_delete_audit
    BEFORE DELETE ON audit_log
    BEGIN SELECT RAISE(ABORT, 'El registro de auditoría es inmutable'); END;
`);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise((resolve) => rl.question(q, resolve));

console.log('\n=== MedicAdmin — Configuración inicial ===\n');

const username = await question('Nombre de usuario del administrador: ');
const nombre = await question('Nombre completo del administrador: ');
const password = await question('Contraseña (mínimo 8 caracteres): ');

if (!username || !password || !nombre) {
  console.error('\nError: Todos los campos son obligatorios.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('\nError: La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username);
if (existing) {
  console.log(`\nEl usuario "${username}" ya existe. Actualizando contraseña...`);
  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE admin_users SET password = ?, nombre = ? WHERE username = ?')
    .run(hash, nombre, username);
  console.log('Contraseña actualizada exitosamente.\n');
} else {
  const hash = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO admin_users (username, password, nombre) VALUES (?, ?, ?)')
    .run(username, hash, nombre);
  console.log(`\nAdministrador "${username}" creado exitosamente.`);
  console.log(`Base de datos creada en: ${dbPath}\n`);
}

rl.close();
db.close();
