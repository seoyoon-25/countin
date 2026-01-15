'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, FolderOpen } from 'lucide-react';
import { Card, CardContent, Skeleton } from '@countin/ui';
import { formatCurrency } from '@countin/utils';

interface StatsData {
  income: {
    amount: number;
    change: number;
  };
  expense: {
    amount: number;
    change: number;
  };
  balance: {
    amount: number;
    change: number;
  };
  activeProjects: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function DashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-16 h-5" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-32 h-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: '이번 달 수입',
      value: stats?.income.amount || 0,
      change: stats?.income.change || 0,
      icon: <TrendingUp className="w-6 h-6" />,
      colorClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: '이번 달 지출',
      value: stats?.expense.amount || 0,
      change: stats?.expense.change || 0,
      icon: <TrendingDown className="w-6 h-6" />,
      colorClass: 'bg-rose-100 text-rose-600',
    },
    {
      title: '잔액',
      value: stats?.balance.amount || 0,
      change: stats?.balance.change || 0,
      icon: <Wallet className="w-6 h-6" />,
      colorClass: 'bg-blue-100 text-blue-600',
    },
    {
      title: '진행 중인 프로젝트',
      value: stats?.activeProjects || 0,
      isCount: true,
      icon: <FolderOpen className="w-6 h-6" />,
      colorClass: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {statItems.map((stat) => (
        <motion.div key={stat.title} variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-2 rounded-xl ${stat.colorClass}`}
                >
                  {stat.icon}
                </motion.div>
                {!stat.isCount && stat.change !== undefined && (
                  <span
                    className={`text-sm font-medium ${
                      stat.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {stat.change >= 0 ? '+' : ''}
                    {stat.change}%
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-500">{stat.title}</p>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-slate-900 mt-1 tabular-nums"
                >
                  {stat.isCount ? (
                    <>{stat.value}개</>
                  ) : (
                    formatCurrency(stat.value)
                  )}
                </motion.p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
