import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from './firebase-client';

function guaranteeIsClient() {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called on the client side.');
  }
}

export function useFirebaseUserId(): Promise<string> {
  guaranteeIsClient();
  const auth = getAuth(getFirebaseApp());

  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
      } else {
        reject(new Error('User is not authenticated'));
      }
    });
  });
}
