'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@countin/ui';

export function RecentTransactions() {
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
          <div className="text-center py-8 text-slate-500">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <svg
                className="w-12 h-12 mx-auto mb-4 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </motion.div>
            <p>아직 등록된 거래가 없습니다</p>
            <motion.div whileHover={{ x: 5 }} className="inline-block">
              <Link
                href="/dashboard/transactions/new"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                첫 거래 등록하기 →
              </Link>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
