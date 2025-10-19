import HierarchicalEntityPage from '@/components/HierarchicalEntityPage';

export default async function SectionPage({
  params
}: {
  params: Promise<{ bookId: string; partId: string; chapterId: string; sectionId: string }>
}) {
  const { bookId, partId, chapterId, sectionId } = await params;

  return (
    <HierarchicalEntityPage
      config={{
        level: 'section',
        entityId: sectionId,
        parentIds: {
          bookId,
          partId,
          chapterId,
          sectionId
        }
      }}
    />
  );
}