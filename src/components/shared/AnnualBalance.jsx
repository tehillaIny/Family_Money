import React, { useMemo } from 'react';
import { useData } from '@/hooks/useData.jsx';
import { startOfYear, endOfYear } from 'date-fns';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function AnnualBalance() {
  const { transactions } = useData();
  const now = new Date();

  const annualData = useMemo(() => {
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= yearStart &&
        transactionDate <= yearEnd &&
        transactionDate <= today
      );
    });

    const income = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    return { income, expenses, balance };
  }, [transactions]);

  return (
    <div className="w-full bg-card border-b">
      <div className="container mx-auto px-2 py-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">הכנסות:</span>
            <span className="font-medium text-green-500">
              {annualData.income.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
                minimumFractionDigits: 0
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className="text-muted-foreground">הוצאות:</span>
            <span className="font-medium text-red-500">
              {annualData.expenses.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
                minimumFractionDigits: 0
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {annualData.balance >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className="text-muted-foreground">מאזן:</span>
            <span className={`font-medium ${annualData.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {annualData.balance.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
                minimumFractionDigits: 0
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}