'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, Reorder, useDragControls } from 'framer-motion';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
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

interface BudgetItem {
  id?: string;
  accountId: string | null;
  category: string;
  plannedAmount: number;
  description: string | null;
  sortOrder: number;
}

interface Budget {
  id: string;
  name: string;
  year: number;
  status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  projectId: string | null;
  items: BudgetItem[];
}

interface BudgetFormProps {
  budget?: Budget | null;
  isEdit?: boolean;
}

const budgetItemSchema = z.object({
  id: z.string().optional(),
  accountId: z.string().nullable(),
  category: z.string().min(1, '카테고리를 입력해주세요'),
  plannedAmount: z.number().min(0, '금액은 0 이상이어야 합니다'),
  description: z.string().nullable(),
  sortOrder: z.number(),
});

const budgetFormSchema = z.object({
  name: z.string().min(1, '예산명을 입력해주세요'),
  year: z.number().min(2000).max(2100),
  projectId: z.string().nullable(),
  status: z.enum(['DRAFT', 'APPROVED', 'ARCHIVED']),
  items: z.array(budgetItemSchema),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

const CATEGORY_OPTIONS = [
  { value: 'INCOME_운영수입', label: '운영수입' },
  { value: 'INCOME_사업수입', label: '사업수입' },
  { value: 'INCOME_기부금', label: '기부금' },
  { value: 'INCOME_보조금', label: '보조금' },
  { value: 'INCOME_기타수입', label: '기타수입' },
  { value: 'EXPENSE_인건비', label: '인건비' },
  { value: 'EXPENSE_운영비', label: '운영비' },
  { value: 'EXPENSE_사업비', label: '사업비' },
  { value: 'EXPENSE_시설관리비', label: '시설관리비' },
  { value: 'EXPENSE_기타지출', label: '기타지출' },
];

function DraggableItem({
  item,
  index,
  accounts,
  register,
  setValue,
  errors,
  onRemove,
}: {
  item: BudgetItem;
  index: number;
  accounts: Account[];
  register: any;
  setValue: any;
  errors: any;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="bg-white border border-slate-200 rounded-lg p-4 mb-2"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={item.category}
              onValueChange={(value) => setValue(`items.${index}.category`, value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" disabled>
                  카테고리 선택
                </SelectItem>
                <div className="px-2 py-1 text-xs font-medium text-slate-500">수입</div>
                {CATEGORY_OPTIONS.filter((c) => c.value.startsWith('INCOME')).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs font-medium text-slate-500 mt-1">지출</div>
                {CATEGORY_OPTIONS.filter((c) => c.value.startsWith('EXPENSE')).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.items?.[index]?.category && (
              <p className="text-xs text-rose-500">{errors.items[index].category.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">계정과목</Label>
            <Select
              value={item.accountId || ''}
              onValueChange={(value) => setValue(`items.${index}.accountId`, value || null)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">선택 안함</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">계획 금액</Label>
            <Input
              type="number"
              className="h-9"
              {...register(`items.${index}.plannedAmount`, { valueAsNumber: true })}
            />
            {errors?.items?.[index]?.plannedAmount && (
              <p className="text-xs text-rose-500">{errors.items[index].plannedAmount.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Input
              className="h-9"
              placeholder="설명 (선택사항)"
              {...register(`items.${index}.description`)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="mt-2 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export function BudgetForm({ budget, isEdit }: BudgetFormProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: budget?.name || '',
      year: budget?.year || currentYear,
      projectId: budget?.projectId || null,
      status: budget?.status || 'DRAFT',
      items: budget?.items || [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, projectsRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/projects'),
        ]);

        const accountsData = await accountsRes.json();
        const projectsData = await projectsRes.json();

        if (accountsData.success) {
          setAccounts(accountsData.data);
        }
        if (projectsData.success) {
          setProjects(projectsData.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = () => {
    append({
      accountId: null,
      category: '',
      plannedAmount: 0,
      description: null,
      sortOrder: fields.length,
    });
  };

  const handleReorder = (newOrder: BudgetItem[]) => {
    // Update the form with new order
    newOrder.forEach((item, index) => {
      const currentIndex = fields.findIndex((f) => f.id === (item as any).id);
      if (currentIndex !== index) {
        move(currentIndex, index);
      }
    });
  };

  const onSubmit = async (data: BudgetFormData) => {
    setIsLoading(true);
    try {
      const url = isEdit ? `/api/budgets/${budget?.id}` : '/api/budgets';
      const method = isEdit ? 'PATCH' : 'POST';

      // Update sort orders
      const itemsWithOrder = data.items.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          items: itemsWithOrder,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/budget');
      } else {
        alert(result.error?.message || '저장에 실패했습니다');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totalIncome = watchedItems
    ?.filter((item) => item.category?.startsWith('INCOME'))
    .reduce((sum, item) => sum + (item.plannedAmount || 0), 0) || 0;

  const totalExpense = watchedItems
    ?.filter((item) => item.category?.startsWith('EXPENSE'))
    .reduce((sum, item) => sum + (item.plannedAmount || 0), 0) || 0;

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? '예산 수정' : '새 예산'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? '예산 정보를 수정하세요' : '새로운 예산을 등록하세요'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">예산명 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="예: 2024년 운영예산"
                />
                {errors.name && (
                  <p className="text-sm text-rose-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">연도 *</Label>
                <Select
                  value={watch('year')?.toString()}
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

              <div className="space-y-2">
                <Label htmlFor="projectId">프로젝트</Label>
                <Select
                  value={watch('projectId') || ''}
                  onValueChange={(value) => setValue('projectId', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="프로젝트 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체 조직</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value: 'DRAFT' | 'APPROVED' | 'ARCHIVED') =>
                    setValue('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">초안</SelectItem>
                    <SelectItem value="APPROVED">승인됨</SelectItem>
                    <SelectItem value="ARCHIVED">보관됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>예산 항목</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-2" />
              항목 추가
            </Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="mb-4">등록된 예산 항목이 없습니다</p>
                <Button type="button" variant="outline" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  첫 항목 추가
                </Button>
              </div>
            ) : (
              <div>
                <Reorder.Group
                  axis="y"
                  values={watchedItems || []}
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                  {fields.map((field, index) => (
                    <DraggableItem
                      key={field.id}
                      item={watchedItems?.[index] || field}
                      index={index}
                      accounts={accounts}
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </Reorder.Group>

                {/* Summary */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-emerald-600 font-medium">총 수입</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(totalIncome)}
                      </p>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-lg">
                      <p className="text-sm text-rose-600 font-medium">총 지출</p>
                      <p className="text-xl font-bold text-rose-700">
                        {formatCurrency(totalExpense)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${totalIncome - totalExpense >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
                      <p className={`text-sm font-medium ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        차액
                      </p>
                      <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                        {formatCurrency(totalIncome - totalExpense)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
