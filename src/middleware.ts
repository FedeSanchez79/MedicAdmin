import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev_secret_change_in_production'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/api/auth/');

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.delete('admin_token');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/medicdata/:path*', '/api/medicprofessionals/:path*', '/api/audit/:path*'],
};
