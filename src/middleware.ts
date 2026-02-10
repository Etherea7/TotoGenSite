import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply CORS to /api/* routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  // Add CORS headers to API responses
  const response = NextResponse.next()
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value)
  }
  return response
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  }
}

export const config = {
  matcher: '/api/:path*',
}
