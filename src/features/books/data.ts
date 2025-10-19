import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  query, 
  orderBy, 
  DocumentReference 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { withTimestampsForCreate, withTimestampsForUpdate } from '../../lib/firestore-helpers';
import { nextSortKey } from '../../lib/sortKey';
import type { Book, Part, Chapter, Section, Block } from '../../types/book-builder';

// Book CRUD
/**
 * Gets all books for the given user
 * @param uid - User ID
 * @returns Array of books with their IDs
 */
export async function listBooks(uid: string): Promise<Book[]> {
  const booksRef = collection(db, 'users', uid, 'books');
  const snapshot = await getDocs(query(booksRef, orderBy('sortKey', 'asc')));
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Book));
}

/**
 * Creates a new book for the given user
 * @param uid - User ID
 * @param data - Book data (without timestamps/sortKey)
 * @returns The created book document reference
 */
export async function createBook(
  uid: string, 
  data: Omit<Book, 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'sortKey'>
): Promise<DocumentReference> {
  const booksRef = collection(db, 'users', uid, 'books');
  
  // Get last sortKey
  const existingBooks = await getDocs(query(booksRef, orderBy('sortKey', 'desc')));
  const lastSortKey = existingBooks.docs[0]?.data()?.sortKey;
  
  return addDoc(booksRef, withTimestampsForCreate({
    ...data,
    uid,
    sortKey: nextSortKey(lastSortKey)
  }));
}

/**
 * Updates an existing book
 * @param uid - User ID
 * @param bookId - Book ID
 * @param data - Partial book data to update
 */
export async function updateBook(
  uid: string, 
  bookId: string, 
  data: Partial<Omit<Book, 'id' | 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const bookRef = doc(db, 'users', uid, 'books', bookId);
  await updateDoc(bookRef, withTimestampsForUpdate(data));
}

// Part CRUD
/**
 * Creates a new part within a book
 * @param uid - User ID
 * @param bookId - Book ID
 * @param data - Part data (without timestamps/sortKey/breadcrumbs)
 * @returns The created part document reference
 */
export async function createPart(
  uid: string,
  bookId: string,
  data: Omit<Part, 'id' | 'uid' | 'bookId' | 'createdAt' | 'updatedAt' | 'sortKey'>
): Promise<DocumentReference> {
  const partsRef = collection(db, 'users', uid, 'books', bookId, 'parts');
  
  // Get last sortKey
  const existingParts = await getDocs(query(partsRef, orderBy('sortKey', 'desc')));
  const lastSortKey = existingParts.docs[0]?.data()?.sortKey;
  
  return addDoc(partsRef, withTimestampsForCreate({
    ...data,
    uid,
    bookId,
    sortKey: nextSortKey(lastSortKey)
  }));
}

/**
 * Updates an existing part
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param data - Partial part data to update
 */
export async function updatePart(
  uid: string,
  bookId: string,
  partId: string,
  data: Partial<Omit<Part, 'id' | 'uid' | 'bookId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const partRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId);
  await updateDoc(partRef, withTimestampsForUpdate(data));
}

/**
 * Reorders parts by updating their sortKeys
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partIds - Array of part IDs in the new order
 */
export async function reorderParts(
  uid: string,
  bookId: string,
  partIds: string[]
): Promise<void> {
  const batch = writeBatch(db);
  
  // Use batch write for atomic updates
  for (let index = 0; index < partIds.length; index++) {
    const partId = partIds[index];
    const partRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId);
    batch.update(partRef, withTimestampsForUpdate({ sortKey: index * 1000 }));
  }
  
  await batch.commit();
}

/**
 * Deletes a part and all its chapters/sections/blocks
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 */
export async function deletePart(
  uid: string,
  bookId: string,
  partId: string
): Promise<void> {
  // TODO: In a production app, you'd want to delete all nested collections first
  // For now, just delete the part document
  const partRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId);
  await deleteDoc(partRef);
}

// Chapter CRUD
/**
 * Creates a new chapter within a part
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param data - Chapter data (without timestamps/sortKey/breadcrumbs)
 * @returns The created chapter document reference
 */
export async function createChapter(
  uid: string,
  bookId: string,
  partId: string,
  data: Omit<Chapter, 'id' | 'uid' | 'bookId' | 'partId' | 'createdAt' | 'updatedAt' | 'sortKey'>
): Promise<DocumentReference> {
  const chaptersRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters');
  
  // Get last sortKey
  const existingChapters = await getDocs(query(chaptersRef, orderBy('sortKey', 'desc')));
  const lastSortKey = existingChapters.docs[0]?.data()?.sortKey;
  
  return addDoc(chaptersRef, withTimestampsForCreate({
    ...data,
    uid,
    bookId,
    partId,
    sortKey: nextSortKey(lastSortKey)
  }));
}

/**
 * Updates an existing chapter
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param data - Partial chapter data to update
 */
export async function updateChapter(
  uid: string,
  bookId: string,
  partId: string,
  chapterId: string,
  data: Partial<Omit<Chapter, 'id' | 'uid' | 'bookId' | 'partId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const chapterRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId);
  await updateDoc(chapterRef, withTimestampsForUpdate(data));
}

/**
 * Deletes a chapter
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 */
export async function deleteChapter(
  uid: string,
  bookId: string,
  partId: string,
  chapterId: string
): Promise<void> {
  const chapterRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId);
  await deleteDoc(chapterRef);
}

// Section CRUD
/**
 * Creates a new section within a chapter
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param data - Section data (without timestamps/sortKey/breadcrumbs)
 * @returns The created section document reference
 */
export async function createSection(
  uid: string,
  bookId: string,
  partId: string,
  chapterId: string,
  data: Omit<Section, 'id' | 'uid' | 'bookId' | 'partId' | 'chapterId' | 'createdAt' | 'updatedAt' | 'sortKey'>
): Promise<DocumentReference> {
  const sectionsRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections');
  
  // Get last sortKey
  const existingSections = await getDocs(query(sectionsRef, orderBy('sortKey', 'desc')));
  const lastSortKey = existingSections.docs[0]?.data()?.sortKey;
  
  return addDoc(sectionsRef, withTimestampsForCreate({
    ...data,
    uid,
    bookId,
    partId,
    chapterId,
    sortKey: nextSortKey(lastSortKey)
  }));
}

/**
 * Updates an existing section
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param sectionId - Section ID
 * @param data - Partial section data to update
 */
export async function updateSection(
  uid: string,
  bookId: string,
  partId: string,
  chapterId: string,
  sectionId: string,
  data: Partial<Omit<Section, 'id' | 'uid' | 'bookId' | 'partId' | 'chapterId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const sectionRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections', sectionId);
  await updateDoc(sectionRef, withTimestampsForUpdate(data));
}

/**
 * Deletes a section
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param sectionId - Section ID
 */
export async function deleteSection(
  uid: string,
  bookId: string,
  partId: string,
  chapterId: string,
  sectionId: string
): Promise<void> {
  const sectionRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections', sectionId);
  await deleteDoc(sectionRef);
}

// Block CRUD
/**
 * Creates a new block within a section
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param sectionId - Section ID
 * @param data - Block data (without timestamps/sortKey/breadcrumbs)
 * @returns The created block document reference
 */
export async function createBlock(
  uid: string,
  bookId: string,
  partId: string,
  chapterId: string,
  sectionId: string,
  data: Omit<Block, 'id' | 'uid' | 'bookId' | 'partId' | 'chapterId' | 'sectionId' | 'createdAt' | 'updatedAt' | 'sortKey'>
): Promise<DocumentReference> {
  const blocksRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections', sectionId, 'blocks');
  
  // Get last sortKey
  const existingBlocks = await getDocs(query(blocksRef, orderBy('sortKey', 'desc')));
  const lastSortKey = existingBlocks.docs[0]?.data()?.sortKey;
  
  return addDoc(blocksRef, withTimestampsForCreate({
    ...data,
    uid,
    bookId,
    partId,
    chapterId,
    sectionId,
    sortKey: nextSortKey(lastSortKey)
  }));
}

/**
 * Updates an existing block
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param sectionId - Section ID
 * @param blockId - Block ID
 * @param data - Partial block data to update
 */
export async function updateBlock(
  uid: string,
  bookId: string,
  partId: string,
  chapterId: string,
  sectionId: string,
  blockId: string,
  data: Partial<Omit<Block, 'id' | 'uid' | 'bookId' | 'partId' | 'chapterId' | 'sectionId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const blockRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections', sectionId, 'blocks', blockId);
  await updateDoc(blockRef, withTimestampsForUpdate(data));
}

// Query functions
/**
 * Gets the table of contents for a book (book data with parts and their chapters)
 * @param uid - User ID
 * @param bookId - Book ID
 * @returns Object with book data and parts array, each containing part data and its chapters
 */
export async function getBookTOC(uid: string, bookId: string) {
  // Get book document
  const bookRef = doc(db, 'users', uid, 'books', bookId);
  const bookSnapshot = await getDoc(bookRef);
  
  if (!bookSnapshot.exists()) {
    throw new Error('Book not found');
  }
  
  const book = { id: bookSnapshot.id, ...bookSnapshot.data() } as Book;
  
  const partsRef = collection(db, 'users', uid, 'books', bookId, 'parts');
  const partsSnapshot = await getDocs(query(partsRef, orderBy('sortKey')));
  
  const parts = await Promise.all(
    partsSnapshot.docs.map(async (partDoc) => {
      const part = { id: partDoc.id, ...partDoc.data() } as Part;
      
      // Get chapters for this part
      const chaptersRef = collection(db, 'users', uid, 'books', bookId, 'parts', partDoc.id, 'chapters');
      const chaptersSnapshot = await getDocs(query(chaptersRef, orderBy('sortKey')));
      const chapters = chaptersSnapshot.docs.map(chapterDoc => ({
        id: chapterDoc.id,
        ...chapterDoc.data()
      } as Chapter));
      
      return { part, chapters };
    })
  );
  
  return { ...book, parts };
}

/**
 * Gets the table of contents for a specific part (part info with its chapters)
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @returns Object with part data and its chapters array
 */
export async function getPartTOC(uid: string, bookId: string, partId: string) {
  // Get part document
  const partRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId);
  const partSnapshot = await getDoc(partRef);
  
  if (!partSnapshot.exists()) {
    throw new Error('Part not found');
  }
  
  const part = { id: partSnapshot.id, ...partSnapshot.data() } as Part;
  
  // Get chapters for this part
  const chaptersRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters');
  const chaptersSnapshot = await getDocs(query(chaptersRef, orderBy('sortKey')));
  const chapters = chaptersSnapshot.docs.map(chapterDoc => ({
    id: chapterDoc.id,
    ...chapterDoc.data()
  } as Chapter));
  
  return { part, chapters };
}

/**
 * Gets chapter summary with its sections
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @returns Object with chapter data and its sections array
 */
export async function getChapterSummary(uid: string, bookId: string, partId: string, chapterId: string) {
  // Get chapter document
  const chapterRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId);
  const chapterSnapshot = await getDoc(chapterRef);
  
  if (!chapterSnapshot.exists()) {
    throw new Error('Chapter not found');
  }
  
  const chapter = { id: chapterSnapshot.id, ...chapterSnapshot.data() } as Chapter;
  
  // Get sections for this chapter
  const sectionsRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections');
  const sectionsSnapshot = await getDocs(query(sectionsRef, orderBy('sortKey')));
  const sections = sectionsSnapshot.docs.map(sectionDoc => ({
    id: sectionDoc.id,
    ...sectionDoc.data()
  } as Section));
  
  return { chapter, sections };
}

/**
 * Gets section content with all blocks concatenated as text
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param sectionId - Section ID
 * @returns Object with section data and concatenated contentText
 */
export async function getSectionContent(uid: string, bookId: string, partId: string, chapterId: string, sectionId: string) {
  // Get section document
  const sectionRef = doc(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections', sectionId);
  const sectionSnapshot = await getDoc(sectionRef);
  
  if (!sectionSnapshot.exists()) {
    throw new Error('Section not found');
  }
  
  const section = { id: sectionSnapshot.id, ...sectionSnapshot.data() } as Section;
  
  // Get blocks for this section
  const blocksRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections', sectionId, 'blocks');
  const blocksSnapshot = await getDocs(query(blocksRef, orderBy('sortKey')));
  const blocks = blocksSnapshot.docs.map(blockDoc => ({
    id: blockDoc.id,
    ...blockDoc.data()
  } as Block));
  
  // Concatenate all block text with double newlines
  const contentText = blocks.map(block => block.text).join('\n\n');
  
  return { section, contentText };
}

// Optional list helpers
/**
 * Lists all parts for a book, ordered by sortKey
 * @param uid - User ID
 * @param bookId - Book ID
 * @returns Array of parts
 */
export async function listParts(uid: string, bookId: string): Promise<Part[]> {
  const partsRef = collection(db, 'users', uid, 'books', bookId, 'parts');
  const snapshot = await getDocs(query(partsRef, orderBy('sortKey')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Part));
}

/**
 * Lists all chapters for a part, ordered by sortKey
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @returns Array of chapters
 */
export async function listChapters(uid: string, bookId: string, partId: string): Promise<Chapter[]> {
  const chaptersRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters');
  const snapshot = await getDocs(query(chaptersRef, orderBy('sortKey')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter));
}

/**
 * Lists all sections for a chapter, ordered by sortKey
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @returns Array of sections
 */
export async function listSections(uid: string, bookId: string, partId: string, chapterId: string): Promise<Section[]> {
  const sectionsRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections');
  const snapshot = await getDocs(query(sectionsRef, orderBy('sortKey')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
}

/**
 * Lists all blocks for a section, ordered by sortKey
 * @param uid - User ID
 * @param bookId - Book ID
 * @param partId - Part ID
 * @param chapterId - Chapter ID
 * @param sectionId - Section ID
 * @returns Array of blocks
 */
export async function listBlocks(uid: string, bookId: string, partId: string, chapterId: string, sectionId: string): Promise<Block[]> {
  const blocksRef = collection(db, 'users', uid, 'books', bookId, 'parts', partId, 'chapters', chapterId, 'sections', sectionId, 'blocks');
  const snapshot = await getDocs(query(blocksRef, orderBy('sortKey')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Block));
}