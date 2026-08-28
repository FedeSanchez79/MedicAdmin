/**
 * Script de configuración inicial de MedicAdmin.
 * Uso: node scripts/setup.mjs
 */

import pg from 'pg';
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

function ask(rl, prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    console.error('\nError: falta DATABASE_URL en .env.local\n');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  await client.query('SET search_path TO medicadmin, public');
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS medicadmin;
    CREATE TABLE IF NOT EXISTS medicadmin.admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n=== MedicAdmin — Configuración inicial ===\n');

  const username = await ask(rl, 'Nombre de usuario del administrador: ');
  const nombre = await ask(rl, 'Nombre completo del administrador: ');
  const password = await ask(rl, 'Contraseña (mínimo 8 caracteres): ');

  rl.close();

  if (!username.trim() || !password.trim() || !nombre.trim()) {
    console.error('\nError: Todos los campos son obligatorios.');
    await client.release();
    await pool.end();
    process.exit(1);
  }
  if (password.trim().length < 8) {
    console.error('\nError: La contraseña debe tener al menos 8 caracteres.');
    await client.release();
    await pool.end();
    process.exit(1);
  }

  const hash = await bcrypt.hash(password.trim(), 10);

  const existing = await client.query('SELECT id FROM admin_users WHERE username = $1', [username.trim()]);

  if (existing.rows.length > 0) {
    await client.query('UPDATE admin_users SET password = $1, nombre = $2 WHERE username = $3',
      [hash, nombre.trim(), username.trim()]);
    console.log(`\nAdministrador "${username.trim()}" actualizado exitosamente.\n`);
  } else {
    await client.query('INSERT INTO admin_users (username, password, nombre) VALUES ($1, $2, $3)',
      [username.trim(), hash, nombre.trim()]);
    console.log(`\nAdministrador "${username.trim()}" creado exitosamente.\n`);
  }

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
