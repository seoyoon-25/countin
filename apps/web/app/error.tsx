'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@countin/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Error Animation */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 bg-rose-100 rounded-full flex items-center justify-center mx-auto"
            >
              <AlertTriangle className="w-16 h-16 text-rose-500" />
            </motion.div>
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          문제가 발생했습니다
        </h1>
        <p className="text-slate-500 mb-4">
          죄송합니다. 예기치 않은 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>

        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono">
            오류 코드: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={reset}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </Button>
          </Link>
        </div>

        {/* Support Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-slate-50 rounded-lg"
        >
          <p className="text-sm text-slate-500">
            문제가 계속되면{' '}
            <a href="mailto:support@countin.app" className="text-primary-600 hover:underline">
              support@countin.app
            </a>
            으로 문의해 주세요.
          </p>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-medium">CountIn</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
