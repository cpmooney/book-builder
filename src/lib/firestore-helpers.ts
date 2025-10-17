import { serverTimestamp } from 'firebase/firestore';

/**
 * Adds createdAt and updatedAt timestamps for creating new documents
 * @param data - The document data to augment
 * @returns Data with timestamps added
 */
export function withTimestampsForCreate<T extends Record<string, any>>(data: T) {
  return {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Adds updatedAt timestamp for updating existing documents
 * @param data - The document data to augment
 * @returns Data with updatedAt timestamp added
 */
export function withTimestampsForUpdate<T extends Record<string, any>>(data: T) {
  return {
    ...data,
    updatedAt: serverTimestamp(),
  };
}