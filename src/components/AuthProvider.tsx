// components/auth-provider.tsx
'use client';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { getRedirectResult, onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsub: (() => void) | undefined;
    getRedirectResult(auth)
      .then((result) => {
        console.log('[AuthProvider] getRedirectResult result:', result);
        if (result && result.user) {
          setUser(result.user);
          setLoading(false);
          console.log('[AuthProvider] User set from getRedirectResult:', result.user);
        } else {
          unsub = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            console.log('[AuthProvider] User set from onAuthStateChanged:', user);
          });
        }
      })
      .catch((err) => {
        console.error('[AuthProvider] getRedirectResult error', err);
        unsub = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
          console.log('[AuthProvider] User set from onAuthStateChanged (catch):', user);
        });
      });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
