'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BudgetForm } from '../../components/budget-form';

export default function EditBudgetPage() {
  const params = useParams();
  const [budget, setBudget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const response = await fetch(`/api/budgets/${params.id}`);
        const data = await response.json();

        if (data.success) {
          setBudget(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch budget:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchBudget();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">예산을 찾을 수 없습니다</p>
      </div>
    );
  }

  return <BudgetForm budget={budget} isEdit />;
}
