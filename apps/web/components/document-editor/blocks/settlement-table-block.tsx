'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@countin/ui';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { SettlementTableBlock as SettlementTableBlockType, SettlementItem } from '../types';
import { formatCurrency } from '@countin/utils';

interface Project {
  id: string;
  name: string;
}

interface FundSource {
  id: string;
  name: string;
}

interface SettlementTableBlockProps {
  block: SettlementTableBlockType;
  onChange: (updates: Partial<SettlementTableBlockType>) => void;
  isActive: boolean;
}

export function SettlementTableBlockComponent({ block, onChange, isActive }: SettlementTableBlockProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch projects
    fetch('/api/projects')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setProjects(result.data);
        }
      })
      .catch(console.error);

    // Fetch fund sources
    fetch('/api/fund-sources')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setFundSources(result.data);
        }
      })
      .catch(console.error);
  }, []);

  const loadSettlementData = async () => {
    if (!block.projectId && !block.fundSourceId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (block.projectId) params.set('projectId', block.projectId);
      if (block.fundSourceId) params.set('fundSourceId', block.fundSourceId);

      const response = await fetch(`/api/documents/blocks/settlement-data?${params}`);
      const result = await response.json();

      if (result.success) {
        onChange({ items: result.data.items });
      }
    } catch (error) {
      console.error('Failed to load settlement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewItem = (): SettlementItem => ({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    budgetAmount: 0,
    executedAmount: 0,
    note: '',
  });

  const updateItem = (index: number, updates: Partial<SettlementItem>) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ items: newItems });
  };

  const addItem = () => {
    onChange({ items: [...block.items, createNewItem()] });
  };

  const removeItem = (index: number) => {
    if (block.items.length <= 1) return;
    onChange({ items: block.items.filter((_, i) => i !== index) });
  };

  const totalBudget = block.items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalExecuted = block.items.reduce((sum, item) => sum + (item.executedAmount || 0), 0);
  const totalBalance = totalBudget - totalExecuted;
  const executionRate = totalBudget > 0 ? Math.round((totalExecuted / totalBudget) * 100) : 0;

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
          <div className="flex items-center gap-2">
            <Select
              value={block.projectId || ''}
              onValueChange={(value) => onChange({ projectId: value || undefined })}
            >
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="프로젝트 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">선택 안함</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={block.fundSourceId || ''}
              onValueChange={(value) => onChange({ fundSourceId: value || undefined })}
            >
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="재원 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">선택 안함</SelectItem>
                {fundSources.map((fs) => (
                  <SelectItem key={fs.id} value={fs.id}>
                    {fs.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={loadSettlementData}
              disabled={isLoading || (!block.projectId && !block.fundSourceId)}
              className="h-8"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              불러오기
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-sm text-slate-600">
              <th className="p-3 text-left font-medium w-1/4">항목</th>
              <th className="p-3 text-right font-medium w-1/6">예산액</th>
              <th className="p-3 text-right font-medium w-1/6">집행액</th>
              <th className="p-3 text-right font-medium w-1/8">잔액</th>
              <th className="p-3 text-right font-medium w-1/8">집행률</th>
              <th className="p-3 text-left font-medium">비고</th>
              {isActive && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {block.items.map((item, index) => {
              const balance = (item.budgetAmount || 0) - (item.executedAmount || 0);
              const rate = item.budgetAmount > 0 ? Math.round((item.executedAmount / item.budgetAmount) * 100) : 0;

              return (
                <tr key={item.id} className="group border-t border-slate-200">
                  <td className="p-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, { name: e.target.value })}
                      placeholder="항목명"
                      className="h-8 text-sm"
                      disabled={!isActive}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={item.budgetAmount || ''}
                      onChange={(e) => updateItem(index, { budgetAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="h-8 text-sm text-right"
                      disabled={!isActive}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={item.executedAmount || ''}
                      onChange={(e) => updateItem(index, { executedAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="h-8 text-sm text-right"
                      disabled={!isActive}
                    />
                  </td>
                  <td className={`p-2 text-right text-sm ${balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {formatCurrency(balance)}
                  </td>
                  <td className="p-2 text-right text-sm">
                    <span className={rate > 100 ? 'text-rose-600 font-medium' : rate >= 80 ? 'text-amber-600' : 'text-slate-600'}>
                      {rate}%
                    </span>
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.note}
                      onChange={(e) => updateItem(index, { note: e.target.value })}
                      placeholder="비고"
                      className="h-8 text-sm"
                      disabled={!isActive}
                    />
                  </td>
                  {isActive && (
                    <td className="p-2">
                      {block.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Summary Row */}
            <tr className="bg-slate-100 font-semibold">
              <td className="p-3 text-right">합계</td>
              <td className="p-3 text-right">{formatCurrency(totalBudget)}</td>
              <td className="p-3 text-right">{formatCurrency(totalExecuted)}</td>
              <td className={`p-3 text-right ${totalBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {formatCurrency(totalBalance)}
              </td>
              <td className="p-3 text-right">
                <span className={executionRate > 100 ? 'text-rose-600' : ''}>
                  {executionRate}%
                </span>
              </td>
              <td colSpan={isActive ? 2 : 1} />
            </tr>
          </tbody>
        </table>
      </div>

      {isActive && (
        <Button variant="outline" onClick={addItem} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          항목 추가
        </Button>
      )}
    </div>
  );
}
