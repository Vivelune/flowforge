import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@flowforge/db', '@flowforge/engine', '@flowforge/events'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
