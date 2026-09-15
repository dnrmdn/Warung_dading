import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { getReportData, ReportPeriod } from '@/lib/services/reports';
import { ReportFilterBar } from '@/components/laporan/report-filter-bar';
import { ReportSummaryCards } from '@/components/laporan/report-summary-cards';
import { ReportTrendChart } from '@/components/laporan/report-trend-chart';
import { ReportFinancialFlow } from '@/components/laporan/report-financial-flow';
import { ReportTopProductsChart } from '@/components/laporan/report-top-products-chart';
import { ReportExpenseChart } from '@/components/laporan/report-expense-chart';
import { enforceReportPage } from '@/lib/auth/page-guard';

export const dynamic = 'force-dynamic';

interface LaporanPageProps {
  searchParams: Promise<{
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function LaporanPage({ searchParams }: LaporanPageProps) {
  await enforceReportPage();
  const resolvedParams = await searchParams;

  const period = (resolvedParams.period as ReportPeriod) || 'thisMonth';
  const startDate = resolvedParams.startDate;
  const endDate = resolvedParams.endDate;

  const reportData = await getReportData({
    period,
    startDate,
    endDate,
  });

  return (
    <AppShell>
      <HeaderBar
        title="Laporan Bisnis"
        subtitle="Analitik Keuangan & Performa Warung"
        backHref="/more"
      />

      <div className="flex flex-col gap-4 p-4 pb-20">
        {/* 1. Period Selector & Filter Bar */}
        <ReportFilterBar
          currentPeriod={reportData.dateRange.period}
          startDateStr={reportData.dateRange.startDateStr}
          endDateStr={reportData.dateRange.endDateStr}
          periodLabel={reportData.dateRange.periodLabel}
        />

        {/* 2. Key Financial Performance Indicators (KPI Cards) */}
        <ReportSummaryCards summary={reportData.summary} />

        {/* 3. Main Trend Timeline Chart */}
        <ReportTrendChart
          trend={reportData.trend}
          periodLabel={reportData.dateRange.periodLabel}
        />

        {/* 4. Financial Flow & Top Products in 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Step-down Financial Flow Decomposition */}
          <ReportFinancialFlow summary={reportData.summary} />

          {/* Top Selling Products Ranking */}
          <ReportTopProductsChart topProducts={reportData.topProducts} />
        </div>

        {/* 5. Expense Categories Breakdown */}
        <ReportExpenseChart
          expenseCategories={reportData.expenseCategories}
          totalExpenses={reportData.summary.totalExpenses}
        />
      </div>
    </AppShell>
  );
}
