/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({ 'sql.js': 'commonjs sql.js' });
    }
    return config;
  },
};

export default nextConfig;
