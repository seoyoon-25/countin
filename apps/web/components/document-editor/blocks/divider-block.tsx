'use client';

import { DividerBlock as DividerBlockType } from '../types';

interface DividerBlockProps {
  block: DividerBlockType;
  isActive: boolean;
}

export function DividerBlockComponent({ block, isActive }: DividerBlockProps) {
  return (
    <div className={`py-2 ${isActive ? 'bg-blue-50/50 -mx-3 px-3 rounded' : ''}`}>
      <hr className="border-slate-300" />
    </div>
  );
}
