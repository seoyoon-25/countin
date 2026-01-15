'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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

interface FundSource {
  id: string;
  name: string;
  type: string;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
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
  fundSourceId?: string;
  fundSource?: FundSource;
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
  onDelete?: (transaction: Transaction) => void;
  defaultType?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

const transactionSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], '유형을 선택해주세요'),
  amount: z
    .string()
    .min(1, '금액을 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: '금액은 0보다 커야 합니다',
    }),
  description: z.string().min(1, '적요를 입력해주세요'),
  memo: z.string().optional(),
  accountId: z.string().min(1, '계정과목을 선택해주세요'),
  projectId: z.string().optional(),
  fundSourceId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function TransactionModal({
  open,
  onClose,
  onSuccess,
  transaction,
  onDelete,
  defaultType = 'EXPENSE',
}: TransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);

  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: defaultType,
      amount: '',
      description: '',
      memo: '',
      accountId: '',
      projectId: '',
      fundSourceId: '',
    },
  });

  const selectedType = watch('type');
  const selectedFundSourceId = watch('fundSourceId');

  // Get selected fund source info
  const selectedFundSource = fundSources.find((fs) => fs.id === selectedFundSourceId);

  // Fetch accounts, projects, and fund sources
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, projectsRes, fundSourcesRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/projects'),
          fetch('/api/fund-sources'),
        ]);

        const accountsData = await accountsRes.json();
        const projectsData = await projectsRes.json();
        const fundSourcesData = await fundSourcesRes.json();

        if (accountsData.success) {
          setAccounts(accountsData.data || []);
        }

        if (projectsData.success) {
          setProjects(projectsData.data || []);
        }

        if (fundSourcesData.success) {
          setFundSources(fundSourcesData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Reset form when transaction changes or modal opens
  useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          date: new Date(transaction.date).toISOString().split('T')[0],
          type: transaction.type,
          amount: transaction.amount.toString(),
          description: transaction.description,
          memo: transaction.memo || '',
          accountId: transaction.accountId,
          projectId: transaction.projectId || '',
          fundSourceId: transaction.fundSourceId || '',
        });
      } else {
        reset({
          date: new Date().toISOString().split('T')[0],
          type: defaultType,
          amount: '',
          description: '',
          memo: '',
          accountId: '',
          projectId: '',
          fundSourceId: '',
        });
      }
      setError(null);
    }
  }, [open, transaction, reset, defaultType]);

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        date: data.date,
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
        memo: data.memo || null,
        accountId: data.accountId,
        projectId: data.projectId || null,
        fundSourceId: data.fundSourceId || null,
      };

      const url = isEditing
        ? `/api/transactions/${transaction.id}`
        : '/api/transactions';

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || '오류가 발생했습니다');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (transaction && onDelete) {
      onDelete(transaction);
      onClose();
    }
  };

  // Filter accounts based on type
  const filteredAccounts = accounts.filter((account) => {
    if (selectedType === 'INCOME') {
      return account.type === 'REVENUE' || account.type === 'ASSET';
    } else if (selectedType === 'EXPENSE') {
      return account.type === 'EXPENSE' || account.type === 'ASSET';
    }
    return account.type === 'ASSET';
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '거래 수정' : '새 거래 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>유형</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={selectedType === 'INCOME' ? 'default' : 'outline'}
                className={
                  selectedType === 'INCOME'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : ''
                }
                onClick={() => setValue('type', 'INCOME')}
              >
                수입
              </Button>
              <Button
                type="button"
                variant={selectedType === 'EXPENSE' ? 'default' : 'outline'}
                className={
                  selectedType === 'EXPENSE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : ''
                }
                onClick={() => setValue('type', 'EXPENSE')}
              >
                지출
              </Button>
              <Button
                type="button"
                variant={selectedType === 'TRANSFER' ? 'default' : 'outline'}
                className={
                  selectedType === 'TRANSFER'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : ''
                }
                onClick={() => setValue('type', 'TRANSFER')}
              >
                이체
              </Button>
            </div>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                ₩
              </span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                {...register('amount')}
                className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">적요</Label>
            <Input
              id="description"
              placeholder="거래 내용을 입력하세요"
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label>계정과목</Label>
            <Select
              value={watch('accountId')}
              onValueChange={(value) => setValue('accountId', value)}
            >
              <SelectTrigger className={errors.accountId ? 'border-red-500' : ''}>
                <SelectValue placeholder="계정과목을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {filteredAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
          </div>

          {/* Project (optional) */}
          <div className="space-y-2">
            <Label>프로젝트 (선택)</Label>
            <Select
              value={watch('projectId') || ''}
              onValueChange={(value) => setValue('projectId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="프로젝트를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">없음</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fund Source (optional - for EXPENSE type) */}
          {selectedType === 'EXPENSE' && fundSources.length > 0 && (
            <div className="space-y-2">
              <Label>재원 (선택)</Label>
              <Select
                value={watch('fundSourceId') || ''}
                onValueChange={(value) => setValue('fundSourceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="재원을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {fundSources.map((fundSource) => (
                    <SelectItem key={fundSource.id} value={fundSource.id}>
                      {fundSource.name} (잔액: {formatCurrency(fundSource.remainingAmount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFundSource && (
                <p className="text-xs text-slate-500">
                  지원금액: {formatCurrency(selectedFundSource.amount)} /
                  사용: {formatCurrency(selectedFundSource.usedAmount)} /
                  잔액: {formatCurrency(selectedFundSource.remainingAmount)}
                </p>
              )}
            </div>
          )}

          {/* Memo (optional) */}
          <div className="space-y-2">
            <Label htmlFor="memo">메모 (선택)</Label>
            <Textarea
              id="memo"
              placeholder="추가 메모를 입력하세요"
              rows={2}
              {...register('memo')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '저장 중...' : isEditing ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
