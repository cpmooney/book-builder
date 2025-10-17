import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Allow /sign-in to be public
  if (request.nextUrl.pathname === '/sign-in') {
    return NextResponse.next();
  }
  const token = request.cookies.get('firebase_id_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  // Edge runtime: cannot verify token here, just check presence
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|api).*)'],
};
