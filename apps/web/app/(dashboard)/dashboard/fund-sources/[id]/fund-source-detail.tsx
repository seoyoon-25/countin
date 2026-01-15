'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Landmark,
  Heart,
  Wallet,
  HelpCircle,
  Edit,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';
import { FundSourceModal } from '../components/fund-source-modal';

interface Account {
  id: string;
  code: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description: string;
  memo?: string;
  account: Account;
  project?: Project;
}

interface FundSource {
  id: string;
  name: string;
  type: string;
  grantor: string | null;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  usageRate: number;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  transactions: Transaction[];
  _count: {
    transactions: number;
  };
}

interface FundSourceDetailProps {
  fundSourceId: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'GOVERNMENT':
      return <Landmark className="w-5 h-5" />;
    case 'CORPORATE':
      return <Building2 className="w-5 h-5" />;
    case 'FOUNDATION':
      return <Building2 className="w-5 h-5" />;
    case 'DONATION':
      return <Heart className="w-5 h-5" />;
    case 'SELF':
      return <Wallet className="w-5 h-5" />;
    default:
      return <HelpCircle className="w-5 h-5" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'GOVERNMENT':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'CORPORATE':
      return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'FOUNDATION':
      return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    case 'DONATION':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'SELF':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    GOVERNMENT: '정부지원금',
    CORPORATE: '기업후원',
    FOUNDATION: '재단',
    DONATION: '개인기부',
    SELF: '자부담',
    OTHER: '기타',
  };
  return labels[type] || type;
};

const getTransactionTypeColor = (type: string) => {
  switch (type) {
    case 'INCOME':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'EXPENSE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const getTransactionTypeLabel = (type: string) => {
  switch (type) {
    case 'INCOME':
      return '수입';
    case 'EXPENSE':
      return '지출';
    default:
      return '이체';
  }
};

export function FundSourceDetail({ fundSourceId }: FundSourceDetailProps) {
  const router = useRouter();
  const [fundSource, setFundSource] = useState<FundSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFundSource = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/fund-sources/${fundSourceId}`);
      const data = await response.json();

      if (data.success) {
        setFundSource(data.data);
      } else {
        setError(data.error?.message || '재원을 불러올 수 없습니다');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFundSource();
  }, [fundSourceId]);

  const handleEditSuccess = () => {
    setIsModalOpen(false);
    fetchFundSource();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !fundSource) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">{error || '재원을 찾을 수 없습니다'}</p>
        <Button onClick={() => router.push('/dashboard/fund-sources')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const chartData = [
    { name: '사용', value: fundSource.usedAmount, color: '#f43f5e' },
    { name: '잔액', value: Math.max(0, fundSource.remainingAmount), color: '#10b981' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900">{payload[0].name}</p>
          <p className="text-sm text-slate-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/fund-sources')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(fundSource.type)}`}
            >
              {getTypeIcon(fundSource.type)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{fundSource.name}</h1>
                <Badge variant="outline" className={getTypeColor(fundSource.type)}>
                  {getTypeLabel(fundSource.type)}
                </Badge>
              </div>
              {fundSource.grantor && (
                <p className="text-sm text-slate-500 mt-1">{fundSource.grantor}</p>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          수정
        </Button>
      </div>

      {/* Info & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">지원금액</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatCurrency(fundSource.amount)}
                  </p>
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
                  <p className="text-sm text-slate-500">사용금액</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    {formatCurrency(fundSource.usedAmount)}
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
                  <p className="text-sm text-slate-500">잔액</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      fundSource.remainingAmount < 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(fundSource.remainingAmount)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Period & Description */}
          {(fundSource.startDate || fundSource.endDate || fundSource.description) && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                {(fundSource.startDate || fundSource.endDate) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {fundSource.startDate
                        ? formatDate(new Date(fundSource.startDate))
                        : '미정'}
                      {' ~ '}
                      {fundSource.endDate
                        ? formatDate(new Date(fundSource.endDate))
                        : '미정'}
                    </span>
                  </div>
                )}
                {fundSource.description && (
                  <p className="text-slate-600">{fundSource.description}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">사용 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-sm text-slate-600">사용 {fundSource.usageRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-600">잔액 {100 - fundSource.usageRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>거래 내역</CardTitle>
              <span className="text-sm text-slate-500">
                총 {fundSource._count.transactions}건
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {fundSource.transactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">이 재원으로 집행된 거래가 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>적요</TableHead>
                      <TableHead>계정과목</TableHead>
                      <TableHead>프로젝트</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundSource.transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => router.push('/dashboard/transactions')}
                      >
                        <TableCell className="font-medium text-slate-600">
                          {formatDate(new Date(transaction.date))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getTransactionTypeColor(transaction.type)}
                            >
                              {getTransactionTypeLabel(transaction.type)}
                            </Badge>
                            <span className="text-slate-900">
                              {transaction.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {transaction.account.name}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {transaction.project?.name || '-'}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.type === 'INCOME'
                              ? 'text-emerald-600'
                              : transaction.type === 'EXPENSE'
                                ? 'text-rose-600'
                                : 'text-blue-600'
                          }`}
                        >
                          {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Modal */}
      <FundSourceModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEditSuccess}
        fundSource={fundSource}
      />
    </div>
  );
}
