'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@countin/ui';
import { Plus, Trash2, GripVertical, RefreshCw } from 'lucide-react';
import { BudgetTableBlock as BudgetTableBlockType, BudgetItem } from '../types';
import { formatCurrency } from '@countin/utils';

interface Budget {
  id: string;
  name: string;
  year: number;
}

interface BudgetTableBlockProps {
  block: BudgetTableBlockType;
  onChange: (updates: Partial<BudgetTableBlockType>) => void;
  isActive: boolean;
}

export function BudgetTableBlockComponent({ block, onChange, isActive }: BudgetTableBlockProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch available budgets
    fetch('/api/budgets')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setBudgets(result.data);
        }
      })
      .catch(console.error);
  }, []);

  const loadBudgetData = async (budgetId: string) => {
    if (!budgetId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/blocks/budget-data?budgetId=${budgetId}`);
      const result = await response.json();
      if (result.success) {
        onChange({
          budgetId,
          incomeItems: result.data.incomeItems,
          expenseItems: result.data.expenseItems,
        });
      }
    } catch (error) {
      console.error('Failed to load budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewItem = (): BudgetItem => ({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    calculation: '',
    amount: 0,
    note: '',
  });

  const updateIncomeItem = (index: number, updates: Partial<BudgetItem>) => {
    const newItems = [...block.incomeItems];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ incomeItems: newItems });
  };

  const updateExpenseItem = (index: number, updates: Partial<BudgetItem>) => {
    const newItems = [...block.expenseItems];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ expenseItems: newItems });
  };

  const addIncomeItem = () => {
    onChange({ incomeItems: [...block.incomeItems, createNewItem()] });
  };

  const addExpenseItem = () => {
    onChange({ expenseItems: [...block.expenseItems, createNewItem()] });
  };

  const removeIncomeItem = (index: number) => {
    if (block.incomeItems.length <= 1) return;
    onChange({ incomeItems: block.incomeItems.filter((_, i) => i !== index) });
  };

  const removeExpenseItem = (index: number) => {
    if (block.expenseItems.length <= 1) return;
    onChange({ expenseItems: block.expenseItems.filter((_, i) => i !== index) });
  };

  const totalIncome = block.incomeItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpense = block.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const renderItemRow = (
    item: BudgetItem,
    index: number,
    updateFn: (index: number, updates: Partial<BudgetItem>) => void,
    removeFn: (index: number) => void,
    canRemove: boolean
  ) => (
    <tr key={item.id} className="group border-t border-slate-200">
      <td className="p-2">
        <Input
          value={item.name}
          onChange={(e) => updateFn(index, { name: e.target.value })}
          placeholder="항목명"
          className="h-8 text-sm"
          disabled={!isActive}
        />
      </td>
      <td className="p-2">
        <Input
          value={item.calculation}
          onChange={(e) => updateFn(index, { calculation: e.target.value })}
          placeholder="산출근거"
          className="h-8 text-sm"
          disabled={!isActive}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          value={item.amount || ''}
          onChange={(e) => updateFn(index, { amount: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          className="h-8 text-sm text-right"
          disabled={!isActive}
        />
      </td>
      {block.showExecution && (
        <td className="p-2 text-right text-sm text-slate-500">
          {item.executedAmount !== undefined ? formatCurrency(item.executedAmount) : '-'}
        </td>
      )}
      <td className="p-2">
        <Input
          value={item.note}
          onChange={(e) => updateFn(index, { note: e.target.value })}
          placeholder="비고"
          className="h-8 text-sm"
          disabled={!isActive}
        />
      </td>
      {isActive && (
        <td className="p-2 w-10">
          {canRemove && (
            <button
              onClick={() => removeFn(index)}
              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </td>
      )}
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {isActive ? (
          <Input
            value={block.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="text-lg font-semibold max-w-xs"
          />
        ) : (
          <h3 className="text-lg font-semibold text-slate-900">{block.title}</h3>
        )}

        {isActive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">집행액 표시</Label>
              <Switch
                checked={block.showExecution}
                onCheckedChange={(checked) => onChange({ showExecution: checked })}
              />
            </div>
            <Select
              value={block.budgetId || ''}
              onValueChange={(value) => loadBudgetData(value)}
            >
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="예산 불러오기" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.name} ({budget.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {block.budgetId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadBudgetData(block.budgetId!)}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Income Section */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-emerald-50 px-4 py-2 font-medium text-emerald-700 flex items-center justify-between">
          <span>수입</span>
          {isActive && (
            <Button variant="ghost" size="sm" onClick={addIncomeItem} className="h-7 text-emerald-600">
              <Plus className="w-4 h-4 mr-1" />
              항목 추가
            </Button>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-sm text-slate-600">
              <th className="p-2 text-left font-medium w-1/4">항목</th>
              <th className="p-2 text-left font-medium w-1/4">산출근거</th>
              <th className="p-2 text-right font-medium w-1/6">금액</th>
              {block.showExecution && <th className="p-2 text-right font-medium w-1/6">집행액</th>}
              <th className="p-2 text-left font-medium">비고</th>
              {isActive && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {block.incomeItems.map((item, index) =>
              renderItemRow(item, index, updateIncomeItem, removeIncomeItem, block.incomeItems.length > 1)
            )}
            <tr className="bg-emerald-50 font-medium">
              <td colSpan={2} className="p-2 text-right">수입 소계</td>
              <td className="p-2 text-right text-emerald-700">{formatCurrency(totalIncome)}</td>
              {block.showExecution && (
                <td className="p-2 text-right text-emerald-600">
                  {formatCurrency(block.incomeItems.reduce((sum, item) => sum + (item.executedAmount || 0), 0))}
                </td>
              )}
              <td colSpan={isActive ? 2 : 1} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expense Section */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-rose-50 px-4 py-2 font-medium text-rose-700 flex items-center justify-between">
          <span>지출</span>
          {isActive && (
            <Button variant="ghost" size="sm" onClick={addExpenseItem} className="h-7 text-rose-600">
              <Plus className="w-4 h-4 mr-1" />
              항목 추가
            </Button>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-sm text-slate-600">
              <th className="p-2 text-left font-medium w-1/4">항목</th>
              <th className="p-2 text-left font-medium w-1/4">산출근거</th>
              <th className="p-2 text-right font-medium w-1/6">금액</th>
              {block.showExecution && <th className="p-2 text-right font-medium w-1/6">집행액</th>}
              <th className="p-2 text-left font-medium">비고</th>
              {isActive && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {block.expenseItems.map((item, index) =>
              renderItemRow(item, index, updateExpenseItem, removeExpenseItem, block.expenseItems.length > 1)
            )}
            <tr className="bg-rose-50 font-medium">
              <td colSpan={2} className="p-2 text-right">지출 소계</td>
              <td className="p-2 text-right text-rose-700">{formatCurrency(totalExpense)}</td>
              {block.showExecution && (
                <td className="p-2 text-right text-rose-600">
                  {formatCurrency(block.expenseItems.reduce((sum, item) => sum + (item.executedAmount || 0), 0))}
                </td>
              )}
              <td colSpan={isActive ? 2 : 1} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
        <table className="w-full">
          <tbody>
            <tr className="font-semibold text-lg">
              <td className="p-3 text-right">잔액 (수입 - 지출)</td>
              <td className={`p-3 text-right w-48 ${balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {formatCurrency(balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
