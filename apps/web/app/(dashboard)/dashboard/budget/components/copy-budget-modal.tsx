'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@countin/ui';

interface Budget {
  id: string;
  name: string;
  year: number;
}

interface CopyBudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budget: Budget | null;
}

const copyBudgetSchema = z.object({
  name: z.string().min(1, '예산명을 입력해주세요'),
  year: z.number().min(2000).max(2100),
});

type CopyBudgetFormData = z.infer<typeof copyBudgetSchema>;

export function CopyBudgetModal({
  open,
  onClose,
  onSuccess,
  budget,
}: CopyBudgetModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CopyBudgetFormData>({
    resolver: zodResolver(copyBudgetSchema),
    defaultValues: {
      name: '',
      year: currentYear,
    },
  });

  useEffect(() => {
    if (budget && open) {
      setValue('name', `${budget.name} (복사본)`);
      setValue('year', currentYear);
    }
  }, [budget, open, currentYear, setValue]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CopyBudgetFormData) => {
    if (!budget) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/budgets/${budget.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        handleClose();
        onSuccess();
      } else {
        alert(result.error?.message || '복사에 실패했습니다');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate year options
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            예산 복사
          </DialogTitle>
          <DialogDescription>
            {budget?.name}을(를) 복사하여 새 예산을 만듭니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">예산명</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="예산명을 입력하세요"
            />
            {errors.name && (
              <p className="text-sm text-rose-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">연도</Label>
            <Select
              value={currentYear.toString()}
              onValueChange={(value) => setValue('year', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  복사 중...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  복사
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
