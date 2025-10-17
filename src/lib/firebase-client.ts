import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

export function getFirebaseApp() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export function getFirebaseAuth() {
  getFirebaseApp();
  const auth = getAuth();
  // Always try local persistence first, fallback to session if it fails
  setPersistence(auth, browserLocalPersistence)
    .catch(() => setPersistence(auth, browserSessionPersistence))
    .catch(console.error);
  return auth;
}

export function getFirebaseFirestore() {
  getFirebaseApp();
  return getFirestore();
}

// Export a default db instance for convenience
export const db = getFirebaseFirestore();

export { GoogleAuthProvider };
