'use client';

import React, { useState } from 'react';
import { Expense } from '@/types/warung';
import { ExpenseItemCard } from '@/components/pengeluaran/expense-item-card';
import { ExpenseDetailSheet } from '@/components/pengeluaran/expense-detail-sheet';
import { Receipt } from 'lucide-react';

interface ExpenseListClientProps {
  expenses: Expense[];
}

export function ExpenseListClient({ expenses }: ExpenseListClientProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  function handleCardClick(expense: Expense) {
    setSelectedExpense(expense);
    setIsDetailOpen(true);
  }

  function handleDetailOpenChange(open: boolean) {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedExpense(null);
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-subtle border border-border">
          <Receipt className="w-8 h-8 text-text-muted stroke-[1.5]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-body-medium font-semibold text-text">
            Belum ada catatan pengeluaran
          </p>
          <p className="text-small text-text-secondary">
            Catat biaya operasional warung untuk melacak pengeluaran harian.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-0.5">
          Riwayat Pengeluaran
        </h2>
        <div className="flex flex-col gap-2">
          {expenses.map((expense) => (
            <ExpenseItemCard
              key={expense.id}
              expense={expense}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      <ExpenseDetailSheet
        expense={selectedExpense}
        open={isDetailOpen}
        onOpenChange={handleDetailOpenChange}
      />
    </>
  );
}
