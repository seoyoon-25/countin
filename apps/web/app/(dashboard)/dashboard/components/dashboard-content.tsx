'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardStats } from './dashboard-stats';
import { RecentTransactions } from './recent-transactions';
import { QuickActions } from './quick-actions';
import { MonthlyChart } from './monthly-chart';
import { TransactionModal } from '../transactions/components/transaction-modal';

type TransactionType = 'INCOME' | 'EXPENSE';

export function DashboardContent() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('EXPENSE');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddIncome = useCallback(() => {
    setModalType('INCOME');
    setIsModalOpen(true);
  }, []);

  const handleAddExpense = useCallback(() => {
    setModalType('EXPENSE');
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setIsModalOpen(false);
    // Trigger re-fetch of all components by updating the key
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <p className="text-slate-500 mt-1">회계 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <DashboardStats key={`stats-${refreshKey}`} />

      {/* Monthly Chart */}
      <MonthlyChart key={`chart-${refreshKey}`} />

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions key={`transactions-${refreshKey}`} />
        <QuickActions onAddIncome={handleAddIncome} onAddExpense={handleAddExpense} />
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        transaction={null}
        defaultType={modalType}
      />
    </div>
  );
}
