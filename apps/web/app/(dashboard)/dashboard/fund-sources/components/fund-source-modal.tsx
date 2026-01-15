'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Trash2,
  Building2,
  Landmark,
  Heart,
  Wallet,
  HelpCircle,
} from 'lucide-react';
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
} from '@countin/ui';

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

interface FundSourceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  fundSource?: FundSource | null;
  onDelete?: (fundSource: FundSource) => void;
}

const FUND_TYPES = [
  { value: 'GOVERNMENT', label: '정부지원금', icon: Landmark, color: 'bg-blue-100 text-blue-600 border-blue-300' },
  { value: 'CORPORATE', label: '기업후원', icon: Building2, color: 'bg-purple-100 text-purple-600 border-purple-300' },
  { value: 'FOUNDATION', label: '재단', icon: Building2, color: 'bg-indigo-100 text-indigo-600 border-indigo-300' },
  { value: 'DONATION', label: '개인기부', icon: Heart, color: 'bg-rose-100 text-rose-600 border-rose-300' },
  { value: 'SELF', label: '자부담', icon: Wallet, color: 'bg-emerald-100 text-emerald-600 border-emerald-300' },
  { value: 'OTHER', label: '기타', icon: HelpCircle, color: 'bg-slate-100 text-slate-600 border-slate-300' },
];

const fundSourceSchema = z.object({
  name: z.string().min(1, '재원명을 입력해주세요'),
  type: z.enum(['GOVERNMENT', 'CORPORATE', 'FOUNDATION', 'DONATION', 'SELF', 'OTHER'], '유형을 선택해주세요'),
  grantor: z.string().optional(),
  amount: z
    .string()
    .min(1, '금액을 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: '유효한 금액을 입력해주세요',
    }),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

type FundSourceFormData = z.infer<typeof fundSourceSchema>;

export function FundSourceModal({
  open,
  onClose,
  onSuccess,
  fundSource,
  onDelete,
}: FundSourceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!fundSource;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FundSourceFormData>({
    resolver: zodResolver(fundSourceSchema),
    defaultValues: {
      name: '',
      type: 'OTHER',
      grantor: '',
      amount: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  });

  const selectedType = watch('type');

  // Reset form when fundSource changes or modal opens
  useEffect(() => {
    if (open) {
      if (fundSource) {
        reset({
          name: fundSource.name,
          type: fundSource.type as any,
          grantor: fundSource.grantor || '',
          amount: fundSource.amount.toString(),
          startDate: fundSource.startDate
            ? new Date(fundSource.startDate).toISOString().split('T')[0]
            : '',
          endDate: fundSource.endDate
            ? new Date(fundSource.endDate).toISOString().split('T')[0]
            : '',
          description: fundSource.description || '',
        });
      } else {
        reset({
          name: '',
          type: 'OTHER',
          grantor: '',
          amount: '',
          startDate: '',
          endDate: '',
          description: '',
        });
      }
      setError(null);
    }
  }, [open, fundSource, reset]);

  const onSubmit = async (data: FundSourceFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        name: data.name,
        type: data.type,
        grantor: data.grantor || null,
        amount: Number(data.amount),
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        description: data.description || null,
      };

      const url = isEditing
        ? `/api/fund-sources/${fundSource.id}`
        : '/api/fund-sources';

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
    if (fundSource && onDelete) {
      onDelete(fundSource);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '재원 수정' : '새 재원 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">재원명 *</Label>
            <Input
              id="name"
              placeholder="재원명을 입력하세요"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>유형 *</Label>
            <div className="grid grid-cols-3 gap-2">
              {FUND_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant="outline"
                    className={`flex flex-col h-auto py-3 ${
                      isSelected ? type.color : ''
                    }`}
                    onClick={() => setValue('type', type.value as any)}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Grantor */}
          <div className="space-y-2">
            <Label htmlFor="grantor">지원기관</Label>
            <Input
              id="grantor"
              placeholder="지원기관을 입력하세요"
              {...register('grantor')}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">지원금액 *</Label>
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

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="재원에 대한 설명을 입력하세요"
              rows={3}
              {...register('description')}
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
