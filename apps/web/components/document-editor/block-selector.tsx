'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heading1,
  Type,
  List,
  Table,
  Minus,
  Image,
  PenTool,
  Calculator,
  FileCheck,
} from 'lucide-react';
import { BlockType, BLOCK_METADATA } from './types';

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  heading: <Heading1 className="w-5 h-5" />,
  paragraph: <Type className="w-5 h-5" />,
  list: <List className="w-5 h-5" />,
  table: <Table className="w-5 h-5" />,
  divider: <Minus className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  signature: <PenTool className="w-5 h-5" />,
  'budget-table': <Calculator className="w-5 h-5" />,
  'settlement-table': <FileCheck className="w-5 h-5" />,
};

interface BlockSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  searchQuery?: string;
  position?: { top: number; left: number };
}

export function BlockSelector({ isOpen, onClose, onSelect, searchQuery = '', position }: BlockSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter blocks based on search query
  const filteredBlocks = BLOCK_METADATA.filter((block) => {
    const query = searchQuery.toLowerCase().replace(/^\//, '');
    return (
      block.name.toLowerCase().includes(query) ||
      block.description.toLowerCase().includes(query) ||
      block.shortcut?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: globalThis.KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredBlocks.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
            break;
          case 'Enter':
            e.preventDefault();
            if (filteredBlocks[selectedIndex]) {
              onSelect(filteredBlocks[selectedIndex].type);
              onClose();
            }
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedIndex, filteredBlocks, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute z-50 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
        style={position ? { top: position.top, left: position.left } : undefined}
      >
        <div className="p-2 border-b border-slate-100">
          <p className="text-xs text-slate-400 px-2">블록 유형 선택</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {filteredBlocks.length > 0 ? (
            filteredBlocks.map((block, index) => (
              <button
                key={block.type}
                onClick={() => {
                  onSelect(block.type);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  index === selectedIndex ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  {BLOCK_ICONS[block.type]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{block.name}</span>
                    {block.shortcut && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {block.shortcut}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{block.description}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              일치하는 블록이 없습니다
            </div>
          )}
        </div>
        <div className="p-2 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            ↑↓ 이동 • Enter 선택 • Esc 닫기
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
