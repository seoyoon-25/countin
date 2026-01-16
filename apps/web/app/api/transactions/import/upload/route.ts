import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseExcelFile, parseCSVFile } from '@/lib/bank-parser';
import { BANK_TEMPLATES } from '@/lib/bank-parser/templates';

// POST - Upload and parse file
export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: '파일을 선택해주세요' } },
        { status: 400 }
      );
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');

    if (!isExcel && !isCSV) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILE_TYPE', message: 'Excel (.xlsx) 또는 CSV 파일만 지원합니다' } },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: '파일 크기는 5MB 이하로 제한됩니다' } },
        { status: 400 }
      );
    }

    let parseResult;

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      parseResult = parseExcelFile(buffer);
    } else {
      const text = await file.text();
      parseResult = parseCSVFile(text);
    }

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'PARSE_ERROR', message: parseResult.error || '파일을 파싱할 수 없습니다' } },
        { status: 400 }
      );
    }

    // Get bank name
    const bankTemplate = parseResult.bankType
      ? BANK_TEMPLATES.find(t => t.id === parseResult.bankType)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        bankType: parseResult.bankType,
        bankName: bankTemplate?.nameKo || '알 수 없음',
        headers: parseResult.headers,
        rows: parseResult.rows.slice(0, 100), // Limit preview to 100 rows
        totalRows: parseResult.rows.length,
        suggestedMapping: parseResult.suggestedMapping,
        transactions: parseResult.transactions.slice(0, 100), // Limit preview
        totalTransactions: parseResult.transactions.length,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
