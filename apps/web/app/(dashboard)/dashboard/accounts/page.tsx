import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AccountsList } from './components/accounts-list';

export const metadata: Metadata = {
  title: '계정과목 - CountIn',
  description: '계정과목을 관리하세요',
};

export default async function AccountsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">계정과목</h1>
        <p className="text-slate-500 mt-1">
          수입과 지출을 분류하기 위한 계정과목을 관리합니다
        </p>
      </div>

      <AccountsList />
    </div>
  );
}
