'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@countin/ui';
import { formatCurrency } from '@countin/utils';

const stats = [
  {
    title: '이번 달 수입',
    value: 12500000,
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: '이번 달 지출',
    value: 8750000,
    change: '-5.2%',
    changeType: 'negative' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    title: '잔액',
    value: 45230000,
    change: '+8.1%',
    changeType: 'positive' as const,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: '진행 중인 프로젝트',
    value: 5,
    isCount: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
];

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
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => (
        <motion.div key={stat.title} variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-2 rounded-xl ${
                    stat.changeType === 'positive'
                      ? 'bg-emerald-100 text-emerald-600'
                      : stat.changeType === 'negative'
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stat.icon}
                </motion.div>
                {stat.change && (
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {stat.change}
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
                  {stat.isCount ? stat.value : formatCurrency(stat.value)}
                </motion.p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
