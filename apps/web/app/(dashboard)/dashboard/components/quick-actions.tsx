'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@countin/ui';

interface QuickActionsProps {
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 },
};

export function QuickActions({ onAddIncome, onAddExpense }: QuickActionsProps) {
  const actions = [
    {
      name: '수입 등록',
      onClick: onAddIncome,
      href: onAddIncome ? undefined : '/dashboard/transactions',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      name: '지출 등록',
      onClick: onAddExpense,
      href: onAddExpense ? undefined : '/dashboard/transactions',
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      name: '문서 작성',
      href: '/dashboard/documents',
      icon: <FileText className="w-6 h-6" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      name: '보고서 생성',
      href: '/dashboard/reports',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3"
          >
            {actions.map((action) => (
              <motion.div key={action.name} variants={item}>
                {action.onClick ? (
                  <button
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group text-left"
                  >
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      className={`p-2 rounded-lg ${action.color}`}
                    >
                      {action.icon}
                    </motion.div>
                    <span className="font-medium text-slate-700 group-hover:text-primary-600 transition-colors">
                      {action.name}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={action.href!}
                    className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
                  >
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      className={`p-2 rounded-lg ${action.color}`}
                    >
                      {action.icon}
                    </motion.div>
                    <span className="font-medium text-slate-700 group-hover:text-primary-600 transition-colors">
                      {action.name}
                    </span>
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
