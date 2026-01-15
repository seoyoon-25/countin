'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  FolderKanban,
  Wallet,
  BookOpen,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@countin/ui';

const reportTypes = [
  {
    id: 'income-expense',
    name: '수입지출 보고서',
    description: '기간별 수입과 지출 현황을 확인합니다',
    icon: TrendingUp,
    color: 'bg-blue-50 text-blue-600',
    href: '/dashboard/reports/income-expense',
  },
  {
    id: 'project',
    name: '프로젝트별 보고서',
    description: '프로젝트별 수입/지출 및 예산 집행 현황',
    icon: FolderKanban,
    color: 'bg-purple-50 text-purple-600',
    href: '/dashboard/reports/project',
  },
  {
    id: 'fund-source',
    name: '재원별 보고서',
    description: '재원별 사용 내역 및 잔액 현황',
    icon: Wallet,
    color: 'bg-emerald-50 text-emerald-600',
    href: '/dashboard/reports/fund-source',
  },
  {
    id: 'account',
    name: '계정과목별 보고서',
    description: '계정과목별 거래 현황 및 추이',
    icon: BookOpen,
    color: 'bg-amber-50 text-amber-600',
    href: '/dashboard/reports/account',
  },
  {
    id: 'monthly',
    name: '월별 추이 보고서',
    description: '월별 수입/지출 추이를 분석합니다',
    icon: BarChart3,
    color: 'bg-rose-50 text-rose-600',
    href: '/dashboard/reports/monthly',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">보고서</h1>
        <p className="text-slate-500 mt-1">다양한 보고서를 통해 재무 현황을 분석하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.id}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Link href={report.href}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.color}`}>
                      <report.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {report.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {report.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
