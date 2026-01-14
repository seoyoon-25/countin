'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  tenantName?: string;
}

export function DashboardShell({ children, user, tenantName }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          tenantName={tenantName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
