'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  Building2,
  Landmark,
  Heart,
  Users,
  Wallet,
  HelpCircle,
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
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';
import { useDebounce } from '@countin/hooks';
import { FundSourceModal } from './fund-source-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

interface FundSource {
  id: string;
  name: string;
  type: string;
  grantor: string | null;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  usageRate: number;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  _count: {
    transactions: number;
  };
}

const FUND_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'GOVERNMENT', label: '정부지원금' },
  { value: 'CORPORATE', label: '기업후원' },
  { value: 'FOUNDATION', label: '재단' },
  { value: 'DONATION', label: '개인기부' },
  { value: 'SELF', label: '자부담' },
  { value: 'OTHER', label: '기타' },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'GOVERNMENT':
      return <Landmark className="w-5 h-5" />;
    case 'CORPORATE':
      return <Building2 className="w-5 h-5" />;
    case 'FOUNDATION':
      return <Building2 className="w-5 h-5" />;
    case 'DONATION':
      return <Heart className="w-5 h-5" />;
    case 'SELF':
      return <Wallet className="w-5 h-5" />;
    default:
      return <HelpCircle className="w-5 h-5" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'GOVERNMENT':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'CORPORATE':
      return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'FOUNDATION':
      return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    case 'DONATION':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'SELF':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getTypeLabel = (type: string) => {
  const found = FUND_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};

const getProgressColor = (usageRate: number) => {
  if (usageRate >= 100) return 'bg-rose-500';
  if (usageRate >= 80) return 'bg-amber-500';
  return 'bg-emerald-500';
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

export function FundSourcesList() {
  const router = useRouter();
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFundSource, setEditingFundSource] = useState<FundSource | null>(null);
  const [deletingFundSource, setDeletingFundSource] = useState<FundSource | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchFundSources = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'all') {
        params.set('type', typeFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const url = `/api/fund-sources${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setFundSources(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fund sources:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, debouncedSearch]);

  useEffect(() => {
    fetchFundSources();
  }, [fetchFundSources]);

  const handleAddNew = () => {
    setEditingFundSource(null);
    setIsModalOpen(true);
  };

  const handleEdit = (fundSource: FundSource) => {
    setEditingFundSource(fundSource);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingFundSource(null);
    fetchFundSources();
  };

  const handleDeleteClick = (fundSource: FundSource) => {
    setDeletingFundSource(fundSource);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFundSource) return;

    try {
      const response = await fetch(`/api/fund-sources/${deletingFundSource.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDeletingFundSource(null);
        fetchFundSources();
      } else {
        alert(data.error?.message || '삭제에 실패했습니다');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다');
    }
  };

  const handleCardClick = (fundSource: FundSource) => {
    router.push(`/dashboard/fund-sources/${fundSource.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">재원 관리</h1>
          <p className="text-slate-500 mt-1">조직의 재원을 관리하세요</p>
        </div>
        <Button onClick={handleAddNew} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          재원 추가
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="재원명, 지원기관 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="flex-wrap h-auto gap-1">
            {FUND_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="text-sm">
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Fund Sources Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : fundSources.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-4">
            {debouncedSearch || typeFilter !== 'all'
              ? '검색 결과가 없습니다'
              : '등록된 재원이 없습니다'}
          </p>
          {!debouncedSearch && typeFilter === 'all' && (
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              첫 재원 추가하기
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fundSources.map((fundSource, index) => (
              <motion.div
                key={fundSource.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <Card
                  className="h-full hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleCardClick(fundSource)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(fundSource.type)}`}
                          >
                            {getTypeIcon(fundSource.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                              {fundSource.name}
                            </h3>
                            {fundSource.grantor && (
                              <p className="text-sm text-slate-500">{fundSource.grantor}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={getTypeColor(fundSource.type)}>
                          {getTypeLabel(fundSource.type)}
                        </Badge>
                      </div>

                      {/* Amount Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">지원금액</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(fundSource.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">사용금액</span>
                          <span className="font-medium text-rose-600">
                            {formatCurrency(fundSource.usedAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">잔액</span>
                          <span
                            className={`font-medium ${
                              fundSource.remainingAmount < 0
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {formatCurrency(fundSource.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>사용률</span>
                          <span>{fundSource.usageRate}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, fundSource.usageRate)}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${getProgressColor(fundSource.usageRate)}`}
                          />
                        </div>
                      </div>

                      {/* Period */}
                      {(fundSource.startDate || fundSource.endDate) && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {fundSource.startDate
                              ? formatDate(new Date(fundSource.startDate))
                              : '미정'}
                            {' ~ '}
                            {fundSource.endDate
                              ? formatDate(new Date(fundSource.endDate))
                              : '미정'}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div
                        className="flex gap-2 pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(fundSource)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                          onClick={() => handleDeleteClick(fundSource)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Modal */}
      <FundSourceModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFundSource(null);
        }}
        onSuccess={handleSaveSuccess}
        fundSource={editingFundSource}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deletingFundSource}
        onClose={() => setDeletingFundSource(null)}
        onConfirm={handleDeleteConfirm}
        title="재원 삭제"
        description={
          deletingFundSource
            ? `"${deletingFundSource.name}" 재원을 삭제하시겠습니까?`
            : ''
        }
      />
    </div>
  );
}
