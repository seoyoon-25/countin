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
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@countin/ui';
import { formatCurrency } from '@countin/utils';
import { Block } from '@/components/document-editor';

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
      case 'heading':
        const HeadingTag = block.level === 'h1' ? 'h1' : block.level === 'h2' ? 'h2' : 'h3';
        const headingClass = block.level === 'h1'
          ? 'text-2xl font-bold text-slate-900 mb-4'
          : block.level === 'h2'
          ? 'text-xl font-semibold text-slate-800 mb-3'
          : 'text-lg font-medium text-slate-700 mb-2';
        return (
          <HeadingTag key={block.id} className={headingClass}>
            {block.content || '제목 없음'}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p key={block.id} className="text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">
            {block.content || ''}
          </p>
        );

      case 'list':
        const ListTag = block.style === 'numbered' ? 'ol' : 'ul';
        const listClass = block.style === 'numbered' ? 'list-decimal' : 'list-disc';
        return (
          <ListTag key={block.id} className={`${listClass} list-inside space-y-1 mb-4`}>
            {block.items?.map((item, idx) => (
              <li key={idx} className="text-slate-700">{item}</li>
            ))}
          </ListTag>
        );

      case 'table':
        return (
          <div key={block.id} className="overflow-x-auto mb-4">
            <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  {block.headers?.map((header, idx) => (
                    <th key={idx} className="border border-slate-200 px-4 py-2 font-semibold text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows?.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-slate-200 px-4 py-2">
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
        return <hr key={block.id} className="border-slate-200 my-6" />;

      case 'image':
        if (!block.url) return null;
        return (
          <figure key={block.id} className="mb-4">
            <img
              src={block.url}
              alt={block.alt || ''}
              className="max-w-full h-auto rounded-lg"
              style={{ maxWidth: block.width ? `${block.width}px` : '100%' }}
            />
            {block.alt && (
              <figcaption className="text-sm text-slate-500 text-center mt-2">
                {block.alt}
              </figcaption>
            )}
          </figure>
        );

      case 'signature':
        return (
          <div key={block.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 mb-4">
            <div className="text-sm font-medium text-slate-500 mb-4">{block.label || '서명'}</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-400">성명</div>
                <div className="border-b border-slate-300 mt-1 pb-1">{block.name || ''}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">날짜</div>
                <div className="border-b border-slate-300 mt-1 pb-1">{block.date || ''}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 text-center">(서명)</div>
                <div className="h-12 border-b border-slate-300 mt-1" />
              </div>
            </div>
          </div>
        );

      case 'budget-table':
        const totalIncome = block.incomeItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const totalExpense = block.expenseItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const balance = totalIncome - totalExpense;

        return (
          <div key={block.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{block.title || '예산표'}</h3>

            {/* Income */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-emerald-50 px-4 py-2 font-medium text-emerald-700">수입</div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-sm">
                    <th className="px-4 py-2 text-left">항목</th>
                    <th className="px-4 py-2 text-left">산출근거</th>
                    <th className="px-4 py-2 text-right">금액</th>
                    <th className="px-4 py-2 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {block.incomeItems?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.calculation}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.amount || 0)}</td>
                      <td className="px-4 py-2">{item.note}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 font-medium">
                    <td colSpan={2} className="px-4 py-2 text-right">소계</td>
                    <td className="px-4 py-2 text-right text-emerald-700">{formatCurrency(totalIncome)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expense */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-rose-50 px-4 py-2 font-medium text-rose-700">지출</div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-sm">
                    <th className="px-4 py-2 text-left">항목</th>
                    <th className="px-4 py-2 text-left">산출근거</th>
                    <th className="px-4 py-2 text-right">금액</th>
                    <th className="px-4 py-2 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {block.expenseItems?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.calculation}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.amount || 0)}</td>
                      <td className="px-4 py-2">{item.note}</td>
                    </tr>
                  ))}
                  <tr className="bg-rose-50 font-medium">
                    <td colSpan={2} className="px-4 py-2 text-right">소계</td>
                    <td className="px-4 py-2 text-right text-rose-700">{formatCurrency(totalExpense)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Balance */}
            <div className="bg-slate-100 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="font-semibold">잔액 (수입 - 지출)</span>
              <span className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        );

      case 'settlement-table':
        const items = block.items || [];
        const totalBudget = items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
        const totalExecuted = items.reduce((sum, item) => sum + (item.executedAmount || 0), 0);

        return (
          <div key={block.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{block.title || '정산표'}</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 text-sm">
                    <th className="px-4 py-3 text-left">항목</th>
                    <th className="px-4 py-3 text-right">예산액</th>
                    <th className="px-4 py-3 text-right">집행액</th>
                    <th className="px-4 py-3 text-right">잔액</th>
                    <th className="px-4 py-3 text-right">집행률</th>
                    <th className="px-4 py-3 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const bal = (item.budgetAmount || 0) - (item.executedAmount || 0);
                    const rate = item.budgetAmount > 0 ? Math.round((item.executedAmount / item.budgetAmount) * 100) : 0;
                    return (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.budgetAmount || 0)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.executedAmount || 0)}</td>
                        <td className={`px-4 py-2 text-right ${bal >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                          {formatCurrency(bal)}
                        </td>
                        <td className={`px-4 py-2 text-right ${rate > 100 ? 'text-rose-600 font-medium' : ''}`}>
                          {rate}%
                        </td>
                        <td className="px-4 py-2">{item.note}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-semibold">
                    <td className="px-4 py-3">합계</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totalBudget)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totalExecuted)}</td>
                    <td className={`px-4 py-3 text-right ${totalBudget - totalExecuted >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {formatCurrency(totalBudget - totalExecuted)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {totalBudget > 0 ? Math.round((totalExecuted / totalBudget) * 100) : 0}%
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/documents/${id}/export?format=pdf`)}>
                <FileText className="w-4 h-4 mr-2" />
                PDF로 내보내기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/api/documents/${id}/export?format=docx`, '_blank')}>
                <FileText className="w-4 h-4 mr-2" />
                Word로 내보내기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <Card className="print:shadow-none print:border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 print:hidden">
                  <Badge variant="outline">{getTypeLabel(document.type)}</Badge>
                  <Badge className={statusInfo.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-4">{document.title}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500 print:hidden">
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
                {blocks.map((block) => renderBlock(block))}
              </div>
            ) : (
              <div className="text-center py-12 print:hidden">
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
