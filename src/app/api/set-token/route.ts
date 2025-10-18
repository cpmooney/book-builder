import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // TODO: Verify the Firebase ID token here
    // You can use Firebase Admin SDK to verify the token
    // Example:
    // import { getAuth } from 'firebase-admin/auth';
    // const decodedToken = await getAuth().verifyIdToken(token);
    
    // For now, just set the token as a cookie
    const response = NextResponse.json({ success: true });
    
    // Set secure HTTP-only cookie with the token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error setting token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}