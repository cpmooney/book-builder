import HierarchicalEntityPage from '../../../../../../../components/HierarchicalEntityPage';

interface ChapterPageProps {
  params: Promise<{ bookId: string; partId: string; chapterId: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { bookId, partId, chapterId } = await params;
  
  return (
    <HierarchicalEntityPage
      config={{
        level: 'chapter',
        entityId: chapterId,
        parentIds: {
          bookId: bookId,
          partId: partId
        }
      }}
    />
  );
}