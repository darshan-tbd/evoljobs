/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000',
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'JobPilot',
    NEXT_PUBLIC_SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'AI-Powered Job Search Platform',
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'api.evoljobs.com',
      'evoljobs.com',
      'cdn.evoljobs.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'media.licdn.com',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [];
  },
  
  // Rewrites for API proxy (development only)
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      const apiUrl = 'http://127.0.0.1:8000';
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*/`,
        },
      ];
    }
    return [];
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')({
        enabled: process.env.ANALYZE === 'true',
      });
      config.plugins.push(new BundleAnalyzerPlugin());
    }
    
    // Optimize for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Experimental features - DISABLED to prevent errors
  // experimental: {
  //   optimizeCss: true,
  //   scrollRestoration: true,
  // },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Output configuration
  output: 'standalone',
  
  // Build configuration
  generateBuildId: async () => {
    // Use git commit hash as build ID
    return process.env.NEXT_BUILD_ID || 'dev-build';
  },
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Trailing slash
  trailingSlash: false,
  
  // Static optimization
  staticPageGenerationTimeout: 60,
  
  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

module.exports = nextConfig; 