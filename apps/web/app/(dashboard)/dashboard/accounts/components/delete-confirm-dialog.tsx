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

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  account: Account | null;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  account,
}: DeleteConfirmDialogProps) {
  if (!account) return null;

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

  const hasTransactions = account._count.transactions > 0;

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
              : '계정과목을 삭제하시겠습니까?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {hasTransactions
              ? '이 계정과목에 거래가 있습니다'
              : '이 작업은 되돌릴 수 없습니다'}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 bg-slate-50 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">코드</span>
            <span className="font-mono font-medium">{account.code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">계정명</span>
            <span className="font-medium">{account.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">유형</span>
            <span className="font-medium">{getTypeLabel(account.type)}</span>
          </div>
          {account.category && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">카테고리</span>
              <span className="font-medium">{account.category}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">거래 수</span>
            <span
              className={`font-semibold ${
                hasTransactions ? 'text-amber-600' : 'text-slate-600'
              }`}
            >
              {account._count.transactions}건
            </span>
          </div>
        </div>

        {hasTransactions && (
          <p className="text-sm text-amber-600 text-center mb-4">
            먼저 이 계정과목의 거래를 삭제하거나 다른 계정으로 이동해주세요.
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
