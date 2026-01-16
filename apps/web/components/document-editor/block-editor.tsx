'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Copy, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@countin/ui';
import { Block, BlockType, createBlock } from './types';
import { BlockSelector } from './block-selector';
import {
  HeadingBlockComponent,
  ParagraphBlockComponent,
  ListBlockComponent,
  TableBlockComponent,
  DividerBlockComponent,
  ImageBlockComponent,
  SignatureBlockComponent,
  BudgetTableBlockComponent,
  SettlementTableBlockComponent,
} from './blocks';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onSave?: () => Promise<void>;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

interface SortableBlockProps {
  block: Block;
  isActive: boolean;
  onClick: () => void;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddBelow: (type: BlockType) => void;
}

function SortableBlock({
  block,
  isActive,
  onClick,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddBelow,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const [showSelector, setShowSelector] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'heading':
        return (
          <HeadingBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      case 'paragraph':
        return (
          <ParagraphBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      case 'list':
        return (
          <ListBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      case 'table':
        return (
          <TableBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      case 'divider':
        return <DividerBlockComponent block={block} isActive={isActive} />;
      case 'image':
        return (
          <ImageBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      case 'signature':
        return (
          <SignatureBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      case 'budget-table':
        return (
          <BudgetTableBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      case 'settlement-table':
        return (
          <SettlementTableBlockComponent
            block={block}
            onChange={onUpdate}
            isActive={isActive}
          />
        );
      default:
        return <div>Unknown block type</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'opacity-50' : ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex gap-2 p-3 rounded-xl border transition-all ${
          isActive
            ? 'border-blue-200 bg-blue-50/30 shadow-sm'
            : 'border-transparent hover:border-slate-200 hover:bg-slate-50/50'
        }`}
        onClick={onClick}
      >
        {/* Block Controls */}
        <div className={`flex flex-col gap-1 pt-1 transition-opacity ${isActive || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSelector(true);
              }}
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
            >
              <Plus className="w-4 h-4" />
            </button>
            {showSelector && (
              <div className="absolute left-8 top-0 z-50">
                <BlockSelector
                  isOpen={showSelector}
                  onClose={() => setShowSelector(false)}
                  onSelect={(type) => {
                    onAddBelow(type);
                    setShowSelector(false);
                  }}
                />
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Block Content */}
        <div className="flex-1 min-w-0">{renderBlock()}</div>
      </motion.div>
    </div>
  );
}

export function BlockEditor({ blocks, onChange, onSave, saveStatus = 'idle' }: BlockEditorProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showMainSelector, setShowMainSelector] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const updateBlock = useCallback(
    (id: string, updates: Partial<Block>) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } as Block : b)));
    },
    [blocks, onChange]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      if (blocks.length <= 1) return;
      onChange(blocks.filter((b) => b.id !== id));
      setActiveBlockId(null);
    },
    [blocks, onChange]
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index === -1) return;
      const block = blocks[index];
      const newBlock = {
        ...JSON.parse(JSON.stringify(block)),
        id: Math.random().toString(36).substr(2, 9),
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onChange(newBlocks);
      setActiveBlockId(newBlock.id);
    },
    [blocks, onChange]
  );

  const addBlock = useCallback(
    (type: BlockType, afterId?: string) => {
      const newBlock = createBlock(type);
      if (afterId) {
        const index = blocks.findIndex((b) => b.id === afterId);
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        onChange(newBlocks);
      } else {
        onChange([...blocks, newBlock]);
      }
      setActiveBlockId(newBlock.id);
    },
    [blocks, onChange]
  );

  // Handle slash command
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !showSlashMenu) {
        // Check if we're in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          const inputTarget = target as HTMLInputElement | HTMLTextAreaElement;
          // Only trigger if input is empty or cursor is at start
          if (inputTarget.value === '' || inputTarget.selectionStart === 0) {
            setShowSlashMenu(true);
            setSlashQuery('/');
          }
        }
      } else if (showSlashMenu) {
        if (e.key === 'Escape') {
          setShowSlashMenu(false);
          setSlashQuery('');
        } else if (e.key === 'Backspace' && slashQuery.length <= 1) {
          setShowSlashMenu(false);
          setSlashQuery('');
        } else if (e.key.length === 1) {
          setSlashQuery((prev) => prev + e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSlashMenu, slashQuery]);

  // Auto-save with debounce
  useEffect(() => {
    if (!onSave) return;

    const timer = setTimeout(() => {
      onSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [blocks, onSave]);

  // Save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            저장 중...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <Check className="w-4 h-4" />
            저장됨
          </div>
        );
      case 'error':
        return (
          <div className="text-sm text-rose-600">저장 실패</div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Save Status */}
      <div className="absolute -top-8 right-0">{renderSaveStatus()}</div>

      {/* Blocks */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            <AnimatePresence>
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isActive={activeBlockId === block.id}
                  onClick={() => setActiveBlockId(block.id)}
                  onUpdate={(updates) => updateBlock(block.id, updates)}
                  onDelete={() => deleteBlock(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onAddBelow={(type) => addBlock(type, block.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Block Button */}
      <div className="relative mt-4">
        <Button
          variant="ghost"
          onClick={() => setShowMainSelector(true)}
          className="w-full text-slate-400 hover:text-slate-600 border-2 border-dashed border-slate-200 hover:border-slate-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          블록 추가 (/ 입력)
        </Button>
        {showMainSelector && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2">
            <BlockSelector
              isOpen={showMainSelector}
              onClose={() => setShowMainSelector(false)}
              onSelect={(type) => {
                addBlock(type);
                setShowMainSelector(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Slash Menu (floating) */}
      {showSlashMenu && (
        <div className="fixed z-50" style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <BlockSelector
            isOpen={showSlashMenu}
            onClose={() => {
              setShowSlashMenu(false);
              setSlashQuery('');
            }}
            onSelect={(type) => {
              addBlock(type, activeBlockId || undefined);
              setShowSlashMenu(false);
              setSlashQuery('');
            }}
            searchQuery={slashQuery}
          />
        </div>
      )}
    </div>
  );
}
