'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@countin/ui';

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  tenantName?: string;
}

export function Header({ user, tenantName }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Left side - Tenant name or breadcrumb */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {tenantName || '조직을 선택해주세요'}
        </h2>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User dropdown */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || ''}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-primary-600 font-medium">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-500"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
