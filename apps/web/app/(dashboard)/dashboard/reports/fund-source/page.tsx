'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Wallet,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface FundSource {
  id: string;
  name: string;
  type: string;
}

interface ReportData {
  fundSource: {
    id: string;
    name: string;
    type: string;
    grantor: string | null;
    totalAmount: number;
    usedAmount: number;
    remainingAmount: number;
    usageRate: number;
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalUsedInPeriod: number;
    transactionCount: number;
    averageTransaction: number;
  };
  byProject: Array<{
    project: { id: string; name: string };
    amount: number;
    count: number;
  }>;
  byAccount: Array<{
    account: { id: string; code: string; name: string; type: string };
    amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
  balanceTrend: Array<{
    month: string;
    used: number;
    balance: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    amount: number;
    account: { name: string };
    project: { name: string } | null;
  }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    GOVERNMENT: '정부지원금',
    CORPORATE: '기업후원',
    FOUNDATION: '재단',
    DONATION: '개인기부',
    SELF: '자부담',
    OTHER: '기타',
  };
  return map[type] || type;
};

export default function FundSourceReportPage() {
  const router = useRouter();
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [selectedFundSourceId, setSelectedFundSourceId] = useState<string>('');
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

  // Fetch fund sources
  useEffect(() => {
    const fetchFundSources = async () => {
      try {
        const response = await fetch('/api/fund-sources');
        const result = await response.json();
        if (result.success) {
          setFundSources(result.data);
          if (result.data.length > 0 && !selectedFundSourceId) {
            setSelectedFundSourceId(result.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch fund sources:', error);
      }
    };
    fetchFundSources();
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!selectedFundSourceId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/reports/fund-source/${selectedFundSourceId}?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFundSourceId, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    const params = new URLSearchParams({
      format,
      startDate,
      endDate,
      type: 'fund-source',
      fundSourceId: selectedFundSourceId,
    });
    window.open(`/api/export/reports?${params}`, '_blank');
  };

  const trendData = data?.balanceTrend.map((item) => ({
    ...item,
    name: item.month.slice(5) + '월',
  })) || [];

  const projectPieData = data?.byProject.map((item) => ({
    name: item.project.name,
    value: item.amount,
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
            <h1 className="text-2xl font-bold text-slate-900">재원별 보고서</h1>
            <p className="text-slate-500 mt-1">재원별 사용 내역 및 잔액 현황</p>
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
              <Label className="text-xs">재원</Label>
              <Select value={selectedFundSourceId} onValueChange={setSelectedFundSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="재원 선택" />
                </SelectTrigger>
                <SelectContent>
                  {fundSources.map((fs) => (
                    <SelectItem key={fs.id} value={fs.id}>
                      {fs.name}
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

      {fundSources.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">등록된 재원이 없습니다</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/fund-sources')}
          >
            재원 추가하기
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
          {/* Fund Source Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">{data.fundSource.name}</h2>
                    <Badge variant="outline">{getTypeLabel(data.fundSource.type)}</Badge>
                  </div>
                  {data.fundSource.grantor && (
                    <p className="text-slate-500 mt-1">지원기관: {data.fundSource.grantor}</p>
                  )}
                  {(data.fundSource.startDate || data.fundSource.endDate) && (
                    <p className="text-sm text-slate-400 mt-2">
                      {data.fundSource.startDate ? formatDate(new Date(data.fundSource.startDate)) : '미정'}
                      {' ~ '}
                      {data.fundSource.endDate ? formatDate(new Date(data.fundSource.endDate)) : '미정'}
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
                      <p className="text-sm text-slate-500">총 지원금</p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(data.fundSource.totalAmount)}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-slate-200" />
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
                      <p className="text-sm text-slate-500">사용금액</p>
                      <p className="text-xl font-bold text-rose-600">
                        {formatCurrency(data.fundSource.usedAmount)}
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
                      <p className={`text-xl font-bold ${data.fundSource.remainingAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(data.fundSource.remainingAmount)}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-emerald-200" />
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
                  <div>
                    <p className="text-sm text-slate-500">사용률</p>
                    <p className="text-xl font-bold text-slate-900">
                      {data.fundSource.usageRate}%
                    </p>
                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, data.fundSource.usageRate)}%` }}
                        className={`h-full rounded-full ${data.fundSource.usageRate >= 100 ? 'bg-rose-500' : data.fundSource.usageRate >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Trend */}
            {trendData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>잔액 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                        <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          name="잔액"
                          stroke="#3b82f6"
                          fill="#93c5fd"
                          fillOpacity={0.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage by Project */}
            {projectPieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트별 사용</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {projectPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Usage by Account */}
          {data.byAccount.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>계정과목별 사용</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.byAccount.map((item) => (
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
                      <div>
                        <p className="font-medium text-slate-900">{tx.description}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(new Date(tx.date))} | {tx.account.name}
                          {tx.project && ` | ${tx.project.name}`}
                        </p>
                      </div>
                      <p className="font-semibold text-rose-600">
                        -{formatCurrency(tx.amount)}
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
