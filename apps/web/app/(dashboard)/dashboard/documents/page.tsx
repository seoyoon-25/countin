'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FolderOpen,
  Clock,
  CheckCircle,
  Archive,
  FileCheck,
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
  Tabs,
  TabsList,
  TabsTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@countin/ui';

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  content: string;
  projectId: string | null;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  } | null;
}

const DOCUMENT_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'BUSINESS_PLAN', label: '사업계획서' },
  { value: 'SETTLEMENT', label: '정산서' },
  { value: 'BUDGET_PLAN', label: '예산안' },
  { value: 'MEETING_MINUTES', label: '회의록' },
  { value: 'CONTRACT', label: '계약서' },
  { value: 'PROPOSAL', label: '제안서' },
  { value: 'REPORT', label: '보고서' },
  { value: 'CUSTOM', label: '기타' },
];

const DOCUMENT_STATUSES = [
  { value: 'all', label: '전체 상태' },
  { value: 'DRAFT', label: '작성중', color: 'bg-slate-100 text-slate-700' },
  { value: 'REVIEW', label: '검토중', color: 'bg-amber-100 text-amber-700' },
  { value: 'APPROVED', label: '승인됨', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ARCHIVED', label: '보관됨', color: 'bg-blue-100 text-blue-700' },
];

const getTypeLabel = (type: string) => {
  const found = DOCUMENT_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};

const getStatusInfo = (status: string) => {
  const found = DOCUMENT_STATUSES.find((s) => s.value === status);
  return found || { label: status, color: 'bg-slate-100 text-slate-700' };
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Clock className="w-3 h-3" />;
    case 'REVIEW':
      return <Eye className="w-3 h-3" />;
    case 'APPROVED':
      return <CheckCircle className="w-3 h-3" />;
    case 'ARCHIVED':
      return <Archive className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('isTemplate', 'false');

      const response = await fetch(`/api/documents?${params}`);
      const result = await response.json();

      if (result.success) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/documents/${deleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteId));
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">문서</h1>
          <p className="text-slate-500 mt-1">사업계획서, 정산서, 보고서 등의 문서를 관리합니다</p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            새 문서
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="문서 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                <TabsList className="h-auto flex-wrap">
                  {DOCUMENT_TYPES.slice(0, 5).map((type) => (
                    <TabsTrigger key={type.value} value={type.value} className="text-xs">
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {DOCUMENT_STATUSES.map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
                className="text-xs"
              >
                {status.value !== 'all' && getStatusIcon(status.value)}
                <span className="ml-1">{status.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {documents.map((doc, index) => {
              const statusInfo = getStatusInfo(doc.status);
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-md transition-all duration-200 h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(doc.type)}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/dashboard/documents/${doc.id}`}>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                보기
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/dashboard/documents/${doc.id}/edit`}>
                              <DropdownMenuItem>
                                <Pencil className="w-4 h-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={() => setDeleteId(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <h3 className="font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {doc.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${statusInfo.color} text-xs`}>
                          {getStatusIcon(doc.status)}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                      </div>

                      {doc.project && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                          <FolderOpen className="w-3 h-3" />
                          {doc.project.name}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-2 border-t border-slate-100">
                        <span>생성: {formatDate(doc.createdAt)}</span>
                        <span>수정: {formatDate(doc.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">문서가 없습니다</h3>
            <p className="text-slate-500 mb-4">새 문서를 만들어 시작하세요</p>
            <Link href="/dashboard/documents/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                새 문서 만들기
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 문서가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
