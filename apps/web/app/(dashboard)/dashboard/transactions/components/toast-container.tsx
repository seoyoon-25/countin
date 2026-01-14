'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Undo2 } from 'lucide-react';
import { Button } from '@countin/ui';
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

interface DeletedTransaction {
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
  deletedAt: number;
}

interface ToastContainerProps {
  deletedTransactions: DeletedTransaction[];
  onUndo: (transaction: DeletedTransaction) => void;
  onDismiss: (id: string) => void;
}

const TOAST_DURATION = 10000; // 10 seconds

export function ToastContainer({
  deletedTransactions,
  onUndo,
  onDismiss,
}: ToastContainerProps) {
  // Auto-dismiss toasts after duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    deletedTransactions.forEach((transaction) => {
      const elapsed = Date.now() - transaction.deletedAt;
      const remaining = TOAST_DURATION - elapsed;

      if (remaining > 0) {
        const timer = setTimeout(() => {
          onDismiss(transaction.id);
        }, remaining);
        timers.push(timer);
      } else {
        onDismiss(transaction.id);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [deletedTransactions, onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {deletedTransactions.map((transaction) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-slate-900 text-white rounded-xl shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">거래가 삭제되었습니다</p>
                <p className="text-slate-400 text-sm mt-1">
                  {transaction.description} - {formatCurrency(transaction.amount)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-slate-800 h-8 px-2"
                  onClick={() => onUndo(transaction)}
                >
                  <Undo2 className="w-4 h-4 mr-1" />
                  되돌리기
                </Button>
                <button
                  onClick={() => onDismiss(transaction.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
              className="mt-3 h-1 bg-slate-700 rounded-full origin-left"
            >
              <div className="h-full bg-primary-500 rounded-full" />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
