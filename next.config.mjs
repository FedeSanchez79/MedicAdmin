import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Canonical path con casing correcto (fix para Windows + OneDrive)
const realRoot = fs.realpathSync(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({ 'sql.js': 'commonjs sql.js' });
    }
    // Normaliza rutas para evitar módulos duplicados por casing en OneDrive
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [path.join(realRoot, 'node_modules')],
    };
    return config;
  },
};

export default nextConfig;
