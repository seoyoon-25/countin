'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Lock, Unlock } from 'lucide-react';
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
  Tabs,
  TabsList,
  TabsTrigger,
} from '@countin/ui';
import { useDebounce } from '@countin/hooks';
import { AccountModal } from './account-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  category: string | null;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  _count: {
    transactions: number;
  };
}

const ACCOUNT_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'ASSET', label: '자산' },
  { value: 'LIABILITY', label: '부채' },
  { value: 'EQUITY', label: '자본' },
  { value: 'REVENUE', label: '수익' },
  { value: 'EXPENSE', label: '비용' },
];

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
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

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Delete states
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/accounts?${params}`);
      const data = await response.json();

      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Filter accounts by search
  const filteredAccounts = accounts.filter((account) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      account.code.toLowerCase().includes(searchLower) ||
      account.name.toLowerCase().includes(searchLower) ||
      (account.category && account.category.toLowerCase().includes(searchLower))
    );
  });

  const handleOpenModal = (account?: Account) => {
    if (account?.isSystem) return;
    setEditingAccount(account || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchAccounts();
  };

  const handleDeleteClick = (account: Account) => {
    setDeleteAccount(account);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAccount) return;

    try {
      const response = await fetch(`/api/accounts/${deleteAccount.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchAccounts();
      } else {
        alert(data.error?.message || '삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setDeleteAccount(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LIABILITY':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'EQUITY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REVENUE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EXPENSE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSET':
        return '자산';
      case 'LIABILITY':
        return '부채';
      case 'EQUITY':
        return '자본';
      case 'REVENUE':
        return '수익';
      case 'EXPENSE':
        return '비용';
      default:
        return type;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>계정과목 목록</CardTitle>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              계정 추가
            </Button>
          </div>

          {/* Tabs Filter */}
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              {ACCOUNT_TYPES.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="코드, 계정명, 카테고리로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
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
          ) : filteredAccounts.length === 0 ? (
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </motion.div>
              <p className="text-slate-500 mb-4">
                {debouncedSearch
                  ? '검색 결과가 없습니다'
                  : '아직 등록된 계정과목이 없습니다'}
              </p>
              {!debouncedSearch && (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />첫 계정과목 추가하기
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">코드</TableHead>
                    <TableHead>계정명</TableHead>
                    <TableHead className="w-24">유형</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="w-24 text-center">거래수</TableHead>
                    <TableHead className="w-24 text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredAccounts.map((account, index) => (
                      <motion.tr
                        key={account.id}
                        custom={index}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className={`border-b border-slate-200 transition-colors ${
                          account.isSystem
                            ? 'cursor-default bg-slate-50/50'
                            : 'cursor-pointer hover:bg-slate-50'
                        }`}
                        onClick={() => handleOpenModal(account)}
                      >
                        <TableCell className="font-mono text-sm font-medium text-slate-700">
                          {account.code}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">
                              {account.name}
                            </span>
                            {account.isSystem && (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          {account.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                              {account.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getTypeColor(account.type)}
                          >
                            {getTypeLabel(account.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {account.category || '-'}
                        </TableCell>
                        <TableCell className="text-center text-slate-600">
                          {account._count.transactions}
                        </TableCell>
                        <TableCell className="text-center">
                          {account.isSystem ? (
                            <Badge variant="outline" className="bg-slate-100 text-slate-500">
                              시스템
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={
                                account.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }
                            >
                              {account.isActive ? '활성' : '비활성'}
                            </Badge>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Modal */}
      <AccountModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        account={editingAccount}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deleteAccount}
        onClose={() => setDeleteAccount(null)}
        onConfirm={handleDeleteConfirm}
        account={deleteAccount}
      />
    </>
  );
}
