'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@countin/ui';
import { formatCurrency } from '@countin/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface ReportData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeCount: number;
    expenseCount: number;
  };
  monthlyTrend: MonthlyData[];
}

export default function MonthlyReportPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
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
  }, [year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const params = new URLSearchParams({
      format,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      type: 'monthly',
    });
    window.open(`/api/export/reports?${params}`, '_blank');
  };

  // Prepare chart data with formatted month labels
  const chartData = data?.monthlyTrend.map((item) => ({
    ...item,
    name: item.month.slice(5) + '월',
    cumIncome: 0,
    cumExpense: 0,
  })) || [];

  // Calculate cumulative values
  let cumIncome = 0;
  let cumExpense = 0;
  chartData.forEach((item) => {
    cumIncome += item.income;
    cumExpense += item.expense;
    item.cumIncome = cumIncome;
    item.cumExpense = cumExpense;
  });

  // Calculate month-over-month changes
  const monthlyChanges = chartData.map((item, index) => {
    if (index === 0) {
      return { ...item, incomeChange: 0, expenseChange: 0 };
    }
    const prev = chartData[index - 1];
    return {
      ...item,
      incomeChange: prev.income > 0 ? Math.round(((item.income - prev.income) / prev.income) * 100) : 0,
      expenseChange: prev.expense > 0 ? Math.round(((item.expense - prev.expense) / prev.expense) * 100) : 0,
    };
  });

  // Calculate averages
  const avgIncome = chartData.length > 0 ? Math.round(chartData.reduce((sum, m) => sum + m.income, 0) / chartData.length) : 0;
  const avgExpense = chartData.length > 0 ? Math.round(chartData.reduce((sum, m) => sum + m.expense, 0) / chartData.length) : 0;

  // Find best/worst months
  const bestIncomeMonth = [...chartData].sort((a, b) => b.income - a.income)[0];
  const worstExpenseMonth = [...chartData].sort((a, b) => b.expense - a.expense)[0];

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

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
            <h1 className="text-2xl font-bold text-slate-900">월별 추이 보고서</h1>
            <p className="text-slate-500 mt-1">월별 수입/지출 추이를 분석합니다</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="space-y-1">
            <Label className="text-xs">연도</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>{y}년</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mt-5">
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">연간 총 수입</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(data.summary.totalIncome)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    월평균 {formatCurrency(avgIncome)}
                  </p>
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
                  <p className="text-sm text-slate-500">연간 총 지출</p>
                  <p className="text-2xl font-bold text-rose-600">
                    {formatCurrency(data.summary.totalExpense)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    월평균 {formatCurrency(avgExpense)}
                  </p>
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
                  <p className="text-sm text-slate-500">최고 수입 월</p>
                  {bestIncomeMonth ? (
                    <>
                      <p className="text-xl font-bold text-slate-900">{bestIncomeMonth.name}</p>
                      <p className="text-sm text-emerald-600">{formatCurrency(bestIncomeMonth.income)}</p>
                    </>
                  ) : (
                    <p className="text-slate-400">-</p>
                  )}
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
                  <p className="text-sm text-slate-500">최고 지출 월</p>
                  {worstExpenseMonth ? (
                    <>
                      <p className="text-xl font-bold text-slate-900">{worstExpenseMonth.name}</p>
                      <p className="text-sm text-rose-600">{formatCurrency(worstExpenseMonth.expense)}</p>
                    </>
                  ) : (
                    <p className="text-slate-400">-</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Monthly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>월별 수입/지출</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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

          {/* Balance Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>월별 잔액 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                    <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name="잔액"
                      fill="#93c5fd"
                      fillOpacity={0.3}
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cumulative Trend */}
          <Card>
            <CardHeader>
              <CardTitle>누적 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                    <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="cumIncome" name="누적 수입" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="cumExpense" name="누적 지출" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>월별 상세</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">월</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">수입</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">지출</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">잔액</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">수입 증감</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">지출 증감</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyChanges.map((item, index) => (
                      <tr key={item.name} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">
                          {formatCurrency(item.income)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600">
                          {formatCurrency(item.expense)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${item.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {formatCurrency(item.balance)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {index > 0 && (
                            <span className={`flex items-center justify-end gap-1 ${item.incomeChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.incomeChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(item.incomeChange)}%
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {index > 0 && (
                            <span className={`flex items-center justify-end gap-1 ${item.expenseChange <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.expenseChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(item.expenseChange)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">보고서 데이터를 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  );
}
