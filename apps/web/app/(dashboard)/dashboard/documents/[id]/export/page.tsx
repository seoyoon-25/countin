'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { Button, Card, CardContent } from '@countin/ui';
import { Block } from '@/components/document-editor';

// Dynamic import for PDF components (client-side only)
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div> }
);

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const DocumentPDF = dynamic(
  () => import('@/components/document-editor/pdf-renderer'),
  { ssr: false }
);

interface DocumentData {
  title: string;
  type: string;
  status: string;
  blocks: Block[];
}

export default function ExportDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const format = searchParams.get('format') || 'pdf';

  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${id}/export?format=pdf`);
        const result = await response.json();

        if (result.success) {
          setDocumentData(result.data);
        } else {
          setError(result.error?.message || '문서를 불러올 수 없습니다');
        }
      } catch (err) {
        setError('문서를 불러오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // If Word format, redirect to direct download
  useEffect(() => {
    if (format === 'docx' && !isLoading) {
      window.location.href = `/api/documents/${id}/export?format=docx`;
    }
  }, [format, id, isLoading]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-4">{error || '문서를 찾을 수 없습니다'}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">PDF 미리보기</h1>
            <p className="text-sm text-slate-500">{documentData.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PDFDownloadLink
            document={<DocumentPDF title={documentData.title} blocks={documentData.blocks} />}
            fileName={`${documentData.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {loading ? 'PDF 생성 중...' : 'PDF 다운로드'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* PDF Preview */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-xl">
          <PDFViewer
            style={{ width: '100%', height: '700px', border: 'none' }}
            showToolbar={false}
          >
            <DocumentPDF title={documentData.title} blocks={documentData.blocks} />
          </PDFViewer>
        </CardContent>
      </Card>
    </div>
  );
}
