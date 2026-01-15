import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// GET - 거래 내역 내보내기
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다',
          },
        },
        { status: 401 }
      );
    }

    const tenantId = (session as any).tenantId;

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TENANT',
            message: '조직을 먼저 생성해주세요',
          },
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx';
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = { tenantId };

    if (type) {
      where.type = type;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            code: true,
            name: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
        fundSource: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Prepare data for export
    const exportData = transactions.map((t) => ({
      날짜: t.date.toISOString().split('T')[0],
      유형: t.type === 'INCOME' ? '수입' : t.type === 'EXPENSE' ? '지출' : '이체',
      적요: t.description,
      계정과목: `${t.account.code} - ${t.account.name}`,
      프로젝트: t.project?.name || '',
      재원: t.fundSource?.name || '',
      금액: Number(t.amount),
      메모: t.memo || '',
    }));

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Excel format
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '거래내역');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // 날짜
        { wch: 8 },  // 유형
        { wch: 30 }, // 적요
        { wch: 25 }, // 계정과목
        { wch: 15 }, // 프로젝트
        { wch: 15 }, // 재원
        { wch: 15 }, // 금액
        { wch: 20 }, // 메모
      ];

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error('Export transactions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}
