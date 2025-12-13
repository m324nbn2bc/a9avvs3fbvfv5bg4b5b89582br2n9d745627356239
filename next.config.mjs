/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Replit deployment
  output: 'standalone',
  
  // Disable problematic features that can cause hanging
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configure remote image patterns for Next.js Image optimization
  // Note: ImageKit URLs should use unoptimized={true} on Image components
  // This is a fallback safety measure
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  
  // Configure headers to prevent hanging and improve compatibility
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://*.firebase.com https://www.gstatic.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://ik.imagekit.io https://*.googleusercontent.com https://*.google.com https://www.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.firebaseio.com https://*.firebase.com https://*.supabase.co wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
              "frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://accounts.google.com https://*.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
        ],
      },
      {
        // Static assets caching
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Disable caching for development API routes to prevent hanging
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Simplified webpack configuration for Replit
  webpack: (config, { dev, isServer }) => {
    // Basic development optimizations only
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/attached_assets/**', 
          '**/.local/**', 
          '**/tmp/**',
          '**/logs/**'
        ]
      };
    }
    
    return config;
  },
  
  // Configure allowed dev origins for Replit proxy
  allowedDevOrigins: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost',
    'http://127.0.0.1',
    'https://*.replit.dev',
    'https://*.repl.co',
    `https://${process.env.REPLIT_DEV_DOMAIN}`,
    // Current Replit domain
    `https://${process.env.REPLIT_DEV_DOMAIN}`,
    process.env.REPLIT_DEV_DOMAIN,
    // Allow local origins for development
    '127.0.0.1',
    'localhost'
  ].filter(Boolean),
  
  // External packages for server components
  serverExternalPackages: ['firebase-admin'],
  
  // Experimental features - configure properly for Next.js 15
  experimental: {
    serverActions: {
      allowedOrigins: [
        'https://*.replit.dev',
        'https://*.repl.co',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost',
        'http://127.0.0.1',
        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
      ]
    }
  },
  
  // Add development server configuration
  env: {
    CUSTOM_KEY: 'replit-optimized',
  },
  
  // Configure redirects to handle 404s faster
  async redirects() {
    return [];
  },
  
  // Add rewrite rules for better routing
  async rewrites() {
    return [];
  },
};

export default nextConfig;