'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, FileText, Download, FileSpreadsheet, Upload } from 'lucide-react';
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
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';
import { useDebounce } from '@countin/hooks';
import { TransactionModal } from './transaction-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { ToastContainer } from './toast-container';
import { TransactionFilters, FilterState } from './transaction-filters';

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

// Highlight search text in string
function HighlightText({ text, search }: { text: string; search: string }) {
  if (!search || !text) return <>{text}</>;

  const parts = text.split(new RegExp(`(${search})`, 'gi'));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark
            key={index}
            className="bg-yellow-200 text-yellow-900 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function TransactionsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Get initial values from URL
  const initialFilters: FilterState = {
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    type: searchParams.get('type') || '',
    accountId: searchParams.get('accountId') || '',
    projectId: searchParams.get('projectId') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Delete states
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [deletedTransactions, setDeletedTransactions] = useState<DeletedTransaction[]>([]);

  // Fetch accounts and projects for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [accountsRes, projectsRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/projects?includeAll=true'),
        ]);

        const accountsData = await accountsRes.json();
        const projectsData = await projectsRes.json();

        if (accountsData.success) {
          setAccounts(accountsData.data || []);
        }
        if (projectsData.success) {
          setProjects(projectsData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      }
    };

    fetchFilterData();
  }, []);

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: FilterState, newSearch: string, newPage: number) => {
      const params = new URLSearchParams();

      if (newSearch) params.set('search', newSearch);
      if (newFilters.startDate) params.set('startDate', newFilters.startDate);
      if (newFilters.endDate) params.set('endDate', newFilters.endDate);
      if (newFilters.type) params.set('type', newFilters.type);
      if (newFilters.accountId) params.set('accountId', newFilters.accountId);
      if (newFilters.projectId) params.set('projectId', newFilters.projectId);
      if (newFilters.minAmount) params.set('minAmount', newFilters.minAmount);
      if (newFilters.maxAmount) params.set('maxAmount', newFilters.maxAmount);
      if (newPage > 1) params.set('page', newPage.toString());

      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      });
    },
    [pathname, router]
  );

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type) params.append('type', filters.type);
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

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
  }, [pagination.page, pagination.limit, debouncedSearch, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filters or search change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL(filters, debouncedSearch, 1);
  }, [debouncedSearch, filters, updateURL]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

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

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    updateURL(filters, debouncedSearch, newPage);
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ format });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.type) params.set('type', filters.type);
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.minAmount) params.set('minAmount', filters.minAmount);
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount);

    window.open(`/api/export/transactions?${params}`, '_blank');
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

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch ||
      filters.startDate ||
      filters.endDate ||
      filters.type ||
      filters.accountId ||
      filters.projectId ||
      filters.minAmount ||
      filters.maxAmount
    );
  }, [debouncedSearch, filters]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>거래 목록</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/transactions/import')}>
                <Upload className="w-4 h-4 mr-2" />
                가져오기
              </Button>
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
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4 mr-2" />
                거래 추가
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="적요, 메모로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="mt-4">
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              accounts={accounts}
              projects={projects}
            />
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
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              </motion.div>
              <p className="text-slate-500 mb-4">
                {hasActiveFilters
                  ? '검색 결과가 없습니다'
                  : '아직 등록된 거래가 없습니다'}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setFilters({
                      startDate: '',
                      endDate: '',
                      type: '',
                      accountId: '',
                      projectId: '',
                      minAmount: '',
                      maxAmount: '',
                    });
                  }}
                >
                  필터 초기화
                </Button>
              ) : (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />첫 거래 등록하기
                </Button>
              )}
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
                                <HighlightText
                                  text={transaction.description}
                                  search={debouncedSearch}
                                />
                              </span>
                            </div>
                            {transaction.memo && debouncedSearch && (
                              <p className="text-xs text-slate-500 mt-1">
                                <HighlightText
                                  text={transaction.memo}
                                  search={debouncedSearch}
                                />
                              </p>
                            )}
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
                      onClick={() => handlePageChange(pagination.page - 1)}
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
                      onClick={() => handlePageChange(pagination.page + 1)}
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
