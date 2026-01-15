import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProjectsList } from './components/projects-list';

export const metadata: Metadata = {
  title: '프로젝트 - CountIn',
  description: '프로젝트를 관리하세요',
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">프로젝트</h1>
        <p className="text-slate-500 mt-1">
          사업과 프로젝트를 관리하고 예산 집행 현황을 확인합니다
        </p>
      </div>

      <ProjectsList />
    </div>
  );
}
