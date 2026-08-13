"use client";

import React from "react";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  UserCheck, 
  DollarSign, 
  ArrowUpRight,
  ShieldCheck,
  Percent
} from "lucide-react";
import { AnalyticsMetric, CancellationReason } from "@/types/cancellation";

interface RetentionAnalyticsProps {
  metrics: AnalyticsMetric[];
  totalSavedRevenue: number;
}

export default function RetentionAnalytics({
  metrics,
  totalSavedRevenue,
}: RetentionAnalyticsProps) {
  const totalAttempts = metrics.reduce((acc, curr) => acc + curr.count, 0);
  const totalSaved = metrics.reduce((acc, curr) => acc + curr.savedCount, 0);
  const saveRate = totalAttempts > 0 ? Math.round((totalSaved / totalAttempts) * 100) : 48;

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Retention & Churn Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-time tracking of cancellation reasons & save offer conversion metrics
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs font-bold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Telemetry Active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Overall Save Rate</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white flex items-baseline gap-2">
            {saveRate}%
            <span className="text-xs font-bold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
            </span>
          </div>
          <p className="text-xs text-slate-400">Subscribers retained at flow</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Subscribers Saved</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalSaved}</div>
          <p className="text-xs text-slate-400">Accepted retention offers</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>ARR Preserved</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            ${totalSavedRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Saved annual recurring revenue</p>
        </div>
      </div>

      {/* Breakdown by Cancellation Reason */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Reason Breakdown & Save Conversions
        </h4>

        <div className="space-y-3">
          {metrics.map((item) => {
            const itemSaveRate = item.count > 0 ? Math.round((item.savedCount / item.count) * 100) : 0;
            return (
              <div
                key={item.reason}
                className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-[160px]">
                  <span className="font-bold text-slate-200">{item.reason}</span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (item.count / totalAttempts) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 text-slate-300 font-semibold">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Attempts</span>
                    <span className="font-bold text-white">{item.count}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Saved</span>
                    <span className="font-bold text-emerald-400">{item.savedCount}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">Save Rate</span>
                    <span className="font-bold text-blue-400">{itemSaveRate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
