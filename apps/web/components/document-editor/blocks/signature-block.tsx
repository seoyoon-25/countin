'use client';

import { Input, Label } from '@countin/ui';
import { PenTool } from 'lucide-react';
import { SignatureBlock as SignatureBlockType } from '../types';

interface SignatureBlockProps {
  block: SignatureBlockType;
  onChange: (updates: Partial<SignatureBlockType>) => void;
  isActive: boolean;
}

export function SignatureBlockComponent({ block, onChange, isActive }: SignatureBlockProps) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-center gap-2 text-slate-500 mb-4">
        <PenTool className="w-4 h-4" />
        <span className="text-sm font-medium">서명란</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">구분</Label>
          {isActive ? (
            <Input
              value={block.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="예: 작성자, 승인자"
              className="h-8 text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-slate-700">{block.label || '서명'}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500">성명</Label>
          {isActive ? (
            <Input
              value={block.name || ''}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="성명 입력"
              className="h-8 text-sm"
            />
          ) : (
            <div className="border-b border-slate-300 h-8 flex items-end pb-1">
              <span className="text-sm text-slate-700">{block.name || ''}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-500">날짜</Label>
          {isActive ? (
            <Input
              type="date"
              value={block.date || ''}
              onChange={(e) => onChange({ date: e.target.value })}
              className="h-8 text-sm"
            />
          ) : (
            <div className="border-b border-slate-300 h-8 flex items-end pb-1">
              <span className="text-sm text-slate-700">{block.date || ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
        <div className="text-center text-xs text-slate-400">(서명)</div>
        <div className="h-16 border-b border-slate-300" />
      </div>
    </div>
  );
}
