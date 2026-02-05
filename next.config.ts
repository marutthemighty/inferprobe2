/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force disable Turbopack – use classic Webpack builder
  // This is the only reliable way in Next.js 16.1.4 to avoid Turbopack font bugs
  experimental: {
    // No turbopack key at all – absence = disable in most cases
  },

  // Keep image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Faster minification (SWC is still used)
  swcMinify: true,
}

export default nextConfig;
