/**
 * Migration script to move data from default Firestore database to book-builder database
 * 
 * USAGE:
 * npx tsx migration/move-to-book-builder.ts <userId> [options]
 * 
 * Example:
 * npx tsx migration/move-to-book-builder.ts your-user-id --dry-run
 * npx tsx migration/move-to-book-builder.ts your-user-id
 * 
 * Options:
 * --dry-run    : Preview what would be migrated without actually copying
 */

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

interface MigrationStats {
  books: number;
  parts: number;
  chapters: number;
  sections: number;
  blocks: number;
  notes: number;
  errors: string[];
}

// Parse service account from environment variable
let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local');
  process.exit(1);
}

// Remove surrounding quotes if present (happens when .env has quoted JSON)
if (serviceAccountJson.startsWith('"') && serviceAccountJson.endsWith('"')) {
  serviceAccountJson = serviceAccountJson.slice(1, -1);
}

// Replace literal newlines with escaped newlines for JSON parsing
// The private key in the env file has actual newline characters which are invalid in JSON
serviceAccountJson = serviceAccountJson.replaceAll('\n', '\\n').replaceAll('\r', '');

const serviceAccount = JSON.parse(serviceAccountJson);

// Now restore the actual newlines in the private key for Firebase Admin SDK
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replaceAll('\\n', '\n');
}

// Initialize Firebase Admin
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// Get references to both databases
const defaultDb = admin.firestore(app);
// For named databases, use getFirestore with the database ID
const bookBuilderDb = getFirestore(app, 'book-builder');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const USER_ID = process.argv.find(arg => 
  !arg.startsWith('--') && 
  !arg.includes('tsx') && 
  !arg.includes('ts-node') && 
  !arg.includes('.ts') &&
  !arg.includes('node')
);

/**
 * Copy a single document with all its data
 */
async function copyDocument(
  sourceRef: admin.firestore.DocumentReference,
  targetRef: admin.firestore.DocumentReference
): Promise<void> {
  const doc = await sourceRef.get();
  
  if (!doc.exists) {
    console.log(`⚠️  Document does not exist: ${sourceRef.path}`);
    return;
  }
  
  const data = doc.data();
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would copy: ${sourceRef.path}`);
    return;
  }
  
  await targetRef.set(data!);
  console.log(`✅ Copied: ${sourceRef.path}`);
}

/**
 * Copy a collection
 */
async function copyCollection(
  sourcePath: string,
  targetPath: string,
  stats: MigrationStats,
  collectionType: string
): Promise<void> {
  const sourceCollection = defaultDb.collection(sourcePath);
  const snapshot = await sourceCollection.get();
  
  if (snapshot.empty) {
    return;
  }
  
  for (const doc of snapshot.docs) {
    const sourceRef = defaultDb.doc(`${sourcePath}/${doc.id}`);
    const targetRef = bookBuilderDb.doc(`${targetPath}/${doc.id}`);
    
    try {
      await copyDocument(sourceRef, targetRef);
      
      // Track stats
      if (collectionType === 'notes') stats.notes++;
      
    } catch (error) {
      const errorMsg = `Error copying ${sourceRef.path}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }
}

/**
 * Recursively migrate all nested collections for a book
 */
async function migrateBook(userId: string, bookId: string, stats: MigrationStats): Promise<void> {
  const basePath = `users/${userId}/books/${bookId}`;
  
  console.log(`\n📚 Migrating book: ${bookId}`);
  
  // Copy book document
  await copyDocument(
    defaultDb.doc(basePath),
    bookBuilderDb.doc(basePath)
  );
  stats.books++;
  
  // Copy book-level notes
  await copyCollection(`${basePath}/notes`, `${basePath}/notes`, stats, 'notes');
  
  // Get all parts
  const partsSnapshot = await defaultDb.collection(`${basePath}/parts`).get();
  
  for (const partDoc of partsSnapshot.docs) {
    const partPath = `${basePath}/parts/${partDoc.id}`;
    
    console.log(`  📑 Migrating part: ${partDoc.id}`);
    
    // Copy part document
    await copyDocument(
      defaultDb.doc(partPath),
      bookBuilderDb.doc(partPath)
    );
    stats.parts++;
    
    // Copy part-level notes
    await copyCollection(`${partPath}/notes`, `${partPath}/notes`, stats, 'notes');
    
    // Get all chapters in this part
    const chaptersSnapshot = await defaultDb.collection(`${partPath}/chapters`).get();
    
    for (const chapterDoc of chaptersSnapshot.docs) {
      const chapterPath = `${partPath}/chapters/${chapterDoc.id}`;
      
      console.log(`    📄 Migrating chapter: ${chapterDoc.id}`);
      
      // Copy chapter document
      await copyDocument(
        defaultDb.doc(chapterPath),
        bookBuilderDb.doc(chapterPath)
      );
      stats.chapters++;
      
      // Copy chapter-level notes
      await copyCollection(`${chapterPath}/notes`, `${chapterPath}/notes`, stats, 'notes');
      
      // Get all sections in this chapter
      const sectionsSnapshot = await defaultDb.collection(`${chapterPath}/sections`).get();
      
      for (const sectionDoc of sectionsSnapshot.docs) {
        const sectionPath = `${chapterPath}/sections/${sectionDoc.id}`;
        
        console.log(`      📝 Migrating section: ${sectionDoc.id}`);
        
        // Copy section document
        await copyDocument(
          defaultDb.doc(sectionPath),
          bookBuilderDb.doc(sectionPath)
        );
        stats.sections++;
        
        // Copy section-level notes
        await copyCollection(`${sectionPath}/notes`, `${sectionPath}/notes`, stats, 'notes');
        
        // Copy all blocks in this section
        const blocksSnapshot = await defaultDb.collection(`${sectionPath}/blocks`).get();
        
        if (!blocksSnapshot.empty) {
          console.log(`        🧱 Migrating ${blocksSnapshot.size} blocks`);
          
          for (const blockDoc of blocksSnapshot.docs) {
            const blockPath = `${sectionPath}/blocks/${blockDoc.id}`;
            
            await copyDocument(
              defaultDb.doc(blockPath),
              bookBuilderDb.doc(blockPath)
            );
            stats.blocks++;
          }
        }
      }
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n🚀 Book Builder Data Migration Tool\n');
  console.log('='.repeat(50));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '🔴 LIVE MIGRATION'}`);
  console.log(`Project: ${serviceAccount.project_id}`);
  console.log(`Source: (default) database`);
  console.log(`Target: book-builder database`);
  console.log('='.repeat(50) + '\n');
  
  if (!USER_ID) {
    console.error('❌ Error: User ID is required');
    console.log('\nUsage: npx tsx migration/move-to-book-builder.ts <userId> [--dry-run]');
    console.log('\nExamples:');
    console.log('  npx tsx migration/move-to-book-builder.ts user123 --dry-run');
    console.log('  npx tsx migration/move-to-book-builder.ts user123');
    process.exit(1);
  }
  
  console.log(`User ID: ${USER_ID}\n`);
  
  const stats: MigrationStats = {
    books: 0,
    parts: 0,
    chapters: 0,
    sections: 0,
    blocks: 0,
    notes: 0,
    errors: []
  };
  
  try {
    // Get all books for the user
    const booksSnapshot = await defaultDb.collection(`users/${USER_ID}/books`).get();
    
    if (booksSnapshot.empty) {
      console.log(`📭 No books found for user ${USER_ID}`);
      process.exit(0);
    }
    
    console.log(`Found ${booksSnapshot.size} book(s) to migrate\n`);
    
    // Migrate each book
    for (const bookDoc of booksSnapshot.docs) {
      const bookData = bookDoc.data();
      console.log(`Book: "${bookData.title || bookDoc.id}"`);
      
      await migrateBook(USER_ID, bookDoc.id, stats);
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`Books:     ${stats.books}`);
    console.log(`Parts:     ${stats.parts}`);
    console.log(`Chapters:  ${stats.chapters}`);
    console.log(`Sections:  ${stats.sections}`);
    console.log(`Blocks:    ${stats.blocks}`);
    console.log(`Notes:     ${stats.notes}`);
    console.log(`Total:     ${stats.books + stats.parts + stats.chapters + stats.sections + stats.blocks + stats.notes}`);
    console.log(`Errors:    ${stats.errors.length}`);
    console.log('='.repeat(50));
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (DRY_RUN) {
      console.log('\n💡 This was a dry run. No changes were made.');
      console.log('   Run without --dry-run to perform actual migration.');
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('💡 Source data remains in the default database (not deleted).');
      console.log('   Verify the migrated data in book-builder database before removing old data.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await app.delete();
  }
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});