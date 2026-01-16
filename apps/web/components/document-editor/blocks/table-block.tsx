'use client';

import { Button } from '@countin/ui';
import { Plus, Trash2 } from 'lucide-react';
import { TableBlock as TableBlockType } from '../types';

interface TableBlockProps {
  block: TableBlockType;
  onChange: (updates: Partial<TableBlockType>) => void;
  isActive: boolean;
}

export function TableBlockComponent({ block, onChange, isActive }: TableBlockProps) {
  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...block.headers];
    newHeaders[index] = value;
    onChange({ headers: newHeaders });
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = block.rows.map((row, ri) =>
      ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : row
    );
    onChange({ rows: newRows });
  };

  const addColumn = () => {
    const newHeaders = [...block.headers, `열 ${block.headers.length + 1}`];
    const newRows = block.rows.map((row) => [...row, '']);
    onChange({ headers: newHeaders, rows: newRows });
  };

  const removeColumn = (index: number) => {
    if (block.headers.length <= 1) return;
    const newHeaders = block.headers.filter((_, i) => i !== index);
    const newRows = block.rows.map((row) => row.filter((_, i) => i !== index));
    onChange({ headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    const newRow = Array(block.headers.length).fill('');
    onChange({ rows: [...block.rows, newRow] });
  };

  const removeRow = (index: number) => {
    if (block.rows.length <= 1) return;
    const newRows = block.rows.filter((_, i) => i !== index);
    onChange({ rows: newRows });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100">
              {block.headers.map((header, colIndex) => (
                <th key={colIndex} className="relative border-r border-slate-200 last:border-r-0">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => updateHeader(colIndex, e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-sm font-semibold text-slate-700 outline-none text-center"
                  />
                  {isActive && block.headers.length > 1 && (
                    <button
                      onClick={() => removeColumn(colIndex)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </th>
              ))}
              {isActive && (
                <th className="w-10 bg-slate-50">
                  <button
                    onClick={addColumn}
                    className="w-full py-2 text-slate-400 hover:text-slate-600"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-200 group">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border-r border-slate-200 last:border-r-0">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-sm text-slate-600 outline-none"
                    />
                  </td>
                ))}
                {isActive && (
                  <td className="w-10 bg-slate-50">
                    {block.rows.length > 1 && (
                      <button
                        onClick={() => removeRow(rowIndex)}
                        className="w-full py-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isActive && (
        <Button variant="outline" size="sm" onClick={addRow} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          행 추가
        </Button>
      )}
    </div>
  );
}
