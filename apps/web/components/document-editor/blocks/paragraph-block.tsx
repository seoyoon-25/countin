'use client';

import { useRef, useEffect } from 'react';
import { Textarea } from '@countin/ui';
import { ParagraphBlock as ParagraphBlockType } from '../types';

interface ParagraphBlockProps {
  block: ParagraphBlockType;
  onChange: (updates: Partial<ParagraphBlockType>) => void;
  isActive: boolean;
}

export function ParagraphBlockComponent({ block, onChange, isActive }: ParagraphBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
    }
  }, [block.content]);

  return (
    <textarea
      ref={textareaRef}
      value={block.content}
      onChange={(e) => onChange({ content: e.target.value })}
      placeholder="내용을 입력하세요..."
      className="w-full bg-transparent border-none outline-none resize-none text-slate-700 leading-relaxed placeholder:text-slate-300 min-h-[80px]"
    />
  );
}
