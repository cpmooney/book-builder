# Book Builder

A Next.js 15 + TypeScript application for building and organizing books with a nested Firestore structure.

## Setup

1. Install dependencies:
```bash
npm install firebase
```

2. Set up Firebase:
   - Create a new Firebase project
   - Enable Firestore Database
   - Copy `.env.local.example` to `.env.local` and add your Firebase config

3. Deploy Firestore rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

4. Run the development server:
```bash
npm run dev
```

## Features

- Nested book structure: Books → Parts → Chapters → Sections → Blocks
- Simple editing interface
- Owner-only access with Firestore security rules
- TypeScript types and data functions
- React hooks for real-time updates

## Structure

- `/src/lib/` - Firebase config and utilities
- `/src/types/` - TypeScript type definitions
- `/src/features/books/` - Book-related data functions and hooks
- `/src/components/` - React components
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes

## Current Status

This is a basic functional frontend with mock data. To make it fully functional:

1. Add Firebase to package.json: `npm install firebase`
2. Configure your Firebase project in `.env.local`
3. Replace mock data in components with actual Firestore calls
4. Add authentication
# book-builder
