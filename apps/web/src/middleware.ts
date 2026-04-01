import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// 공개 경로 — 인증 없이 접근 가능한 경로
// ============================================================================

const PUBLIC_PATHS = [
  '/',           // 소개 페이지
  '/login',
  '/signup',
  '/forgot-password',
];

// 항상 통과시킬 정적/시스템 경로 prefix
const BYPASS_PREFIXES = [
  '/_next/',
  '/api/',
  '/favicon',
  '/icons/',
  '/public/',
];

// 정적 파일 확장자
const STATIC_EXTENSIONS = ['.js', '.css', '.json', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];

function isPublicPath(pathname: string): boolean {
  // 정확한 공개 경로
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // 시스템/정적 prefix
  if (BYPASS_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;

  // 정적 파일 확장자
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) return true;

  return false;
}

// ============================================================================
// 보안 헤더
// ============================================================================

function applySecurityHeaders(response: NextResponse, pathname: string): void {
  // API 및 정적 파일에는 최소 헤더만 적용
  if (pathname.startsWith('/api/') || STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return;
  }

  // HTML 페이지: CSP + 보안 헤더
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss: ws://localhost:* ws://127.0.0.1:* http://localhost:*",
    "frame-src 'self' https:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// ============================================================================
// CORS 헤더
// ============================================================================

const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:8000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:8000',
];

function applyCORSHeaders(response: NextResponse, origin: string): void {
  if (!origin) return;

  // localhost/127.0.0.1의 모든 포트 허용
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
  } catch {
    // 잘못된 origin 무시
  }
}

// ============================================================================
// Middleware
// ============================================================================

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get('origin') || '';

  // OPTIONS preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    applyCORSHeaders(response, origin);
    return response;
  }

  const response = NextResponse.next();

  // 보안 헤더
  applySecurityHeaders(response, pathname);

  // CORS
  applyCORSHeaders(response, origin);

  // 공개 경로면 그대로 통과
  if (isPublicPath(pathname)) {
    return response;
  }

  // ──────────────────────────────────────────────────────────
  // 인증 검사는 client-side AuthGuard/ReverseAuthGuard에서 수행
  // 기존 xgen-frontend과 동일하게 middleware에서는 인증 리다이렉트를 하지 않음
  // ──────────────────────────────────────────────────────────

  return response;
}

// ============================================================================
// Matcher — 모든 경로에 적용 (정적 파일 제외)
// ============================================================================

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
