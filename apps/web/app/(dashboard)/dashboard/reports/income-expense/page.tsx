'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
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
  Tabs,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@countin/ui';
import { formatCurrency } from '@countin/utils';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ReportData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeCount: number;
    expenseCount: number;
  };
  income: Array<{
    account: { id: string; code: string; name: string; type: string };
    amount: number;
    count: number;
  }>;
  expense: Array<{
    account: { id: string; code: string; name: string; type: string };
    amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

const INCOME_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
const EXPENSE_COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'];

const PERIOD_OPTIONS = [
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '이번 분기' },
  { value: 'year', label: '올해' },
  { value: 'custom', label: '직접 선택' },
];

function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'month':
      return {
        startDate: new Date(year, month, 1).toISOString().split('T')[0],
        endDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
      };
    case 'quarter':
      const quarterStart = Math.floor(month / 3) * 3;
      return {
        startDate: new Date(year, quarterStart, 1).toISOString().split('T')[0],
        endDate: new Date(year, quarterStart + 3, 0).toISOString().split('T')[0],
      };
    case 'year':
      return {
        startDate: new Date(year, 0, 1).toISOString().split('T')[0],
        endDate: new Date(year, 11, 31).toISOString().split('T')[0],
      };
    default:
      return {
        startDate: new Date(year, 0, 1).toISOString().split('T')[0],
        endDate: new Date(year, 11, 31).toISOString().split('T')[0],
      };
  }
}

export default function IncomeExpenseReportPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (period !== 'custom') {
      const range = getDateRange(period);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }, [period]);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/reports/income-expense?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const params = new URLSearchParams({
      format,
      startDate,
      endDate,
      type: 'income-expense',
    });
    window.open(`/api/export/reports?${params}`, '_blank');
  };

  // Prepare pie chart data
  const incomePieData = data?.income.slice(0, 5).map((item) => ({
    name: item.account.name,
    value: item.amount,
  })) || [];

  const expensePieData = data?.expense.slice(0, 5).map((item) => ({
    name: item.account.name,
    value: item.amount,
  })) || [];

  // Format month labels
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
            <h1 className="text-2xl font-bold text-slate-900">수입지출 보고서</h1>
            <p className="text-slate-500 mt-1">기간별 수입과 지출 현황</p>
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

      {/* Period Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Tabs value={period} onValueChange={setPeriod}>
                <TabsList>
                  {PERIOD_OPTIONS.map((opt) => (
                    <TabsTrigger key={opt.value} value={opt.value}>
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {period === 'custom' && (
              <div className="flex gap-4">
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
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(data.summary.totalIncome)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {data.summary.incomeCount}건
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
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
                      <p className="text-sm text-slate-500">총 지출</p>
                      <p className="text-2xl font-bold text-rose-600">
                        {formatCurrency(data.summary.totalExpense)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {data.summary.expenseCount}건
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-rose-600" />
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
                      <p className="text-sm text-slate-500">잔액</p>
                      <p className={`text-2xl font-bold ${data.summary.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {formatCurrency(data.summary.balance)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        수입 - 지출
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.summary.balance >= 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
                      <Calendar className={`w-6 h-6 ${data.summary.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  수입 구성
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incomePieData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {incomePieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    데이터가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                  지출 구성
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expensePieData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expensePieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    데이터가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          {trendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>월별 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
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

          {/* Detail Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Table */}
            <Card>
              <CardHeader>
                <CardTitle>수입 내역</CardTitle>
              </CardHeader>
              <CardContent>
                {data.income.length > 0 ? (
                  <div className="space-y-2">
                    {data.income.map((item) => (
                      <div
                        key={item.account.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{item.account.name}</p>
                          <p className="text-xs text-slate-500">{item.account.code} | {item.count}건</p>
                        </div>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">수입 내역이 없습니다</p>
                )}
              </CardContent>
            </Card>

            {/* Expense Table */}
            <Card>
              <CardHeader>
                <CardTitle>지출 내역</CardTitle>
              </CardHeader>
              <CardContent>
                {data.expense.length > 0 ? (
                  <div className="space-y-2">
                    {data.expense.map((item) => (
                      <div
                        key={item.account.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{item.account.name}</p>
                          <p className="text-xs text-slate-500">{item.account.code} | {item.count}건</p>
                        </div>
                        <p className="font-semibold text-rose-600">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">지출 내역이 없습니다</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500">보고서 데이터를 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  );
}
