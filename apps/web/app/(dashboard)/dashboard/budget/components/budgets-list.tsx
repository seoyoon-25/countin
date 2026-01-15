'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  Archive,
  Copy,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@countin/ui';
import { formatCurrency } from '@countin/utils';
import { useDebounce } from '@countin/hooks';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { CopyBudgetModal } from './copy-budget-modal';

interface Budget {
  id: string;
  name: string;
  year: number;
  status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  totalAmount: number;
  totalIncome: number;
  totalExpense: number;
  itemCount: number;
  project: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'DRAFT', label: '초안' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'ARCHIVED', label: '보관됨' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <FileText className="w-4 h-4" />;
    case 'APPROVED':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'ARCHIVED':
      return <Archive className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'ARCHIVED':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getStatusLabel = (status: string) => {
  const found = STATUS_FILTERS.find((s) => s.value === status);
  return found ? found.label : status;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

export function BudgetsList() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [copyingBudget, setCopyingBudget] = useState<Budget | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter && yearFilter !== 'all') {
        params.set('year', yearFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const url = `/api/budgets${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setBudgets(data.data);
        if (data.years && data.years.length > 0) {
          setYears(data.years);
        }
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [yearFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleAddNew = () => {
    router.push('/dashboard/budget/new');
  };

  const handleCardClick = (budget: Budget) => {
    router.push(`/dashboard/budget/${budget.id}`);
  };

  const handleEdit = (e: React.MouseEvent, budget: Budget) => {
    e.stopPropagation();
    router.push(`/dashboard/budget/${budget.id}/edit`);
  };

  const handleCopy = (e: React.MouseEvent, budget: Budget) => {
    e.stopPropagation();
    setCopyingBudget(budget);
  };

  const handleDelete = (e: React.MouseEvent, budget: Budget) => {
    e.stopPropagation();
    setDeletingBudget(budget);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBudget) return;

    try {
      const response = await fetch(`/api/budgets/${deletingBudget.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDeletingBudget(null);
        fetchBudgets();
      } else {
        alert(data.error?.message || '삭제에 실패했습니다');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다');
    }
  };

  const handleCopySuccess = () => {
    setCopyingBudget(null);
    fetchBudgets();
  };

  // Generate year tabs
  const currentYear = new Date().getFullYear();
  const yearOptions = years.length > 0
    ? years
    : [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">예산 관리</h1>
          <p className="text-slate-500 mt-1">조직의 예산을 계획하고 관리하세요</p>
        </div>
        <Button onClick={handleAddNew} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          예산 추가
        </Button>
      </div>

      {/* Year Tabs */}
      <Tabs value={yearFilter} onValueChange={setYearFilter}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-sm">
            전체
          </TabsTrigger>
          {yearOptions.map((year) => (
            <TabsTrigger key={year} value={year.toString()} className="text-sm">
              {year}년
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="예산명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="h-auto gap-1">
            {STATUS_FILTERS.map((status) => (
              <TabsTrigger key={status.value} value={status.value} className="text-sm">
                {status.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Budget Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-4">
            {debouncedSearch || yearFilter !== 'all' || statusFilter !== 'all'
              ? '검색 결과가 없습니다'
              : '등록된 예산이 없습니다'}
          </p>
          {!debouncedSearch && yearFilter === 'all' && statusFilter === 'all' && (
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              첫 예산 추가하기
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget, index) => (
              <motion.div
                key={budget.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <Card
                  className="h-full hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleCardClick(budget)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                              {budget.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {budget.year}년
                            </Badge>
                            {budget.project && (
                              <Badge variant="secondary" className="text-xs truncate max-w-[100px]">
                                {budget.project.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(budget.status)} flex items-center gap-1`}
                          >
                            {getStatusIcon(budget.status)}
                            {getStatusLabel(budget.status)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => handleEdit(e, budget)}>
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleCopy(e, budget)}>
                                <Copy className="w-4 h-4 mr-2" />
                                복사
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDelete(e, budget)}
                                className="text-rose-600"
                              >
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Amount Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">총 예산</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(budget.totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            수입
                          </span>
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(budget.totalIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-rose-500" />
                            지출
                          </span>
                          <span className="font-medium text-rose-600">
                            {formatCurrency(budget.totalExpense)}
                          </span>
                        </div>
                      </div>

                      {/* Item Count */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          {budget.itemCount}개 항목
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleDeleteConfirm}
        title="예산 삭제"
        description={
          deletingBudget
            ? `"${deletingBudget.name}" 예산을 삭제하시겠습니까? 모든 예산 항목도 함께 삭제됩니다.`
            : ''
        }
      />

      {/* Copy Budget Modal */}
      <CopyBudgetModal
        open={!!copyingBudget}
        onClose={() => setCopyingBudget(null)}
        onSuccess={handleCopySuccess}
        budget={copyingBudget}
      />
    </div>
  );
}
