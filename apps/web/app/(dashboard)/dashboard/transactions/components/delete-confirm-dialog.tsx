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
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: Transaction | null;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  transaction,
}: DeleteConfirmDialogProps) {
  if (!transaction) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'INCOME':
        return '수입';
      case 'EXPENSE':
        return '지출';
      default:
        return '이체';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </motion.div>
          <DialogTitle className="text-center">거래를 삭제하시겠습니까?</DialogTitle>
          <DialogDescription className="text-center">
            이 작업은 되돌릴 수 있습니다
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 bg-slate-50 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">날짜</span>
            <span className="font-medium">{formatDate(new Date(transaction.date))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">유형</span>
            <span className="font-medium">{getTypeLabel(transaction.type)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">적요</span>
            <span className="font-medium">{transaction.description}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">금액</span>
            <span
              className={`font-semibold ${
                transaction.type === 'INCOME'
                  ? 'text-emerald-600'
                  : transaction.type === 'EXPENSE'
                    ? 'text-rose-600'
                    : 'text-blue-600'
              }`}
            >
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
