import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  HeadingLevel,
  BorderStyle,
  WidthType,
  AlignmentType,
} from 'docx';

interface Block {
  id: string;
  type: string;
  content?: string;
  level?: string;
  style?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  url?: string;
  alt?: string;
  label?: string;
  name?: string;
  date?: string;
  title?: string;
  incomeItems?: any[];
  expenseItems?: any[];
}

// GET - 문서 내보내기 (PDF/Word)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
        { status: 401 }
      );
    }

    const tenantId = (session as any).tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TENANT', message: '조직을 먼저 생성해주세요' } },
        { status: 400 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    // Fetch document
    const document = await prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '문서를 찾을 수 없습니다' } },
        { status: 404 }
      );
    }

    let blocks: Block[] = [];
    try {
      blocks = JSON.parse(document.content);
    } catch {
      blocks = [];
    }

    if (format === 'docx') {
      // Generate Word document
      const docxElements: (Paragraph | Table)[] = [];

      // Title
      docxElements.push(
        new Paragraph({
          text: document.title,
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        })
      );

      // Process blocks
      for (const block of blocks) {
        switch (block.type) {
          case 'heading':
            const headingLevel = block.level === 'h1' ? HeadingLevel.HEADING_1
              : block.level === 'h2' ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;
            docxElements.push(
              new Paragraph({
                text: block.content || '',
                heading: headingLevel,
                spacing: { before: 200, after: 100 },
              })
            );
            break;

          case 'paragraph':
            docxElements.push(
              new Paragraph({
                children: [new TextRun(block.content || '')],
                spacing: { after: 200 },
              })
            );
            break;

          case 'list':
            const items = block.items || [];
            items.forEach((item, index) => {
              docxElements.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: block.style === 'numbered' ? `${index + 1}. ${item}` : `• ${item}`,
                    }),
                  ],
                  spacing: { after: 50 },
                })
              );
            });
            break;

          case 'table':
          case 'budget-table':
          case 'settlement-table':
            const headers = block.headers || [];
            const rows = block.rows || [];

            if (headers.length > 0 || rows.length > 0) {
              const tableRows: TableRow[] = [];

              // Header row
              if (headers.length > 0) {
                tableRows.push(
                  new TableRow({
                    children: headers.map((header) =>
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: header, bold: true })],
                          alignment: AlignmentType.CENTER,
                        })],
                        shading: { fill: 'E2E8F0' },
                      })
                    ),
                  })
                );
              }

              // Data rows
              rows.forEach((row) => {
                tableRows.push(
                  new TableRow({
                    children: row.map((cell) =>
                      new TableCell({
                        children: [new Paragraph({ text: cell || '' })],
                      })
                    ),
                  })
                );
              });

              if (tableRows.length > 0) {
                docxElements.push(
                  new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                  })
                );
                docxElements.push(new Paragraph({ text: '' })); // Spacing
              }
            }
            break;

          case 'divider':
            docxElements.push(
              new Paragraph({
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: 'CBD5E1',
                  },
                },
                spacing: { before: 200, after: 200 },
              })
            );
            break;

          case 'signature':
            docxElements.push(
              new Paragraph({
                children: [new TextRun({ text: `[${block.label || '서명'}]`, italics: true })],
                spacing: { before: 400 },
              })
            );
            if (block.name) {
              docxElements.push(
                new Paragraph({
                  children: [new TextRun(`성명: ${block.name}`)],
                })
              );
            }
            if (block.date) {
              docxElements.push(
                new Paragraph({
                  children: [new TextRun(`날짜: ${block.date}`)],
                })
              );
            }
            docxElements.push(
              new Paragraph({
                children: [new TextRun('_________________________')],
                spacing: { before: 100, after: 200 },
              })
            );
            break;

          default:
            break;
        }
      }

      const doc = new DocxDocument({
        sections: [
          {
            children: docxElements,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const arrayBuffer = new Uint8Array(buffer);

      const filename = `${document.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.docx`;

      return new Response(arrayBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    } else {
      // For PDF, return JSON data for client-side rendering
      // The actual PDF generation will be done on the client with @react-pdf/renderer
      return NextResponse.json({
        success: true,
        data: {
          title: document.title,
          type: document.type,
          status: document.status,
          blocks,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
      });
    }
  } catch (error) {
    console.error('Export document error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
