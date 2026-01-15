'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from '@countin/ui';
import { formatCurrency } from '@countin/utils';

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

export interface FilterState {
  startDate: string;
  endDate: string;
  type: string;
  accountId: string;
  projectId: string;
  minAmount: string;
  maxAmount: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  accounts: Account[];
  projects: Project[];
}

export function TransactionFilters({
  filters,
  onFilterChange,
  accounts,
  projects,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync local filters with parent filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      startDate: '',
      endDate: '',
      type: '',
      accountId: '',
      projectId: '',
      minAmount: '',
      maxAmount: '',
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.type) count++;
    if (filters.accountId) count++;
    if (filters.projectId) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  const getActiveFilterTags = () => {
    const tags: { key: string; label: string; value: string }[] = [];

    if (filters.startDate || filters.endDate) {
      let dateLabel = '';
      if (filters.startDate && filters.endDate) {
        dateLabel = `${filters.startDate} ~ ${filters.endDate}`;
      } else if (filters.startDate) {
        dateLabel = `${filters.startDate} ~`;
      } else {
        dateLabel = `~ ${filters.endDate}`;
      }
      tags.push({ key: 'date', label: '기간', value: dateLabel });
    }

    if (filters.type) {
      const typeLabels: Record<string, string> = {
        INCOME: '수입',
        EXPENSE: '지출',
        TRANSFER: '이체',
      };
      tags.push({ key: 'type', label: '유형', value: typeLabels[filters.type] || filters.type });
    }

    if (filters.accountId) {
      const account = accounts.find((a) => a.id === filters.accountId);
      if (account) {
        tags.push({ key: 'accountId', label: '계정', value: account.name });
      }
    }

    if (filters.projectId) {
      const project = projects.find((p) => p.id === filters.projectId);
      if (project) {
        tags.push({ key: 'projectId', label: '프로젝트', value: project.name });
      }
    }

    if (filters.minAmount || filters.maxAmount) {
      let amountLabel = '';
      if (filters.minAmount && filters.maxAmount) {
        amountLabel = `${formatCurrency(Number(filters.minAmount))} ~ ${formatCurrency(Number(filters.maxAmount))}`;
      } else if (filters.minAmount) {
        amountLabel = `${formatCurrency(Number(filters.minAmount))} 이상`;
      } else {
        amountLabel = `${formatCurrency(Number(filters.maxAmount))} 이하`;
      }
      tags.push({ key: 'amount', label: '금액', value: amountLabel });
    }

    return tags;
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...localFilters };
    if (key === 'date') {
      newFilters.startDate = '';
      newFilters.endDate = '';
    } else if (key === 'amount') {
      newFilters.minAmount = '';
      newFilters.maxAmount = '';
    } else {
      (newFilters as any)[key] = '';
    }
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          상세 필터
          {activeCount > 0 && (
            <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs">
              {activeCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      <AnimatePresence>
        {activeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {getActiveFilterTags().map((tag) => (
              <motion.div
                key={tag.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1 bg-primary-50 text-primary-700 border-primary-200"
                >
                  <span className="text-xs font-normal text-primary-500">
                    {tag.label}:
                  </span>
                  <span className="font-medium">{tag.value}</span>
                  <button
                    onClick={() => removeFilter(tag.key)}
                    className="ml-1 p-0.5 rounded hover:bg-primary-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-50 rounded-xl space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">시작일</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={localFilters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">종료일</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={localFilters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Type & Account & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">거래 유형</Label>
                  <Select
                    value={localFilters.type || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('type', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="INCOME">수입</SelectItem>
                      <SelectItem value="EXPENSE">지출</SelectItem>
                      <SelectItem value="TRANSFER">이체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">계정과목</Label>
                  <Select
                    value={localFilters.accountId || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('accountId', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">프로젝트</Label>
                  <Select
                    value={localFilters.projectId || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('projectId', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">최소 금액</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ₩
                    </span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={localFilters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      className="pl-8 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">최대 금액</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ₩
                    </span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={localFilters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      className="pl-8 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
