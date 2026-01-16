'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@countin/ui';
import { HeadingBlock as HeadingBlockType, HeadingLevel } from '../types';

interface HeadingBlockProps {
  block: HeadingBlockType;
  onChange: (updates: Partial<HeadingBlockType>) => void;
  isActive: boolean;
}

const HEADING_STYLES: Record<HeadingLevel, string> = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-medium',
};

export function HeadingBlockComponent({ block, onChange, isActive }: HeadingBlockProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  return (
    <div className="flex items-start gap-2">
      {isActive && (
        <Select
          value={block.level}
          onValueChange={(value) => onChange({ level: value as HeadingLevel })}
        >
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1</SelectItem>
            <SelectItem value="h2">H2</SelectItem>
            <SelectItem value="h3">H3</SelectItem>
          </SelectContent>
        </Select>
      )}
      <input
        ref={inputRef}
        type="text"
        value={block.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder={`제목 ${block.level.charAt(1)} 입력...`}
        className={`flex-1 bg-transparent border-none outline-none ${HEADING_STYLES[block.level]} text-slate-900 placeholder:text-slate-300`}
      />
    </div>
  );
}
