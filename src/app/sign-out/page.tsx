'use client';

import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function SignOutPage() {
  useEffect(() => {
    const handleSignOut = async () => {
      try {
        // Sign out from Firebase
        await signOut(auth);
        
        // Clear the auth cookie via API
        await fetch('/api/sign-out', {
          method: 'POST',
        });
        
        // Redirect to sign-in page
        globalThis.location.href = '/sign-in';
      } catch (error) {
        console.error('Error signing out:', error);
        // Redirect anyway
        globalThis.location.href = '/sign-in';
      }
    };

    handleSignOut();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Signing out...</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  );
}