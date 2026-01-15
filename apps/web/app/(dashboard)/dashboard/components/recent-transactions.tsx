'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';

interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description: string;
  memo?: string | null;
  account: {
    id: string;
    code: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  } | null;
}

export function RecentTransactions() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data.success) {
          setTransactions(data.data.recentTransactions || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <TrendingUp className="w-4 h-4" />;
      case 'EXPENSE':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'EXPENSE':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'INCOME':
        return '수입';
      case 'EXPENSE':
        return '지출';
      default:
        return '이체';
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 거래</CardTitle>
            <Skeleton className="w-16 h-4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <Skeleton className="w-20 h-5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>최근 거래</CardTitle>
          <Link
            href="/dashboard/transactions"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            전체 보기
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              </motion.div>
              <p>아직 등록된 거래가 없습니다</p>
              <motion.div whileHover={{ x: 5 }} className="inline-block">
                <Link
                  href="/dashboard/transactions"
                  className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  첫 거래 등록하기 →
                </Link>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push('/dashboard/transactions')}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(transaction.type)}`}
                    >
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">
                          {transaction.description}
                        </p>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs ${getTypeColor(transaction.type)}`}
                        >
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {transaction.account.name}
                        {transaction.project && ` · ${transaction.project.name}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-semibold tabular-nums ${
                          transaction.type === 'INCOME'
                            ? 'text-emerald-600'
                            : transaction.type === 'EXPENSE'
                              ? 'text-rose-600'
                              : 'text-blue-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(new Date(transaction.date))}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
