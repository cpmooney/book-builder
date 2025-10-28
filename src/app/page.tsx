'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!loading && user) {
        setRedirecting(true);
        try {
            router.push('/books');
        } catch (error) {
          console.error('Error loading books:', error);
          // Fallback to books list
          router.push('/books');
        }
      } else if (!loading && !user) {
        // User is not authenticated, redirect to sign-in
        router.push('/sign-in');
      }
    };

    handleRedirect();
  }, [user, loading, router]);

  if (loading || redirecting) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return <div style={{ padding: '20px' }}>Redirecting...</div>;
}