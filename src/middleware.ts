import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  // If user has token and tries to access sign-in, redirect to home
  console.log('pathname:', request.nextUrl.pathname, 'token:', !!token);
  if (token && request.nextUrl.pathname === '/sign-in') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Allow /sign-in to be public (for users without token)
  if (request.nextUrl.pathname === '/sign-in') {
    return NextResponse.next();
  }
  
  // For all other routes, require token
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  // Edge runtime: cannot verify token here, just check presence
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|api).*)'],
};
