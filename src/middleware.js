import { NextResponse } from 'next/server';

export function middleware(request) {
  // Handle CORS for all routes
  const origin = request.headers.get('origin');
  const isDevEnvironment = process.env.NODE_ENV === 'development';
  
  // Define allowed origins
  const allowedOrigins = [
    // Development origins
    ...(isDevEnvironment ? [
      'https://*.replit.dev',
      'https://*.repl.co',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost',
      'http://127.0.0.1'
    ] : []),
    // Production origins can be added here via environment variable
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ];

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
      // Handle wildcard patterns like https://*.replit.dev safely
      try {
        const allowedUrl = new URL(allowedOrigin.replace('*', 'placeholder'));
        const originUrl = new URL(origin);
        
        // Protocol must match
        if (allowedUrl.protocol !== originUrl.protocol) {
          return false;
        }
        
        // For wildcard subdomains, check if host ends with the domain
        const wildcardDomain = allowedUrl.hostname.replace('placeholder', '');
        if (wildcardDomain.startsWith('.')) {
          // Pattern like https://*.replit.dev - require actual subdomain
          const domain = wildcardDomain.substring(1); // Remove leading dot
          return originUrl.hostname.endsWith('.' + domain);
        }
        
        return false;
      } catch (e) {
        // Invalid URL format, no match
        return false;
      }
    }
    return origin === allowedOrigin;
  });

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (isAllowed && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    // Echo requested method or use defaults
    const requestedMethod = request.headers.get('access-control-request-method');
    response.headers.set('Access-Control-Allow-Methods', 
      requestedMethod || 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Echo requested headers or use defaults
    const requestedHeaders = request.headers.get('access-control-request-headers');
    response.headers.set('Access-Control-Allow-Headers', 
      requestedHeaders || 'Content-Type, Authorization, X-Requested-With');
    
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Vary', 'Origin, Access-Control-Request-Headers');
    
    return response;
  }

  // Handle actual requests
  const response = NextResponse.next();
  
  if (isAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  response.headers.set('Vary', 'Origin');

  // Add cache control for non-static routes in development
  if (isDevEnvironment && !request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Include API routes for proper CORS handling
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};