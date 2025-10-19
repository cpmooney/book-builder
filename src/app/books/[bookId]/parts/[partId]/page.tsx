import HierarchicalEntityPage from '../../../../../components/HierarchicalEntityPage';

interface PartPageProps {
  params: Promise<{ bookId: string; partId: string }>;
}

export default async function PartPage({ params }: PartPageProps) {
  const { bookId, partId } = await params;
  
  return (
    <HierarchicalEntityPage
      config={{
        level: 'part',
        entityId: partId,
        parentIds: {
          bookId: bookId
        }
      }}
    />
  );
}