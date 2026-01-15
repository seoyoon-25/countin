'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@countin/ui';
import { formatCurrency, formatDate } from '@countin/utils';

interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  budgetAmount: number;
  _count: {
    transactions: number;
  };
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  project: Project | null;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  project,
}: DeleteConfirmDialogProps) {
  if (!project) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return '계획중';
      case 'ACTIVE':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소';
      default:
        return status;
    }
  };

  const hasTransactions = project._count.transactions > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${
              hasTransactions ? 'bg-amber-100' : 'bg-red-100'
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${
                hasTransactions ? 'text-amber-600' : 'text-red-600'
              }`}
            />
          </motion.div>
          <DialogTitle className="text-center">
            {hasTransactions
              ? '삭제할 수 없습니다'
              : '프로젝트를 삭제하시겠습니까?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {hasTransactions
              ? '이 프로젝트에 거래가 있습니다'
              : '이 작업은 되돌릴 수 없습니다'}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 bg-slate-50 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">프로젝트명</span>
            <span className="font-medium">{project.name}</span>
          </div>
          {project.code && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">코드</span>
              <span className="font-mono font-medium">{project.code}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">상태</span>
            <span className="font-medium">{getStatusLabel(project.status)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">예산</span>
            <span className="font-medium">{formatCurrency(project.budgetAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">거래 수</span>
            <span
              className={`font-semibold ${
                hasTransactions ? 'text-amber-600' : 'text-slate-600'
              }`}
            >
              {project._count.transactions}건
            </span>
          </div>
        </div>

        {hasTransactions && (
          <p className="text-sm text-amber-600 text-center mb-4">
            먼저 이 프로젝트의 거래를 삭제하거나 다른 프로젝트로 이동해주세요.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {hasTransactions ? '확인' : '취소'}
          </Button>
          {!hasTransactions && (
            <Button variant="destructive" onClick={onConfirm}>
              삭제
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
