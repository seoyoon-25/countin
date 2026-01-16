'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@countin/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="text-[180px] font-bold text-slate-100 leading-none">
              404
            </span>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Search className="w-24 h-24 text-primary-500" />
            </motion.div>
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-slate-500 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          주소를 다시 확인해 주세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 페이지
          </Button>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </Button>
          </Link>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
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
