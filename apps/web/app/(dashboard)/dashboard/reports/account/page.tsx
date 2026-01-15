'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AccountReport {
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  income: number;
  expense: number;
  transfer: number;
  net: number;
  transactionCount: number;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
}

interface ReportData {
  summary: {
    totalAccounts: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  accounts: AccountReport[];
  byType: Array<{
    type: string;
    totalIncome: number;
    totalExpense: number;
    net: number;
    accountCount: number;
  }>;
}

const ACCOUNT_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'ASSET', label: '자산' },
  { value: 'LIABILITY', label: '부채' },
  { value: 'EQUITY', label: '자본' },
  { value: 'INCOME', label: '수익' },
  { value: 'EXPENSE', label: '비용' },
];

const getTypeLabel = (type: string) => {
  const found = ACCOUNT_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};

export default function AccountReportPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default dates (current year)
  useEffect(() => {
    const now = new Date();
    setStartDate(`${now.getFullYear()}-01-01`);
    setEndDate(`${now.getFullYear()}-12-31`);
  }, []);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);

      const response = await fetch(`/api/reports/account?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, typeFilter]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [fetchReport, startDate, endDate]);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const params = new URLSearchParams({
      format,
      startDate,
      endDate,
      type: 'account',
    });
    if (typeFilter !== 'all') params.set('accountType', typeFilter);
    window.open(`/api/export/reports?${params}`, '_blank');
  };

  // Prepare chart data
  const chartData = data?.byType.map((item) => ({
    name: getTypeLabel(item.type),
    수입: item.totalIncome,
    지출: item.totalExpense,
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
            <h1 className="text-2xl font-bold text-slate-900">계정과목별 보고서</h1>
            <p className="text-slate-500 mt-1">계정과목별 거래 현황 및 추이</p>
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
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {ACCOUNT_TYPES.map((type) => (
                    <TabsTrigger key={type.value} value={type.value}>
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
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
                      <p className="text-sm text-slate-500">총 계정과목</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {data.summary.totalAccounts}개
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-slate-200" />
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
                      <p className="text-sm text-slate-500">총 수입</p>
                      <p className="text-2xl font-bold text-emerald-600">
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
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">총 지출</p>
                      <p className="text-2xl font-bold text-rose-600">
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
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">잔액</p>
                      <p className={`text-2xl font-bold ${data.summary.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {formatCurrency(data.summary.balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Chart by Type */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>유형별 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                      <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="수입" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="지출" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>계정과목별 상세</CardTitle>
            </CardHeader>
            <CardContent>
              {data.accounts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">코드</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">계정과목</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">유형</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">수입</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">지출</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">순액</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">거래수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.accounts.map((item) => (
                        <tr key={item.account.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-600">{item.account.code}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{item.account.name}</td>
                          <td className="py-3 px-4 text-slate-600">{getTypeLabel(item.account.type)}</td>
                          <td className="py-3 px-4 text-right text-emerald-600">
                            {item.income > 0 ? formatCurrency(item.income) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600">
                            {item.expense > 0 ? formatCurrency(item.expense) : '-'}
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${item.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(item.net)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">{item.transactionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">해당 기간에 거래가 없습니다</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500">보고서 데이터를 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  );
}
