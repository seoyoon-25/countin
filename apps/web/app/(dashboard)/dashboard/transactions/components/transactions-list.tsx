'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';
import { useDebounce } from '@countin/hooks';
import { TransactionModal } from './transaction-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { ToastContainer } from './toast-container';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
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
  accountId: string;
  account: Account;
  projectId?: string;
  project?: Project;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DeletedTransaction extends Transaction {
  deletedAt: number;
}

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.8,
    height: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
  },
};

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Delete states
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [deletedTransactions, setDeletedTransactions] = useState<DeletedTransaction[]>([]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, typeFilter]);

  const handleOpenModal = (transaction?: Transaction) => {
    setEditingTransaction(transaction || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchTransactions();
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteTransaction(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTransaction) return;

    try {
      const response = await fetch(`/api/transactions/${deleteTransaction.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        // Add to deleted transactions for undo
        setDeletedTransactions((prev) => [
          ...prev,
          { ...deleteTransaction, deletedAt: Date.now() },
        ]);
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setDeleteTransaction(null);
    }
  };

  const handleUndo = async (deletedTransaction: DeletedTransaction) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: deletedTransaction.date,
          type: deletedTransaction.type,
          amount: deletedTransaction.amount,
          description: deletedTransaction.description,
          memo: deletedTransaction.memo,
          accountId: deletedTransaction.accountId,
          projectId: deletedTransaction.projectId,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setDeletedTransactions((prev) =>
          prev.filter((t) => t.id !== deletedTransaction.id)
        );
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to restore transaction:', error);
    }
  };

  const handleDismissUndo = (id: string) => {
    setDeletedTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EXPENSE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>거래 목록</CardTitle>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              거래 추가
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="적요, 메모로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="유형 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="INCOME">수입</SelectItem>
                <SelectItem value="EXPENSE">지출</SelectItem>
                <SelectItem value="TRANSFER">이체</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-slate-300"
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
              <p className="text-slate-500 mb-4">아직 등록된 거래가 없습니다</p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4 mr-2" />첫 거래 등록하기
              </Button>
            </motion.div>
          ) : (
            <>
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
                    <AnimatePresence mode="popLayout">
                      {transactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          custom={index}
                          variants={listItemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handleOpenModal(transaction)}
                        >
                          <TableCell className="font-medium text-slate-600">
                            {formatDate(new Date(transaction.date))}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getTypeColor(transaction.type)}
                              >
                                {getTypeLabel(transaction.type)}
                              </Badge>
                              <span className="text-slate-900">
                                {transaction.description}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {transaction.account.name}
                          </TableCell>
                          <TableCell className="text-slate-500">
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
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    총 {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}건
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-600 px-2">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        transaction={editingTransaction}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTransaction}
        onClose={() => setDeleteTransaction(null)}
        onConfirm={handleDeleteConfirm}
        transaction={deleteTransaction}
      />

      {/* Undo Toast Container */}
      <ToastContainer
        deletedTransactions={deletedTransactions}
        onUndo={handleUndo}
        onDismiss={handleDismissUndo}
      />
    </>
  );
}
