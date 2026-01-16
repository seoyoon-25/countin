'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, X, User, Users } from 'lucide-react';
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
  Badge,
} from '@countin/ui';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  budgetAmount: number;
  incomeAmount: number;
  expenseAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progress: number;
  managerId?: string | null;
  manager?: Member | null;
  members?: { userId: string; role: string; user?: Member }[];
  _count: {
    transactions: number;
  };
}

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: Project | null;
  onDelete?: (project: Project) => void;
}

const PROJECT_STATUSES = [
  { value: 'PLANNING', label: '계획중' },
  { value: 'ACTIVE', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
];

const projectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요'),
  code: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetAmount: z
    .string()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: '유효한 금액을 입력해주세요',
    })
    .optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  managerId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function ProjectModal({
  open,
  onClose,
  onSuccess,
  project,
  onDelete,
}: ProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);

  const isEditing = !!project;

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members');
        const data = await response.json();
        if (data.success) {
          setMembers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setMembersLoaded(true);
      }
    };

    if (open && !membersLoaded) {
      fetchMembers();
    }
  }, [open, membersLoaded]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      startDate: '',
      endDate: '',
      budgetAmount: '',
      status: 'PLANNING',
      managerId: '',
    },
  });

  const selectedStatus = watch('status');
  const selectedManagerId = watch('managerId');

  // Reset form when project changes or modal opens
  useEffect(() => {
    if (open) {
      if (project) {
        reset({
          name: project.name,
          code: project.code || '',
          description: project.description || '',
          startDate: project.startDate
            ? new Date(project.startDate).toISOString().split('T')[0]
            : '',
          endDate: project.endDate
            ? new Date(project.endDate).toISOString().split('T')[0]
            : '',
          budgetAmount: project.budgetAmount ? project.budgetAmount.toString() : '',
          status: project.status,
          managerId: project.managerId || '',
        });
        // Set member IDs
        const memberIds = project.members?.map(m => m.userId) || [];
        setSelectedMemberIds(memberIds);
      } else {
        reset({
          name: '',
          code: '',
          description: '',
          startDate: '',
          endDate: '',
          budgetAmount: '',
          status: 'PLANNING',
          managerId: '',
        });
        setSelectedMemberIds([]);
      }
      setError(null);
    }
  }, [open, project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        budgetAmount: data.budgetAmount ? Number(data.budgetAmount) : 0,
        status: data.status,
        managerId: data.managerId || null,
        memberIds: selectedMemberIds,
      };

      const url = isEditing
        ? `/api/projects/${project.id}`
        : '/api/projects';

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

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleDelete = () => {
    if (project && onDelete) {
      onDelete(project);
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-slate-600 hover:bg-slate-700';
      case 'ACTIVE':
        return 'bg-emerald-600 hover:bg-emerald-700';
      case 'COMPLETED':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'CANCELLED':
        return 'bg-rose-600 hover:bg-rose-700';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '프로젝트 수정' : '새 프로젝트 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">프로젝트명 *</Label>
            <Input
              id="name"
              placeholder="예: 2024년 교육 프로그램"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">프로젝트 코드 (선택)</Label>
            <Input
              id="code"
              placeholder="예: PRJ-2024-001"
              {...register('code')}
              className="font-mono"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="프로젝트에 대한 설명을 입력하세요"
              rows={2}
              {...register('description')}
            />
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

          {/* Budget Amount */}
          <div className="space-y-2">
            <Label htmlFor="budgetAmount">예산 총액</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                ₩
              </span>
              <Input
                id="budgetAmount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                {...register('budgetAmount')}
                className={`pl-8 ${errors.budgetAmount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.budgetAmount && (
              <p className="text-sm text-red-500">{errors.budgetAmount.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>상태</Label>
            <div className="grid grid-cols-4 gap-2">
              {PROJECT_STATUSES.map((status) => (
                <Button
                  key={status.value}
                  type="button"
                  size="sm"
                  variant={selectedStatus === status.value ? 'default' : 'outline'}
                  className={
                    selectedStatus === status.value
                      ? getStatusColor(status.value)
                      : ''
                  }
                  onClick={() => setValue('status', status.value as any)}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Manager */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              주 담당자
            </Label>
            <Select
              value={selectedManagerId || ''}
              onValueChange={(value) => setValue('managerId', value || '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="담당자 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">선택 안함</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Members */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              부 담당자 (선택)
            </Label>
            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
              {members.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">
                  멤버가 없습니다
                </p>
              ) : (
                members
                  .filter(m => m.id !== selectedManagerId)
                  .map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{member.name}</span>
                      <span className="text-xs text-slate-400">{member.email}</span>
                    </label>
                  ))
              )}
            </div>
            {selectedMemberIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedMemberIds.map((id) => {
                  const member = members.find(m => m.id === id);
                  if (!member) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {member.name}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => toggleMember(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
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
