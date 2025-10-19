import SectionPage from '@/components/SectionPage';

interface SectionPageProps {
  params: Promise<{ bookId: string; partId: string; chapterId: string; sectionId: string }>;
}

export default async function Section({ params }: SectionPageProps) {
  const { bookId, partId, chapterId, sectionId } = await params;
  
  return (
    <SectionPage
      bookId={bookId}
      partId={partId}
      chapterId={chapterId}
      sectionId={sectionId}
    />
  );
}