export type Book = {
  id: string;
  uid: string;
  title: string;
  summary?: string;
  status: "draft" | "published" | "archived";
  sortKey: number;
  createdAt: any;
  updatedAt: any;
};

export type Part = {
  id: string;
  uid: string;
  bookId: string;
  title: string;
  summary?: string;
  sortKey: number;
  createdAt: any;
  updatedAt: any;
};

export type Chapter = {
  id: string;
  uid: string;
  bookId: string;
  partId: string;
  title: string;
  summary?: string;
  sortKey: number;
  markedForDeletion?: boolean;  // Flag to indicate chapter should be deleted after move verification
  createdAt: any;
  updatedAt: any;
};

export type Section = {
  id: string;
  uid: string;
  bookId: string;
  partId: string;
  chapterId: string;
  title: string;
  summary?: string;  // Brief summary for chapter view
  content?: string;  // Full content for section editing
  sortKey: number;
  createdAt: any;
  updatedAt: any;
};

export type Block = {
  id: string;
  uid: string;
  bookId: string;
  partId: string;
  chapterId: string;
  sectionId: string;
  text: string;         // plain text or markdown
  summary?: string;     // short blurb, optional
  sortKey: number;
  createdAt: any;
  updatedAt: any;
};

export type Note = {
  id: string;
  uid: string;
  // Parent entity information - at least one must be set
  bookId?: string;
  partId?: string;
  chapterId?: string;
  sectionId?: string;
  // Note content
  title: string;
  content: string;
  // Tags for categorization (optional)
  tags?: string[];
  // Priority level
  priority: 'low' | 'medium' | 'high';
  // Whether the note is archived
  archived: boolean;
  sortKey: number;
  createdAt: Date | { seconds: number; nanoseconds: number };
  updatedAt: Date | { seconds: number; nanoseconds: number };
};