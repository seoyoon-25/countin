'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Download,
  Printer,
  Clock,
  CheckCircle,
  Send,
  Archive,
  FolderOpen,
  FileText,
  Calendar,
  User,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
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
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  } | null;
}

const DOCUMENT_TYPES = [
  { value: 'BUSINESS_PLAN', label: '사업계획서' },
  { value: 'SETTLEMENT', label: '정산서' },
  { value: 'BUDGET_PLAN', label: '예산안' },
  { value: 'MEETING_MINUTES', label: '회의록' },
  { value: 'CONTRACT', label: '계약서' },
  { value: 'PROPOSAL', label: '제안서' },
  { value: 'REPORT', label: '보고서' },
  { value: 'CUSTOM', label: '기타' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '작성중', icon: Clock, color: 'bg-slate-100 text-slate-700' },
  { value: 'REVIEW', label: '검토중', icon: Send, color: 'bg-amber-100 text-amber-700' },
  { value: 'APPROVED', label: '승인됨', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ARCHIVED', label: '보관됨', icon: Archive, color: 'bg-blue-100 text-blue-700' },
];

const getTypeLabel = (type: string) => {
  const found = DOCUMENT_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};

const getStatusInfo = (status: string) => {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
};

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${id}`);
        const result = await response.json();

        if (result.success) {
          setDocument(result.data);
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

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'heading1':
        return (
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{block.content || '제목 없음'}</h1>
        );
      case 'heading2':
        return (
          <h2 className="text-xl font-semibold text-slate-800 mb-3">{block.content || '제목 없음'}</h2>
        );
      case 'paragraph':
        return (
          <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">
            {block.content || '내용 없음'}
          </p>
        );
      case 'bulletList':
        return (
          <ul className="list-disc list-inside space-y-1 mb-4">
            {(block.content || '').split('\n').map((item, idx) => (
              <li key={idx} className="text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        );
      case 'numberedList':
        return (
          <ol className="list-decimal list-inside space-y-1 mb-4">
            {(block.content || '').split('\n').map((item, idx) => (
              <li key={idx} className="text-slate-700">
                {item}
              </li>
            ))}
          </ol>
        );
      case 'table':
        return (
          <div className="overflow-x-auto mb-4">
            <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
              <tbody>
                {block.tableData?.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx === 0 ? 'bg-slate-100' : ''}>
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className={`border border-slate-200 px-4 py-2 ${
                          rowIdx === 0 ? 'font-semibold' : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'divider':
        return <hr className="border-slate-200 my-6" />;
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
        <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500 mb-4">문서를 찾을 수 없습니다</p>
        <Link href="/dashboard/documents">
          <Button variant="outline">문서 목록으로</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(document.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            문서 목록
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            인쇄
          </Button>
          <Link href={`/dashboard/documents/${id}/edit`}>
            <Button>
              <Pencil className="w-4 h-4 mr-2" />
              편집
            </Button>
          </Link>
        </div>
      </div>

      {/* Document Header Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{getTypeLabel(document.type)}</Badge>
                  <Badge className={statusInfo.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-4">{document.title}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  {document.project && (
                    <div className="flex items-center gap-1">
                      <FolderOpen className="w-4 h-4" />
                      {document.project.name}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    생성: {formatDate(document.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    수정: {formatDate(document.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="print:shadow-none print:border-none">
          <CardContent className="pt-6">
            {blocks.length > 0 ? (
              <div className="prose prose-slate max-w-none">
                {blocks.map((block) => (
                  <div key={block.id}>{renderBlock(block)}</div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">문서 내용이 없습니다</p>
                <Link href={`/dashboard/documents/${id}/edit`}>
                  <Button>
                    <Pencil className="w-4 h-4 mr-2" />
                    내용 작성하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-4xl,
          .max-w-4xl * {
            visibility: visible;
          }
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
