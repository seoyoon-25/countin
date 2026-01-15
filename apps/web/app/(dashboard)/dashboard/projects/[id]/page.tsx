import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProjectDetail } from './project-detail';

export const metadata: Metadata = {
  title: '프로젝트 상세 - CountIn',
  description: '프로젝트 상세 정보를 확인하세요',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  return <ProjectDetail projectId={id} />;
}
