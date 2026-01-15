import { FundSourceDetail } from './fund-source-detail';

interface FundSourcePageProps {
  params: Promise<{ id: string }>;
}

export default async function FundSourcePage({ params }: FundSourcePageProps) {
  const { id } = await params;
  return <FundSourceDetail fundSourceId={id} />;
}
