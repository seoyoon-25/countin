import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TransactionsList } from './components/transactions-list';

export default async function TransactionsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const hasOrganization = !!(session as any)?.tenantId;

  if (!hasOrganization) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">거래 내역</h1>
        <p className="text-slate-500 mt-1">수입과 지출을 관리하세요</p>
      </div>

      <TransactionsList />
    </div>
  );
}
