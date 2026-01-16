'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Wand2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Download,
  AlertCircle,
  Check,
  X,
  Loader2,
  Building2,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@countin/ui';
import { cn } from '@countin/utils';
import { ParsedTransaction, ClassifiedTransaction, ColumnMapping } from '@/lib/bank-parser/types';

type Step = 'upload' | 'mapping' | 'classify' | 'confirm' | 'result';

interface UploadData {
  fileName: string;
  bankType: string | null;
  bankName: string;
  headers: string[];
  rows: any[][];
  totalRows: number;
  suggestedMapping: ColumnMapping;
  transactions: ParsedTransaction[];
  totalTransactions: number;
}

interface ClassifyData {
  transactions: ClassifiedTransaction[];
  summary: {
    totalCount: number;
    incomeCount: number;
    expenseCount: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    learnedCount: number;
    totalIncome: number;
    totalExpense: number;
  };
  options: {
    accounts: { id: string; name: string; type: string }[];
    projects: { id: string; name: string }[];
    fundSources: { id: string; name: string }[];
  };
}

interface ImportResult {
  batchId: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  transactionIds: string[];
  errors: { rowIndex: number; error: string }[];
}

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: '파일 업로드', icon: Upload },
  { id: 'mapping', label: '컬럼 매핑', icon: FileSpreadsheet },
  { id: 'classify', label: 'AI 분류', icon: Wand2 },
  { id: 'confirm', label: '확인 및 등록', icon: CheckCircle2 },
];

const BANKS = [
  { id: 'kb', name: '국민은행' },
  { id: 'shinhan', name: '신한은행' },
  { id: 'woori', name: '우리은행' },
  { id: 'nh', name: '농협은행' },
  { id: 'hana', name: '하나은행' },
  { id: 'ibk', name: '기업은행' },
  { id: 'sc', name: 'SC제일은행' },
  { id: 'kakao', name: '카카오뱅크' },
  { id: 'toss', name: '토스뱅크' },
];

export default function TransactionImportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Upload
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Step 2: Mapping
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: null,
    description: null,
    deposit: null,
    withdrawal: null,
    balance: null,
  });

  // Step 3: Classify
  const [classifyData, setClassifyData] = useState<ClassifyData | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [editedTransactions, setEditedTransactions] = useState<Map<number, Partial<ClassifiedTransaction>>>(new Map());

  // Step 4: Confirm
  const [saveClassifications, setSaveClassifications] = useState(true);

  // Step 5: Result
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // File upload handler
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transactions/import/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadData(result.data);
        setColumnMapping(result.data.suggestedMapping);
        setCurrentStep('mapping');
      } else {
        setError(result.error?.message || '파일 업로드 실패');
      }
    } catch (err) {
      setError('파일 업로드 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Mapping confirmation handler
  const handleMappingConfirm = async () => {
    if (!uploadData) return;

    // Validate required mappings
    if (!columnMapping.date || !columnMapping.description) {
      setError('날짜와 적요 컬럼은 필수입니다');
      return;
    }

    if (!columnMapping.deposit && !columnMapping.withdrawal) {
      setError('입금 또는 출금 컬럼 중 하나는 필수입니다');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transactions/import/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: uploadData.transactions,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setClassifyData(result.data);
        // Select all transactions by default
        setSelectedTransactions(new Set(result.data.transactions.map((_: any, i: number) => i)));
        setCurrentStep('classify');
      } else {
        setError(result.error?.message || '분류 실패');
      }
    } catch (err) {
      setError('분류 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm import handler
  const handleConfirmImport = async () => {
    if (!classifyData || !uploadData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prepare transactions with edits
      const transactionsToImport = classifyData.transactions.map((t, index) => {
        const edits = editedTransactions.get(index) || {};
        return {
          ...t,
          ...edits,
          selected: selectedTransactions.has(index),
        };
      });

      const response = await fetch('/api/transactions/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactionsToImport,
          fileName: uploadData.fileName,
          bankType: uploadData.bankType,
          saveClassifications,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.data);
        setCurrentStep('result');
      } else {
        setError(result.error?.message || '등록 실패');
      }
    } catch (err) {
      setError('등록 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Undo import handler
  const handleUndoImport = async () => {
    if (!importResult) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/import/confirm?batchId=${importResult.batchId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/transactions');
      } else {
        setError(result.error?.message || '되돌리기 실패');
      }
    } catch (err) {
      setError('되돌리기 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle all selection
  const handleToggleAll = () => {
    if (!classifyData) return;

    if (selectedTransactions.size === classifyData.transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(classifyData.transactions.map((_, i) => i)));
    }
  };

  // Toggle single selection
  const handleToggleSelection = (index: number) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedTransactions(newSelection);
  };

  // Update transaction classification
  const handleUpdateTransaction = (index: number, field: string, value: any) => {
    const current = editedTransactions.get(index) || {};
    setEditedTransactions(new Map(editedTransactions.set(index, { ...current, [field]: value })));
  };

  // Apply classification to all selected
  const handleApplyToAll = (accountId: string) => {
    if (!classifyData) return;

    const account = classifyData.options.accounts.find(a => a.id === accountId);
    if (!account) return;

    const newEdits = new Map(editedTransactions);
    selectedTransactions.forEach(index => {
      const current = newEdits.get(index) || {};
      newEdits.set(index, {
        ...current,
        accountId,
        accountName: account.name,
      });
    });
    setEditedTransactions(newEdits);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700">높음</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">보통</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-700">낮음</Badge>;
    }
  };

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/transactions')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          거래 목록
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">거래 내역 가져오기</h1>
          <p className="text-sm text-slate-500">은행 거래 내역을 업로드하고 자동 분류합니다</p>
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep !== 'result' && (
        <div className="flex items-center justify-between px-4">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < stepIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isActive && 'bg-blue-600 border-blue-600 text-white',
                      isCompleted && 'bg-green-600 border-green-600 text-white',
                      !isActive && !isCompleted && 'border-slate-300 text-slate-400'
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium',
                      isActive && 'text-blue-600',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-slate-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-24 h-0.5 mx-2 mt-[-20px]',
                      index < stepIndex ? 'bg-green-600' : 'bg-slate-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>파일 업로드</CardTitle>
                  <CardDescription>
                    은행에서 다운로드한 거래 내역 파일을 업로드하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer',
                      isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={isLoading}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {isLoading ? (
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
                      ) : (
                        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                      )}
                      <p className="text-lg font-medium text-slate-700 mb-2">
                        {isLoading ? '파일 분석 중...' : '파일을 드래그하거나 클릭하여 업로드'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Excel (.xlsx, .xls) 또는 CSV 파일 지원 (최대 5MB)
                      </p>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Supported Banks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    지원 은행
                  </CardTitle>
                  <CardDescription>
                    자동 인식되는 은행 템플릿
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {BANKS.map((bank) => (
                      <div
                        key={bank.id}
                        className="p-2 text-sm text-slate-600 bg-slate-50 rounded-lg text-center"
                      >
                        {bank.name}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-slate-500 mb-2">
                      샘플 파일이 필요하신가요?
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      샘플 다운로드
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Step 2: Mapping */}
        {currentStep === 'mapping' && uploadData && (
          <motion.div
            key="mapping"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>컬럼 매핑</CardTitle>
                    <CardDescription>
                      {uploadData.fileName} - {uploadData.bankName} 인식됨 ({uploadData.totalTransactions}건)
                    </CardDescription>
                  </div>
                  {uploadData.bankType && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <Check className="w-3 h-3 mr-1" />
                      자동 인식됨
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Column Mapping */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { key: 'date', label: '날짜', required: true },
                    { key: 'description', label: '적요', required: true },
                    { key: 'deposit', label: '입금', required: false },
                    { key: 'withdrawal', label: '출금', required: false },
                    { key: 'balance', label: '잔액', required: false },
                  ].map((col) => (
                    <div key={col.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {col.label}
                        {col.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Select
                        value={columnMapping[col.key as keyof ColumnMapping] || ''}
                        onValueChange={(value) =>
                          setColumnMapping({
                            ...columnMapping,
                            [col.key]: value || null,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="선택..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">선택 안함</SelectItem>
                          {uploadData.headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {/* Preview Table */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">미리보기</h4>
                  <div className="border rounded-lg overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-600">행</th>
                          <th className="px-3 py-2 text-left text-slate-600">날짜</th>
                          <th className="px-3 py-2 text-left text-slate-600">적요</th>
                          <th className="px-3 py-2 text-right text-slate-600">입금</th>
                          <th className="px-3 py-2 text-right text-slate-600">출금</th>
                          <th className="px-3 py-2 text-right text-slate-600">잔액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {uploadData.transactions.slice(0, 10).map((t) => (
                          <tr key={t.rowIndex} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-500">{t.rowIndex}</td>
                            <td className="px-3 py-2">{t.date}</td>
                            <td className="px-3 py-2 max-w-xs truncate">{t.description}</td>
                            <td className="px-3 py-2 text-right text-green-600">
                              {t.deposit > 0 ? formatCurrency(t.deposit) : '-'}
                            </td>
                            <td className="px-3 py-2 text-right text-red-600">
                              {t.withdrawal > 0 ? formatCurrency(t.withdrawal) : '-'}
                            </td>
                            <td className="px-3 py-2 text-right">{formatCurrency(t.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {uploadData.totalTransactions > 10 && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      외 {uploadData.totalTransactions - 10}건 더 있음
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadData(null);
                      setCurrentStep('upload');
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    다시 업로드
                  </Button>
                  <Button onClick={handleMappingConfirm} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    AI 분류 시작
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Classify */}
        {currentStep === 'classify' && classifyData && (
          <motion.div
            key="classify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{classifyData.summary.totalCount}</p>
                    <p className="text-xs text-slate-500">전체 건수</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{classifyData.summary.incomeCount}</p>
                    <p className="text-xs text-slate-500">수입</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{classifyData.summary.expenseCount}</p>
                    <p className="text-xs text-slate-500">지출</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{classifyData.summary.highConfidenceCount}</p>
                    <p className="text-xs text-slate-500">높은 신뢰도</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{classifyData.summary.mediumConfidenceCount}</p>
                    <p className="text-xs text-slate-500">보통 신뢰도</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{classifyData.summary.learnedCount}</p>
                    <p className="text-xs text-slate-500">학습된 분류</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      AI 분류 결과
                    </CardTitle>
                    <CardDescription>
                      {selectedTransactions.size}건 선택됨 - 계정과목을 확인하고 필요시 수정하세요
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={handleApplyToAll}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="선택 항목 일괄 적용..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classifyData.options.accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <Checkbox
                            checked={selectedTransactions.size === classifyData.transactions.length}
                            onCheckedChange={handleToggleAll}
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-slate-600">날짜</th>
                        <th className="px-3 py-2 text-left text-slate-600">적요</th>
                        <th className="px-3 py-2 text-right text-slate-600">금액</th>
                        <th className="px-3 py-2 text-left text-slate-600">계정과목</th>
                        <th className="px-3 py-2 text-center text-slate-600">신뢰도</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {classifyData.transactions.map((t, index) => {
                        const edits = editedTransactions.get(index) || {};
                        const accountId = edits.accountId ?? t.accountId;
                        const accountName = edits.accountName ?? t.accountName;

                        return (
                          <tr
                            key={index}
                            className={cn(
                              'hover:bg-slate-50 transition-colors',
                              !selectedTransactions.has(index) && 'opacity-50'
                            )}
                          >
                            <td className="px-3 py-2">
                              <Checkbox
                                checked={selectedTransactions.has(index)}
                                onCheckedChange={() => handleToggleSelection(index)}
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{t.date}</td>
                            <td className="px-3 py-2 max-w-xs">
                              <div className="truncate" title={t.description}>
                                {t.description}
                              </div>
                              {t.isLearned && (
                                <span className="text-xs text-purple-600">학습됨</span>
                              )}
                            </td>
                            <td className={cn(
                              'px-3 py-2 text-right whitespace-nowrap font-medium',
                              t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                            )}>
                              {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                            </td>
                            <td className="px-3 py-2">
                              <Select
                                value={accountId || ''}
                                onValueChange={(value) => {
                                  const account = classifyData.options.accounts.find(a => a.id === value);
                                  handleUpdateTransaction(index, 'accountId', value);
                                  handleUpdateTransaction(index, 'accountName', account?.name || null);
                                }}
                              >
                                <SelectTrigger className="w-full h-8 text-xs">
                                  <SelectValue placeholder="선택..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {classifyData.options.accounts
                                    .filter(a => t.type === 'INCOME' ? a.type === 'REVENUE' : a.type === 'EXPENSE')
                                    .map((account) => (
                                      <SelectItem key={account.id} value={account.id}>
                                        {account.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {getConfidenceBadge(t.confidence)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('mapping')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전 단계
              </Button>
              <Button onClick={() => setCurrentStep('confirm')}>
                확인 및 등록
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 'confirm' && classifyData && uploadData && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>등록 확인</CardTitle>
                <CardDescription>
                  아래 내용을 확인하고 등록을 진행하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">파일명</p>
                      <p className="font-medium">{uploadData.fileName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">은행</p>
                      <p className="font-medium">{uploadData.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">등록 예정</p>
                      <p className="font-medium text-blue-600">{selectedTransactions.size}건</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">제외</p>
                      <p className="font-medium text-slate-400">
                        {classifyData.transactions.length - selectedTransactions.size}건
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-slate-500">수입 합계</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(
                          classifyData.transactions
                            .filter((_, i) => selectedTransactions.has(i))
                            .filter(t => t.type === 'INCOME')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">지출 합계</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(
                          classifyData.transactions
                            .filter((_, i) => selectedTransactions.has(i))
                            .filter(t => t.type === 'EXPENSE')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">분류 학습 저장</p>
                    <p className="text-sm text-slate-500">
                      분류 결과를 저장하여 다음 업로드 시 동일 적요에 자동 적용합니다
                    </p>
                  </div>
                  <Checkbox
                    checked={saveClassifications}
                    onCheckedChange={(checked) => setSaveClassifications(checked as boolean)}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('classify')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    이전 단계
                  </Button>
                  <Button onClick={handleConfirmImport} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    {selectedTransactions.size}건 등록하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Result */}
        {currentStep === 'result' && importResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card>
              <CardContent className="py-12 text-center">
                {importResult.successCount > 0 ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      거래 내역 등록 완료!
                    </h2>
                    <p className="text-slate-500 mb-6">
                      {importResult.successCount}건의 거래가 성공적으로 등록되었습니다
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      등록 실패
                    </h2>
                    <p className="text-slate-500 mb-6">
                      거래 내역을 등록하지 못했습니다
                    </p>
                  </>
                )}

                {/* Result Summary */}
                <div className="bg-slate-50 rounded-lg p-6 max-w-md mx-auto mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                      <p className="text-xs text-slate-500">성공</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{importResult.duplicateCount}</p>
                      <p className="text-xs text-slate-500">중복</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{importResult.failedCount}</p>
                      <p className="text-xs text-slate-500">실패</p>
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {importResult.errors.length > 0 && (
                  <div className="text-left max-w-md mx-auto mb-6">
                    <p className="text-sm font-medium text-slate-700 mb-2">오류 상세</p>
                    <div className="bg-red-50 rounded-lg p-4 max-h-32 overflow-auto text-sm">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <p key={i} className="text-red-700">
                          행 {err.rowIndex}: {err.error}
                        </p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-red-500 mt-2">
                          외 {importResult.errors.length - 5}건의 오류
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleUndoImport}
                    disabled={isLoading || importResult.successCount === 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    되돌리기
                  </Button>
                  <Button onClick={() => router.push('/dashboard/transactions')}>
                    거래 목록 보기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep('upload');
                      setUploadData(null);
                      setClassifyData(null);
                      setImportResult(null);
                      setSelectedTransactions(new Set());
                      setEditedTransactions(new Map());
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    다시 가져오기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
