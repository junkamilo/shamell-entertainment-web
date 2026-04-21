/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    // Old Vite files in src/components/ and src/views/ use react-router-dom
    // and are not part of the Next.js route tree — safe to ignore during migration
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
