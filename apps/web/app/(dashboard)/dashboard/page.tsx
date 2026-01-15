import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@countin/ui';
import { DashboardContent } from './components/dashboard-content';

export default async function DashboardPage() {
  const session = await auth();
  const hasOrganization = !!(session as any)?.tenantId;

  if (!hasOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>조직을 생성해주세요</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 mb-4">
              CountIn을 사용하려면 먼저 조직을 생성해야 합니다.
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center h-10 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              조직 생성하기
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DashboardContent />;
}
