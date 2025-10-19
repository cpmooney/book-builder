import HierarchicalEntityPage from '../../../components/HierarchicalEntityPage';

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { bookId } = await params;
  
  return (
    <HierarchicalEntityPage
      config={{
        level: 'book',
        entityId: bookId,
        parentIds: {}
      }}
    />
  );
}