import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next compara el hostname, así que esto habilita http://192.168.1.87:3001.
  allowedDevOrigins: ['192.168.1.87'],
};

export default nextConfig;
