import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@countin/database';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// GET - 보고서 내보내기
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
    const reportType = searchParams.get('type') || 'income-expense';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const fundSourceId = searchParams.get('fundSourceId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    let exportData: any[] = [];
    let filename = '';
    let sheetName = '';

    if (reportType === 'income-expense' || reportType === 'monthly') {
      // Income-Expense Report
      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        include: {
          account: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'asc' },
      });

      // Group by account and type
      const incomeByAccount: Record<string, { name: string; amount: number; count: number }> = {};
      const expenseByAccount: Record<string, { name: string; amount: number; count: number }> = {};

      transactions.forEach((t) => {
        const accountName = `${t.account.code} - ${t.account.name}`;
        if (t.type === 'INCOME') {
          if (!incomeByAccount[t.accountId]) {
            incomeByAccount[t.accountId] = { name: accountName, amount: 0, count: 0 };
          }
          incomeByAccount[t.accountId].amount += Number(t.amount);
          incomeByAccount[t.accountId].count += 1;
        } else if (t.type === 'EXPENSE') {
          if (!expenseByAccount[t.accountId]) {
            expenseByAccount[t.accountId] = { name: accountName, amount: 0, count: 0 };
          }
          expenseByAccount[t.accountId].amount += Number(t.amount);
          expenseByAccount[t.accountId].count += 1;
        }
      });

      // Prepare export data
      exportData.push({ 구분: '=== 수입 ===' });
      Object.values(incomeByAccount)
        .sort((a, b) => b.amount - a.amount)
        .forEach((item) => {
          exportData.push({
            구분: '수입',
            계정과목: item.name,
            금액: item.amount,
            건수: item.count,
          });
        });

      const totalIncome = Object.values(incomeByAccount).reduce((sum, i) => sum + i.amount, 0);
      exportData.push({ 구분: '수입 합계', 금액: totalIncome });
      exportData.push({ 구분: '' });

      exportData.push({ 구분: '=== 지출 ===' });
      Object.values(expenseByAccount)
        .sort((a, b) => b.amount - a.amount)
        .forEach((item) => {
          exportData.push({
            구분: '지출',
            계정과목: item.name,
            금액: item.amount,
            건수: item.count,
          });
        });

      const totalExpense = Object.values(expenseByAccount).reduce((sum, i) => sum + i.amount, 0);
      exportData.push({ 구분: '지출 합계', 금액: totalExpense });
      exportData.push({ 구분: '' });

      exportData.push({ 구분: '=== 요약 ===' });
      exportData.push({ 구분: '총 수입', 금액: totalIncome });
      exportData.push({ 구분: '총 지출', 금액: totalExpense });
      exportData.push({ 구분: '잔액', 금액: totalIncome - totalExpense });

      filename = `income_expense_report_${startDate}_${endDate}`;
      sheetName = '수입지출보고서';
    } else if (reportType === 'project' && projectId) {
      // Project Report
      const project = await prisma.project.findFirst({
        where: { id: projectId, tenantId },
      });

      if (!project) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
          { status: 404 }
        );
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId,
          projectId,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        include: {
          account: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      exportData.push({ 구분: `프로젝트: ${project.name}` });
      exportData.push({ 구분: `기간: ${startDate || '전체'} ~ ${endDate || '전체'}` });
      exportData.push({ 구분: '' });

      transactions.forEach((t) => {
        exportData.push({
          날짜: t.date.toISOString().split('T')[0],
          유형: t.type === 'INCOME' ? '수입' : t.type === 'EXPENSE' ? '지출' : '이체',
          적요: t.description,
          계정과목: `${t.account.code} - ${t.account.name}`,
          금액: Number(t.amount),
        });
      });

      const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);

      exportData.push({ 구분: '' });
      exportData.push({ 구분: '총 수입', 금액: totalIncome });
      exportData.push({ 구분: '총 지출', 금액: totalExpense });
      exportData.push({ 구분: '잔액', 금액: totalIncome - totalExpense });

      filename = `project_report_${project.name}_${startDate}_${endDate}`;
      sheetName = '프로젝트보고서';
    } else if (reportType === 'fund-source' && fundSourceId) {
      // Fund Source Report
      const fundSource = await prisma.fundSource.findFirst({
        where: { id: fundSourceId, tenantId },
      });

      if (!fundSource) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '재원을 찾을 수 없습니다' } },
          { status: 404 }
        );
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId,
          fundSourceId,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
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
        },
        orderBy: { date: 'desc' },
      });

      exportData.push({ 구분: `재원: ${fundSource.name}` });
      exportData.push({ 구분: `총액: ${Number(fundSource.amount).toLocaleString()}원` });
      exportData.push({ 구분: `사용액: ${Number(fundSource.usedAmount).toLocaleString()}원` });
      exportData.push({ 구분: `잔액: ${(Number(fundSource.amount) - Number(fundSource.usedAmount)).toLocaleString()}원` });
      exportData.push({ 구분: '' });

      transactions.forEach((t) => {
        exportData.push({
          날짜: t.date.toISOString().split('T')[0],
          유형: t.type === 'INCOME' ? '수입' : t.type === 'EXPENSE' ? '지출' : '이체',
          적요: t.description,
          계정과목: `${t.account.code} - ${t.account.name}`,
          프로젝트: t.project?.name || '',
          금액: Number(t.amount),
        });
      });

      filename = `fund_source_report_${fundSource.name}_${startDate}_${endDate}`;
      sheetName = '재원보고서';
    } else if (reportType === 'account') {
      // Account Report
      const accountType = searchParams.get('accountType');

      const accountWhere: any = { tenantId };
      if (accountType) {
        accountWhere.type = accountType;
      }

      const accounts = await prisma.account.findMany({
        where: accountWhere,
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
      });

      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        select: {
          accountId: true,
          type: true,
          amount: true,
        },
      });

      // Aggregate by account
      const accountData: Record<string, { income: number; expense: number; count: number }> = {};
      accounts.forEach((account) => {
        accountData[account.id] = { income: 0, expense: 0, count: 0 };
      });

      transactions.forEach((t) => {
        if (accountData[t.accountId]) {
          if (t.type === 'INCOME') {
            accountData[t.accountId].income += Number(t.amount);
          } else if (t.type === 'EXPENSE') {
            accountData[t.accountId].expense += Number(t.amount);
          }
          accountData[t.accountId].count += 1;
        }
      });

      accounts.forEach((account) => {
        const data = accountData[account.id];
        if (data.count > 0) {
          exportData.push({
            코드: account.code,
            계정과목: account.name,
            유형: account.type,
            수입: data.income,
            지출: data.expense,
            순액: data.income - data.expense,
            거래수: data.count,
          });
        }
      });

      filename = `account_report_${startDate}_${endDate}`;
      sheetName = '계정과목보고서';
    }

    // Generate file based on format
    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // For PDF, return JSON data that the client will render
      // PDF generation is done client-side with jspdf
      return NextResponse.json({
        success: true,
        data: exportData,
        filename,
      });
    } else {
      // Excel format
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
      ];

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error('Export report error:', error);
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
