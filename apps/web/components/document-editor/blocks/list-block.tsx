'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@countin/ui';
import { List, ListOrdered } from 'lucide-react';
import { ListBlock as ListBlockType, ListStyle } from '../types';

interface ListBlockProps {
  block: ListBlockType;
  onChange: (updates: Partial<ListBlockType>) => void;
  isActive: boolean;
}

export function ListBlockComponent({ block, onChange, isActive }: ListBlockProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const toggleStyle = () => {
    onChange({ style: block.style === 'bullet' ? 'numbered' : 'bullet' });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...block.items];
    newItems[index] = value;
    onChange({ items: newItems });
  };

  const addItem = (afterIndex: number) => {
    const newItems = [...block.items];
    newItems.splice(afterIndex + 1, 0, '');
    onChange({ items: newItems });
    // Focus the new item
    setTimeout(() => {
      inputRefs.current[afterIndex + 1]?.focus();
    }, 0);
  };

  const removeItem = (index: number) => {
    if (block.items.length <= 1) return;
    const newItems = block.items.filter((_, i) => i !== index);
    onChange({ items: newItems });
    // Focus previous item
    setTimeout(() => {
      const focusIndex = Math.max(0, index - 1);
      inputRefs.current[focusIndex]?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(index);
    } else if (e.key === 'Backspace' && !block.items[index] && block.items.length > 1) {
      e.preventDefault();
      removeItem(index);
    }
  };

  return (
    <div className="space-y-1">
      {isActive && (
        <div className="flex gap-1 mb-2">
          <Button
            variant={block.style === 'bullet' ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2"
            onClick={() => onChange({ style: 'bullet' })}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={block.style === 'numbered' ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2"
            onClick={() => onChange({ style: 'numbered' })}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>
      )}
      {block.items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-slate-400 w-6 text-right">
            {block.style === 'bullet' ? '•' : `${index + 1}.`}
          </span>
          <input
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            placeholder="목록 항목..."
            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-300"
          />
        </div>
      ))}
    </div>
  );
}
