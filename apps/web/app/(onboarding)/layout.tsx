import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // If user already has a tenant, redirect to dashboard
  if ((session as any).tenantId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary-600">CountIn</h1>
          <p className="text-slate-500 mt-1">조직 설정을 완료해주세요</p>
        </div>
        {children}
      </div>
    </div>
  );
}
