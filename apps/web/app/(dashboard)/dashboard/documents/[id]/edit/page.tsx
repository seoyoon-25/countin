'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  Clock,
  CheckCircle,
  Send,
  Archive,
  Download,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Label,
} from '@countin/ui';
import { BlockEditor, Block, createBlock } from '@/components/document-editor';

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

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '작성중', icon: Clock, color: 'bg-slate-100 text-slate-700' },
  { value: 'REVIEW', label: '검토요청', icon: Send, color: 'bg-amber-100 text-amber-700' },
  { value: 'APPROVED', label: '승인', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ARCHIVED', label: '보관', icon: Archive, color: 'bg-blue-100 text-blue-700' },
];

export default function DocumentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // AI states
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

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
            if (Array.isArray(parsedContent) && parsedContent.length > 0) {
              setBlocks(parsedContent);
            } else {
              // Start with a default paragraph block
              setBlocks([createBlock('paragraph')]);
            }
          } catch {
            setBlocks([createBlock('paragraph')]);
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
    if (!document || !hasChanges) return;

    setSaveStatus('saving');
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
        setSaveStatus('saved');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      setSaveStatus('error');
    }
  }, [id, title, blocks, document, hasChanges]);

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setHasChanges(true);
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasChanges(true);
  }, []);

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

  const handleExport = (format: 'pdf' | 'docx') => {
    // Navigate to export with format
    window.open(`/api/documents/${id}/export?format=${format}`, '_blank');
  };

  // Get current content as plain text for AI
  const getCurrentContentText = useCallback(() => {
    return blocks
      .map((block) => {
        if (block.type === 'paragraph' || block.type === 'heading') {
          return block.content;
        }
        if (block.type === 'list') {
          return (block.items || []).join('\n');
        }
        if (block.type === 'table') {
          return (block.rows || []).map((row: string[]) => row.join(' | ')).join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }, [blocks]);

  const handleAIComplete = async () => {
    const currentContent = getCurrentContentText();
    if (!currentContent.trim()) {
      alert('먼저 문서 내용을 작성해주세요');
      return;
    }

    setIsAIGenerating(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/ai/document-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          documentType: document?.type || 'REPORT',
          currentContent,
          instruction: aiInstruction || undefined,
          context: {
            projectName: document?.project?.name,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiResult(data.data.content);
      } else {
        alert(data.error?.message || 'AI 문서 보완에 실패했습니다');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleApplyAIResult = () => {
    if (!aiResult) return;

    // Add AI result as new paragraph blocks
    const newBlocks: Block[] = aiResult
      .split('\n\n')
      .filter((text) => text.trim())
      .map((text) => ({
        ...createBlock('paragraph'),
        content: text.trim(),
      }));

    setBlocks((prev) => [...prev, ...newBlocks]);
    setHasChanges(true);

    // Close modal and reset
    setShowAIModal(false);
    setAiInstruction('');
    setAiResult(null);
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
    <div className="max-w-5xl mx-auto space-y-6">
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
          {/* Status Dropdown */}
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

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF로 내보내기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')}>
                <FileText className="w-4 h-4 mr-2" />
                Word로 내보내기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIModal(true)}
            className="text-violet-600 border-violet-200 hover:bg-violet-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI 내용 보완
          </Button>

          {/* Preview */}
          <Link href={`/dashboard/documents/${id}`}>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              미리보기
            </Button>
          </Link>

          {/* Save */}
          <Button onClick={handleSave} disabled={saveStatus === 'saving' || !hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === 'saving' ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* Document Title */}
      <Card>
        <CardContent className="pt-6">
          <Input
            value={title}
            onChange={handleTitleChange}
            className="text-2xl font-bold border-none focus-visible:ring-0 px-0 h-auto"
            placeholder="문서 제목"
          />
        </CardContent>
      </Card>

      {/* Document Content - Block Editor */}
      <Card>
        <CardContent className="pt-6 min-h-[500px]">
          <BlockEditor
            blocks={blocks}
            onChange={handleBlocksChange}
            onSave={handleSave}
            saveStatus={saveStatus}
          />
        </CardContent>
      </Card>

      {/* Keyboard Shortcut Hint */}
      <div className="text-center text-xs text-slate-400">
        <span className="bg-slate-100 px-2 py-1 rounded">Ctrl+S</span> 저장 &nbsp;•&nbsp;
        <span className="bg-slate-100 px-2 py-1 rounded">/</span> 블록 추가
      </div>

      {/* AI Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              AI로 문서 내용 보완
            </DialogTitle>
          </DialogHeader>

          {!aiResult ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  현재 작성된 문서 내용을 바탕으로 AI가 추가 내용을 작성합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label>추가 지시사항 (선택)</Label>
                <Textarea
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder="예: 결론 부분을 추가해주세요, 예산 집행 계획을 상세히 작성해주세요"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAIModal(false)}>
                  취소
                </Button>
                <Button
                  onClick={handleAIComplete}
                  disabled={isAIGenerating}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isAIGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      내용 생성
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-100 max-h-64 overflow-y-auto">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiResult}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAiResult(null)}>
                  다시 생성
                </Button>
                <Button onClick={handleApplyAIResult} className="bg-violet-600 hover:bg-violet-700">
                  문서에 추가
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
