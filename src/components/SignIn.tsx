// components/sign-in.tsx
'use client';
import { getFirebaseAuth } from '@lib/firebase/firebase-client';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { useAuth } from '@/app/components/AuthProvider';

export function SignIn() {
  const { user, loading } = useAuth();
  const auth = getFirebaseAuth();

  const handleSignIn = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await fetch('/api/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
        credentials: 'include',
      });
      window.location.href = '/';
    } catch (err) {
      // If popup fails (e.g. blocked), fallback to redirect
      console.error('Sign-in error:', err);
      localStorage.setItem('postSignInRedirect', '/');
      await signInWithRedirect(auth, provider);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading) return <div className="text-white">Loading...</div>;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white text-xs">Signed in as {user.displayName || user.email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="px-2 py-1 text-xs bg-ochre text-white rounded hover:bg-ochre/90"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-xs"
    >
      Sign in with Google
    </button>
  );
}
