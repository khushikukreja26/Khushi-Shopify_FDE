// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Let production builds succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // Optional: uncomment if TypeScript errors ever block builds too
  // typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
