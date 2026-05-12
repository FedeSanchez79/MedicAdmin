import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({ 'sql.js': 'commonjs sql.js' });
    }
    return config;
  },
};

export default nextConfig;
