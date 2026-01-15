'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Table,
  Minus,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  Send,
  Archive,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@countin/ui';

interface Block {
  id: string;
  type: 'heading1' | 'heading2' | 'paragraph' | 'bulletList' | 'numberedList' | 'table' | 'divider';
  content: string;
  tableData?: string[][];
}

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  content: string;
  projectId: string | null;
  project: {
    id: string;
    name: string;
  } | null;
}

const BLOCK_TYPES = [
  { type: 'heading1', label: '제목 1', icon: Heading1 },
  { type: 'heading2', label: '제목 2', icon: Heading2 },
  { type: 'paragraph', label: '본문', icon: Type },
  { type: 'bulletList', label: '글머리 목록', icon: List },
  { type: 'numberedList', label: '번호 목록', icon: ListOrdered },
  { type: 'table', label: '표', icon: Table },
  { type: 'divider', label: '구분선', icon: Minus },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '작성중', icon: Clock, color: 'bg-slate-100 text-slate-700' },
  { value: 'REVIEW', label: '검토요청', icon: Send, color: 'bg-amber-100 text-amber-700' },
  { value: 'APPROVED', label: '승인', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ARCHIVED', label: '보관', icon: Archive, color: 'bg-blue-100 text-blue-700' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function DocumentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${id}`);
        const result = await response.json();

        if (result.success) {
          setDocument(result.data);
          setTitle(result.data.title);
          try {
            const parsedContent = JSON.parse(result.data.content);
            setBlocks(Array.isArray(parsedContent) ? parsedContent : []);
          } catch {
            setBlocks([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch document:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleSave = useCallback(async () => {
    if (!document) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: JSON.stringify(blocks),
        }),
      });

      if (response.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  }, [id, title, blocks, document]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        setDocument(result.data);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const addBlock = (type: Block['type'], afterId?: string) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      ...(type === 'table' && {
        tableData: [
          ['', '', ''],
          ['', '', ''],
        ],
      }),
    };

    setBlocks((prev) => {
      if (afterId) {
        const index = prev.findIndex((b) => b.id === afterId);
        const newBlocks = [...prev];
        newBlocks.splice(index + 1, 0, newBlock);
        return newBlocks;
      }
      return [...prev, newBlock];
    });

    setActiveBlockId(newBlock.id);
    setHasChanges(true);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...updates } : block)));
    setHasChanges(true);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    setHasChanges(true);
  };

  const updateTableCell = (blockId: string, rowIdx: number, colIdx: number, value: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === blockId && block.tableData) {
          const newTableData = block.tableData.map((row, ri) =>
            ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? value : cell)) : row
          );
          return { ...block, tableData: newTableData };
        }
        return block;
      })
    );
    setHasChanges(true);
  };

  const addTableRow = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === blockId && block.tableData) {
          const cols = block.tableData[0]?.length || 3;
          return { ...block, tableData: [...block.tableData, Array(cols).fill('')] };
        }
        return block;
      })
    );
    setHasChanges(true);
  };

  const addTableCol = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === blockId && block.tableData) {
          return { ...block, tableData: block.tableData.map((row) => [...row, '']) };
        }
        return block;
      })
    );
    setHasChanges(true);
  };

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const renderBlock = (block: Block) => {
    const isActive = activeBlockId === block.id;

    switch (block.type) {
      case 'heading1':
        return (
          <Input
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="text-2xl font-bold border-none focus-visible:ring-0 px-0"
            placeholder="제목 1"
          />
        );
      case 'heading2':
        return (
          <Input
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="text-xl font-semibold border-none focus-visible:ring-0 px-0"
            placeholder="제목 2"
          />
        );
      case 'paragraph':
        return (
          <Textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="border-none focus-visible:ring-0 px-0 resize-none min-h-[80px]"
            placeholder="내용을 입력하세요..."
          />
        );
      case 'bulletList':
      case 'numberedList':
        return (
          <div className="space-y-1">
            {(block.content || '').split('\n').map((line, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 mt-2">
                  {block.type === 'bulletList' ? '•' : `${idx + 1}.`}
                </span>
                <Input
                  value={line}
                  onChange={(e) => {
                    const lines = (block.content || '').split('\n');
                    lines[idx] = e.target.value;
                    updateBlock(block.id, { content: lines.join('\n') });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const lines = (block.content || '').split('\n');
                      lines.splice(idx + 1, 0, '');
                      updateBlock(block.id, { content: lines.join('\n') });
                    }
                    if (e.key === 'Backspace' && !line && (block.content || '').split('\n').length > 1) {
                      e.preventDefault();
                      const lines = (block.content || '').split('\n');
                      lines.splice(idx, 1);
                      updateBlock(block.id, { content: lines.join('\n') });
                    }
                  }}
                  className="border-none focus-visible:ring-0 px-0"
                  placeholder="목록 항목"
                />
              </div>
            ))}
          </div>
        );
      case 'table':
        return (
          <div className="space-y-2">
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <tbody>
                  {block.tableData?.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b last:border-b-0">
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="border-r last:border-r-0 p-0">
                          <Input
                            value={cell}
                            onChange={(e) => updateTableCell(block.id, rowIdx, colIdx, e.target.value)}
                            className="border-none focus-visible:ring-0 rounded-none h-10"
                            placeholder={rowIdx === 0 ? '헤더' : '내용'}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isActive && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addTableRow(block.id)}>
                  행 추가
                </Button>
                <Button variant="outline" size="sm" onClick={() => addTableCol(block.id)}>
                  열 추가
                </Button>
              </div>
            )}
          </div>
        );
      case 'divider':
        return <hr className="border-slate-200 my-2" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-slate-500">문서를 찾을 수 없습니다</p>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === document.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            문서 목록
          </Button>
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              저장되지 않은 변경
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {currentStatus && (
                  <>
                    <currentStatus.icon className="w-4 h-4 mr-2" />
                    {currentStatus.label}
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={document.status === status.value ? 'bg-slate-100' : ''}
                >
                  <status.icon className="w-4 h-4 mr-2" />
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/documents/${id}`)}>
            <Eye className="w-4 h-4 mr-2" />
            미리보기
          </Button>

          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* Document Title */}
      <Card>
        <CardContent className="pt-6">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            className="text-2xl font-bold border-none focus-visible:ring-0 px-0 h-auto"
            placeholder="문서 제목"
          />
        </CardContent>
      </Card>

      {/* Document Content */}
      <Card>
        <CardContent className="pt-6 min-h-[400px]">
          {blocks.length === 0 ? (
            <div className="text-center py-12">
              <Type className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">블록을 추가하여 문서를 작성하세요</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    블록 추가
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {BLOCK_TYPES.map((blockType) => (
                    <DropdownMenuItem
                      key={blockType.type}
                      onClick={() => addBlock(blockType.type as Block['type'])}
                    >
                      <blockType.icon className="w-4 h-4 mr-2" />
                      {blockType.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-4">
              <AnimatePresence>
                {blocks.map((block) => (
                  <Reorder.Item
                    key={block.id}
                    value={block}
                    className="group"
                    onFocus={() => setActiveBlockId(block.id)}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex gap-2 p-3 rounded-lg border transition-colors ${
                        activeBlockId === block.id
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                      onClick={() => setActiveBlockId(block.id)}
                    >
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded">
                          <GripVertical className="w-4 h-4 text-slate-400" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-slate-200 rounded">
                              <Plus className="w-4 h-4 text-slate-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {BLOCK_TYPES.map((blockType) => (
                              <DropdownMenuItem
                                key={blockType.type}
                                onClick={() => addBlock(blockType.type as Block['type'], block.id)}
                              >
                                <blockType.icon className="w-4 h-4 mr-2" />
                                {blockType.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                          className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600"
                          onClick={() => deleteBlock(block.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1">{renderBlock(block)}</div>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}

          {blocks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600">
                    <Plus className="w-4 h-4 mr-2" />
                    블록 추가
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {BLOCK_TYPES.map((blockType) => (
                    <DropdownMenuItem
                      key={blockType.type}
                      onClick={() => addBlock(blockType.type as Block['type'])}
                    >
                      <blockType.icon className="w-4 h-4 mr-2" />
                      {blockType.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcut Hint */}
      <p className="text-xs text-slate-400 text-center">Ctrl+S로 저장</p>
    </div>
  );
}
