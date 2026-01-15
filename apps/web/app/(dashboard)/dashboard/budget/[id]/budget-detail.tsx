'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  FileText,
  CheckCircle2,
  Archive,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@countin/ui';
import { formatCurrency } from '@countin/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DeleteConfirmDialog } from '../components/delete-confirm-dialog';
import { CopyBudgetModal } from '../components/copy-budget-modal';

interface BudgetItem {
  id: string;
  accountId: string | null;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  difference: number;
  executionRate: number;
  description: string | null;
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
  } | null;
}

interface Budget {
  id: string;
  name: string;
  year: number;
  status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  project: {
    id: string;
    name: string;
  } | null;
  items: BudgetItem[];
  summary: {
    totalPlanned: number;
    totalActual: number;
    totalDifference: number;
    executionRate: number;
    income: {
      planned: number;
      actual: number;
    };
    expense: {
      planned: number;
      actual: number;
    };
  };
  createdAt: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <FileText className="w-4 h-4" />;
    case 'APPROVED':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'ARCHIVED':
      return <Archive className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'ARCHIVED':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return '초안';
    case 'APPROVED':
      return '승인됨';
    case 'ARCHIVED':
      return '보관됨';
    default:
      return status;
  }
};

const getCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    'INCOME_운영수입': '운영수입',
    'INCOME_사업수입': '사업수입',
    'INCOME_기부금': '기부금',
    'INCOME_보조금': '보조금',
    'INCOME_기타수입': '기타수입',
    'EXPENSE_인건비': '인건비',
    'EXPENSE_운영비': '운영비',
    'EXPENSE_사업비': '사업비',
    'EXPENSE_시설관리비': '시설관리비',
    'EXPENSE_기타지출': '기타지출',
  };
  return map[category] || category;
};

const getProgressColor = (rate: number) => {
  if (rate >= 100) return 'bg-rose-500';
  if (rate >= 80) return 'bg-amber-500';
  return 'bg-emerald-500';
};

export function BudgetDetail() {
  const params = useParams();
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [viewTab, setViewTab] = useState('overview');

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const response = await fetch(`/api/budgets/${params.id}`);
        const data = await response.json();

        if (data.success) {
          setBudget(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch budget:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchBudget();
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!budget) return;

    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard/budget');
      } else {
        alert(data.error?.message || '삭제에 실패했습니다');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다');
    }
  };

  const handleCopySuccess = () => {
    setShowCopyModal(false);
    router.push('/dashboard/budget');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">예산을 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const incomeItems = budget.items.filter((item) => item.category?.startsWith('INCOME'));
  const expenseItems = budget.items.filter((item) => item.category?.startsWith('EXPENSE'));

  const chartData = budget.items.map((item) => ({
    name: getCategoryLabel(item.category),
    계획: item.plannedAmount,
    실제: item.actualAmount,
  }));

  const summaryChartData = [
    {
      name: '수입',
      계획: budget.summary.income.planned,
      실제: budget.summary.income.actual,
    },
    {
      name: '지출',
      계획: budget.summary.expense.planned,
      실제: budget.summary.expense.actual,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{budget.name}</h1>
              <Badge variant="outline" className={getStatusColor(budget.status)}>
                {getStatusIcon(budget.status)}
                <span className="ml-1">{getStatusLabel(budget.status)}</span>
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              {budget.year}년 {budget.project ? `| ${budget.project.name}` : '| 전체 조직'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCopyModal(true)}>
            <Copy className="w-4 h-4 mr-2" />
            복사
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/budget/${budget.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            수정
          </Button>
          <Button variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">총 계획</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(budget.summary.totalPlanned)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">총 실적</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(budget.summary.totalActual)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">차이</p>
                  <p className={`text-2xl font-bold ${budget.summary.totalDifference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(budget.summary.totalDifference)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${budget.summary.totalDifference >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  {budget.summary.totalDifference >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-rose-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">집행률</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {budget.summary.executionRate}%
                  </p>
                </div>
                <div className="w-12 h-12 relative">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={budget.summary.executionRate >= 100 ? '#ef4444' : budget.summary.executionRate >= 80 ? '#f59e0b' : '#10b981'}
                      strokeWidth="4"
                      strokeDasharray={`${(budget.summary.executionRate / 100) * 125.6} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={viewTab} onValueChange={setViewTab}>
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="income">수입</TabsTrigger>
          <TabsTrigger value="expense">지출</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Summary Chart */}
          <Card>
            <CardHeader>
              <CardTitle>수입/지출 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryChartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                    <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="계획" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="실제" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* All Items Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>항목별 계획 vs 실제</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#64748b' }} width={100} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="계획" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="실제" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                수입 항목
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeItems.length === 0 ? (
                <p className="text-center text-slate-500 py-8">수입 항목이 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {incomeItems.map((item) => (
                    <div key={item.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-900">{getCategoryLabel(item.category)}</h4>
                          {item.account && (
                            <p className="text-sm text-slate-500">{item.account.code} - {item.account.name}</p>
                          )}
                        </div>
                        <Badge variant={item.executionRate >= 100 ? 'default' : 'secondary'}>
                          {item.executionRate}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-slate-500">계획</p>
                          <p className="font-semibold">{formatCurrency(item.plannedAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">실제</p>
                          <p className="font-semibold text-emerald-600">{formatCurrency(item.actualAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">차이</p>
                          <p className={`font-semibold ${item.difference >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                            {formatCurrency(item.difference)}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, item.executionRate)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${getProgressColor(item.executionRate)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                지출 항목
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseItems.length === 0 ? (
                <p className="text-center text-slate-500 py-8">지출 항목이 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {expenseItems.map((item) => (
                    <div key={item.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-900">{getCategoryLabel(item.category)}</h4>
                          {item.account && (
                            <p className="text-sm text-slate-500">{item.account.code} - {item.account.name}</p>
                          )}
                        </div>
                        <Badge variant={item.executionRate >= 100 ? 'error' : item.executionRate >= 80 ? 'default' : 'secondary'}>
                          {item.executionRate}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-slate-500">계획</p>
                          <p className="font-semibold">{formatCurrency(item.plannedAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">실제</p>
                          <p className="font-semibold text-rose-600">{formatCurrency(item.actualAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">잔액</p>
                          <p className={`font-semibold ${item.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(item.difference)}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, item.executionRate)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${getProgressColor(item.executionRate)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="예산 삭제"
        description={`"${budget.name}" 예산을 삭제하시겠습니까? 모든 예산 항목도 함께 삭제됩니다.`}
      />

      {/* Copy Modal */}
      <CopyBudgetModal
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onSuccess={handleCopySuccess}
        budget={budget}
      />
    </div>
  );
}
