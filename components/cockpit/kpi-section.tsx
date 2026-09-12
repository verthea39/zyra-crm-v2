'use client';

import { ArrowUpRight, ArrowDownRight, TrendingUp, Hourglass, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KpiData } from '@/types/cockpit';

interface KpiSectionProps {
  data: KpiData;
}

export function KpiSection({ data }: KpiSectionProps) {
  const formatAED = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const cards = [
    {
      title: 'Revenue (Billed)',
      value: data.revenue,
      subtext: 'Gross invoiced to date',
      icon: ArrowUpRight,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      borderBottom: 'border-b-blue-500',
      valueColor: 'text-slate-900',
    },
    {
      title: 'Total Expenses',
      value: data.totalExpenses,
      subtext: 'Opex, overheads & gov',
      icon: ArrowDownRight,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      borderBottom: 'border-b-rose-500',
      valueColor: 'text-rose-900',
    },
    {
      title: 'Net Profit',
      value: data.netProfit,
      subtext: 'Revenue minus expenses',
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderBottom: 'border-b-emerald-500',
      valueColor: 'text-emerald-900',
    },
    {
      title: 'Receivables (AR)',
      value: data.receivables,
      subtext: 'Uncollected client invoices',
      icon: Hourglass,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderBottom: 'border-b-amber-400',
      valueColor: 'text-amber-900',
    },
    {
      title: 'Payables (AP)',
      value: data.payables,
      subtext: 'Unsettled vendor obligations',
      icon: AlertTriangle,
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
      borderBottom: 'border-b-rose-400',
      valueColor: 'text-slate-900',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className={cn("bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden border-b-4", card.borderBottom)}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {card.title}
            </span>
            <span className={cn("p-1.5 rounded-lg", card.iconBg, card.iconColor)}>
              <card.icon className="w-4 h-4" />
            </span>
          </div>
          <div className={cn("mt-3 text-2xl font-black tracking-tight", card.valueColor)}>
            {formatAED(card.value)}
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">{card.subtext}</p>
        </div>
      ))}
    </section>
  );
}
