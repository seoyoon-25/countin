'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Target,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Project {
  id: string;
  name: string;
}

interface ReportData {
  project: {
    id: string;
    name: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  };
  budget: {
    id: string;
    name: string;
    totalPlanned: number;
    plannedIncome: number;
    plannedExpense: number;
    incomeExecutionRate: number;
    expenseExecutionRate: number;
  } | null;
  byAccount: Array<{
    account: { id: string; code: string; name: string; type: string };
    income: number;
    expense: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    amount: number;
    account: { name: string };
  }>;
}

export default function ProjectReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default dates (current year)
  useEffect(() => {
    const now = new Date();
    setStartDate(`${now.getFullYear()}-01-01`);
    setEndDate(`${now.getFullYear()}-12-31`);
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const result = await response.json();
        if (result.success) {
          setProjects(result.data);
          if (result.data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(result.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!selectedProjectId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/reports/project/${selectedProjectId}?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const params = new URLSearchParams({
      format,
      startDate,
      endDate,
      type: 'project',
      projectId: selectedProjectId,
    });
    window.open(`/api/export/reports?${params}`, '_blank');
  };

  const trendData = data?.monthlyTrend.map((item) => ({
    ...item,
    name: item.month.slice(5) + '월',
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            보고서
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">프로젝트별 보고서</h1>
            <p className="text-slate-500 mt-1">프로젝트별 수입/지출 및 예산 집행 현황</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className="w-4 h-4 mr-2" />
              CSV (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              PDF (.pdf)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">프로젝트</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">시작일</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료일</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">등록된 프로젝트가 없습니다</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/projects')}
          >
            프로젝트 추가하기
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Project Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">{data.project.name}</h2>
                    <Badge variant={data.project.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {data.project.status === 'ACTIVE' ? '진행중' : data.project.status === 'COMPLETED' ? '완료' : '대기'}
                    </Badge>
                  </div>
                  {data.project.description && (
                    <p className="text-slate-500 mt-1">{data.project.description}</p>
                  )}
                  {(data.project.startDate || data.project.endDate) && (
                    <p className="text-sm text-slate-400 mt-2">
                      {data.project.startDate ? formatDate(new Date(data.project.startDate)) : '미정'}
                      {' ~ '}
                      {data.project.endDate ? formatDate(new Date(data.project.endDate)) : '미정'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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
                      <p className="text-sm text-slate-500">총 수입</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {formatCurrency(data.summary.totalIncome)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-200" />
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
                      <p className="text-sm text-slate-500">총 지출</p>
                      <p className="text-xl font-bold text-rose-600">
                        {formatCurrency(data.summary.totalExpense)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-rose-200" />
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
                      <p className="text-sm text-slate-500">잔액</p>
                      <p className={`text-xl font-bold ${data.summary.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {formatCurrency(data.summary.balance)}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-200" />
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
                      <p className="text-sm text-slate-500">거래 수</p>
                      <p className="text-xl font-bold text-slate-900">
                        {data.summary.transactionCount}건
                      </p>
                    </div>
                    <FolderKanban className="w-8 h-8 text-slate-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Budget vs Actual */}
          {data.budget && (
            <Card>
              <CardHeader>
                <CardTitle>예산 대비 실적</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">수입 집행률</span>
                        <span className="font-medium">{data.budget.incomeExecutionRate}%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, data.budget.incomeExecutionRate)}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>실제: {formatCurrency(data.summary.totalIncome)}</span>
                        <span>계획: {formatCurrency(data.budget.plannedIncome)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">지출 집행률</span>
                        <span className="font-medium">{data.budget.expenseExecutionRate}%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, data.budget.expenseExecutionRate)}%` }}
                          className={`h-full rounded-full ${data.budget.expenseExecutionRate >= 100 ? 'bg-rose-500' : data.budget.expenseExecutionRate >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>실제: {formatCurrency(data.summary.totalExpense)}</span>
                        <span>계획: {formatCurrency(data.budget.plannedExpense)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">예산 정보</p>
                    <p className="font-medium text-slate-900">{data.budget.name}</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">
                      {formatCurrency(data.budget.totalPlanned)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Trend */}
          {trendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>월별 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                      <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="income" name="수입" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="지출" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          {data.recentTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>최근 거래</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <p className="font-medium text-slate-900">{tx.description}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(new Date(tx.date))} | {tx.account.name}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
