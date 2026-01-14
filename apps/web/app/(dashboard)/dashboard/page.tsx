import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@countin/ui';
import { formatCurrency } from '@countin/utils';

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

  // Mock data for dashboard
  const stats = [
    {
      title: '이번 달 수입',
      value: 12500000,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: '이번 달 지출',
      value: 8750000,
      change: '-5.2%',
      changeType: 'negative' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: '잔액',
      value: 45230000,
      change: '+8.1%',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: '진행 중인 프로젝트',
      value: 5,
      isCount: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <p className="text-slate-500 mt-1">회계 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-xl ${
                  stat.changeType === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                  stat.changeType === 'negative' ? 'bg-rose-100 text-rose-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {stat.icon}
                </div>
                {stat.change && (
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {stat.isCount ? stat.value : formatCurrency(stat.value)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>최근 거래</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>아직 등록된 거래가 없습니다</p>
              <a
                href="/dashboard/transactions/new"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                첫 거래 등록하기 →
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: '수입 등록', href: '/dashboard/transactions/new?type=income', icon: '💰' },
                { name: '지출 등록', href: '/dashboard/transactions/new?type=expense', icon: '💳' },
                { name: '문서 작성', href: '/dashboard/documents/new', icon: '📄' },
                { name: '보고서 생성', href: '/dashboard/reports', icon: '📊' },
              ].map((action) => (
                <a
                  key={action.name}
                  href={action.href}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="font-medium text-slate-700">{action.name}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
