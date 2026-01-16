import { NextResponse } from 'next/server';
import { BANK_TEMPLATES } from '@/lib/bank-parser/templates';

// GET - Get bank templates
export async function GET() {
  const templates = BANK_TEMPLATES.filter(t => t.id !== 'generic').map(t => ({
    id: t.id,
    name: t.name,
    nameKo: t.nameKo,
  }));

  return NextResponse.json({
    success: true,
    data: {
      templates,
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      maxFileSize: '5MB',
    },
  });
}
