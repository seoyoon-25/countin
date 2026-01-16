'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard,
  FileText,
  Sparkles,
  TrendingUp,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
} from '@countin/ui';

interface UsageData {
  documents: { used: number; limit: number };
  transactions: { used: number; limit: number };
  aiUsage: { used: number; limit: number };
  users: { used: number; limit: number };
}

const PLANS = [
  { id: 'FREE', name: '무료', price: 0 },
  { id: 'LIGHT', name: '라이트', price: 9900 },
  { id: 'STANDARD', name: '스탠다드', price: 29900 },
  { id: 'PRO', name: '프로', price: 59900 },
];

const PLAN_LIMITS: Record<string, UsageData> = {
  FREE: {
    documents: { used: 0, limit: 3 },
    transactions: { used: 0, limit: 50 },
    aiUsage: { used: 0, limit: 3 },
    users: { used: 0, limit: 1 },
  },
  LIGHT: {
    documents: { used: 0, limit: 20 },
    transactions: { used: 0, limit: 500 },
    aiUsage: { used: 0, limit: 30 },
    users: { used: 0, limit: 3 },
  },
  STANDARD: {
    documents: { used: 0, limit: -1 },
    transactions: { used: 0, limit: -1 },
    aiUsage: { used: 0, limit: 100 },
    users: { used: 0, limit: 10 },
  },
  PRO: {
    documents: { used: 0, limit: -1 },
    transactions: { used: 0, limit: -1 },
    aiUsage: { used: 0, limit: -1 },
    users: { used: 0, limit: -1 },
  },
};

function formatLimit(limit: number): string {
  return limit === -1 ? '무제한' : limit.toString();
}

function getUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('FREE');
  const [usage, setUsage] = useState<UsageData>(PLAN_LIMITS.FREE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        // Fetch tenant info and usage
        const [tenantRes, docsRes, txRes] = await Promise.all([
          fetch('/api/tenant'),
          fetch('/api/documents'),
          fetch('/api/transactions?limit=1'),
        ]);

        const tenantData = await tenantRes.json();
        const docsData = await docsRes.json();

        if (tenantData.success) {
          const plan = tenantData.data?.plan || 'FREE';
          setCurrentPlan(plan);

          // Update usage based on actual data
          const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
          setUsage({
            documents: {
              used: docsData.success ? docsData.data?.length || 0 : 0,
              limit: planLimits.documents.limit,
            },
            transactions: {
              used: 0, // Would need to implement counting
              limit: planLimits.transactions.limit,
            },
            aiUsage: {
              used: 0, // Would need to track AI usage
              limit: planLimits.aiUsage.limit,
            },
            users: {
              used: 1, // Would need to count actual users
              limit: planLimits.users.limit,
            },
          });
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const currentPlanInfo = PLANS.find((p) => p.id === currentPlan) || PLANS[0];
  const nextPlan = PLANS[PLANS.findIndex((p) => p.id === currentPlan) + 1];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">요금제 및 결제</h1>
        <p className="text-slate-500 mt-1">현재 플랜과 사용량을 확인하세요</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {currentPlanInfo.name} 플랜
                  </h2>
                  {currentPlan === 'FREE' && (
                    <Badge variant="outline" className="bg-slate-100">무료</Badge>
                  )}
                  {currentPlan !== 'FREE' && (
                    <Badge className="bg-primary-100 text-primary-700">활성</Badge>
                  )}
                </div>
                <p className="text-slate-500 mt-1">
                  {currentPlanInfo.price === 0
                    ? '무료로 이용 중'
                    : `월 ₩${currentPlanInfo.price.toLocaleString()}`}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {nextPlan && (
                <Link href="/pricing">
                  <Button>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {nextPlan.name}으로 업그레이드
                  </Button>
                </Link>
              )}
              {currentPlan !== 'FREE' && (
                <Button variant="outline">플랜 변경</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">문서</span>
                </div>
                <span className="text-sm text-slate-500">
                  {usage.documents.used} / {formatLimit(usage.documents.limit)}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(usage.documents.used, usage.documents.limit)}
                className="h-2"
              />
              {usage.documents.limit !== -1 &&
                getUsagePercentage(usage.documents.used, usage.documents.limit) >= 80 && (
                  <p className="text-xs text-amber-600 mt-2">한도에 가까워지고 있습니다</p>
                )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">거래</span>
                </div>
                <span className="text-sm text-slate-500">
                  {usage.transactions.used} / {formatLimit(usage.transactions.limit)}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(usage.transactions.used, usage.transactions.limit)}
                className="h-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">AI 사용</span>
                </div>
                <span className="text-sm text-slate-500">
                  {usage.aiUsage.used} / {formatLimit(usage.aiUsage.limit)}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(usage.aiUsage.used, usage.aiUsage.limit)}
                className="h-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">사용자</span>
                </div>
                <span className="text-sm text-slate-500">
                  {usage.users.used} / {formatLimit(usage.users.limit)}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(usage.users.used, usage.users.limit)}
                className="h-2"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upgrade CTA for Free Plan */}
      {currentPlan === 'FREE' && (
        <Card className="bg-gradient-to-br from-primary-50 to-violet-50 border-primary-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  더 많은 기능이 필요하신가요?
                </h3>
                <p className="text-slate-600 mb-4">
                  유료 플랜으로 업그레이드하고 무제한 기능을 사용해보세요.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500" />
                    무제한 문서 및 거래
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500" />
                    고급 AI 기능
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500" />
                    PDF/Word 내보내기
                  </li>
                </ul>
              </div>
              <Link href="/pricing">
                <Button size="lg">
                  요금제 보기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>플랜 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left text-sm font-medium text-slate-500">
                    플랜
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-slate-500">
                    가격
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-slate-500">
                    문서
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-slate-500">
                    거래
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-slate-500">
                    AI
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium text-slate-500">
                    사용자
                  </th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((plan) => (
                  <tr
                    key={plan.id}
                    className={`border-b ${
                      plan.id === currentPlan ? 'bg-primary-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{plan.name}</span>
                        {plan.id === currentPlan && (
                          <Badge className="bg-primary-100 text-primary-700">현재</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-700">
                      {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}/월`}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-700">
                      {formatLimit(PLAN_LIMITS[plan.id].documents.limit)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-700">
                      {formatLimit(PLAN_LIMITS[plan.id].transactions.limit)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-700">
                      {formatLimit(PLAN_LIMITS[plan.id].aiUsage.limit)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-700">
                      {formatLimit(PLAN_LIMITS[plan.id].users.limit)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {plan.id !== currentPlan && (
                        <Button variant="outline" size="sm">
                          선택
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/pricing"
              className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              상세 기능 비교 보기
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
