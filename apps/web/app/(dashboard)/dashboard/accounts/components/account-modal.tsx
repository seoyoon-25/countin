'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Wand2 } from 'lucide-react';
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

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: Account | null;
  onDelete?: (account: Account) => void;
}

const ACCOUNT_TYPES = [
  { value: 'ASSET', label: '자산', prefix: '1' },
  { value: 'LIABILITY', label: '부채', prefix: '2' },
  { value: 'EQUITY', label: '자본', prefix: '3' },
  { value: 'REVENUE', label: '수익', prefix: '4' },
  { value: 'EXPENSE', label: '비용', prefix: '5' },
];

const accountSchema = z.object({
  code: z.string().min(1, '계정코드를 입력해주세요'),
  name: z.string().min(1, '계정명을 입력해주세요'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], '계정유형을 선택해주세요'),
  category: z.string().optional(),
  description: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export function AccountModal({
  open,
  onClose,
  onSuccess,
  account,
  onDelete,
}: AccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!account;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'EXPENSE',
      category: '',
      description: '',
    },
  });

  const selectedType = watch('type');

  // Reset form when account changes or modal opens
  useEffect(() => {
    if (open) {
      if (account) {
        reset({
          code: account.code,
          name: account.name,
          type: account.type,
          category: account.category || '',
          description: account.description || '',
        });
      } else {
        reset({
          code: '',
          name: '',
          type: 'EXPENSE',
          category: '',
          description: '',
        });
      }
      setError(null);
    }
  }, [open, account, reset]);

  const generateCode = async () => {
    const type = watch('type');
    const prefix = ACCOUNT_TYPES.find((t) => t.value === type)?.prefix || '5';

    try {
      const response = await fetch(`/api/accounts?type=${type}`);
      const data = await response.json();

      if (data.success) {
        const existingCodes = data.data
          .map((a: Account) => parseInt(a.code))
          .filter((c: number) => !isNaN(c) && c.toString().startsWith(prefix));

        let nextCode = parseInt(prefix + '01');
        while (existingCodes.includes(nextCode)) {
          nextCode++;
        }

        setValue('code', nextCode.toString().padStart(3, '0'));
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
    }
  };

  const onSubmit = async (data: AccountFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        code: data.code,
        name: data.name,
        type: data.type,
        category: data.category || null,
        description: data.description || null,
      };

      const url = isEditing
        ? `/api/accounts/${account.id}`
        : '/api/accounts';

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
    if (account && onDelete) {
      onDelete(account);
      onClose();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'LIABILITY':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'EQUITY':
        return 'bg-purple-600 hover:bg-purple-700';
      case 'REVENUE':
        return 'bg-emerald-600 hover:bg-emerald-700';
      case 'EXPENSE':
        return 'bg-rose-600 hover:bg-rose-700';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '계정과목 수정' : '새 계정과목 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Type */}
          <div className="space-y-2">
            <Label>계정유형</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {ACCOUNT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  size="sm"
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  className={
                    selectedType === type.value
                      ? getTypeColor(type.value)
                      : ''
                  }
                  onClick={() => setValue('type', type.value as any)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">계정코드</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="예: 101"
                {...register('code')}
                className={`flex-1 font-mono ${errors.code ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateCode}
                title="코드 자동 생성"
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">계정명</Label>
            <Input
              id="name"
              placeholder="예: 현금"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리 (선택)</Label>
            <Input
              id="category"
              placeholder="예: 유동자산, 판매비와관리비"
              {...register('category')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="계정과목에 대한 설명을 입력하세요"
              rows={2}
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
