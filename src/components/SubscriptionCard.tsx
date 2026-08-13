"use client";

import React from "react";
import { 
  Sparkles, 
  CreditCard, 
  Calendar, 
  Droplet, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { CancellationData } from "@/types/cancellation";
import { SubscriptionPlan } from "@/types/plan";

interface SubscriptionCardProps {
  currentPlan: SubscriptionPlan;
  onOpenCancellation: () => void;
  cancellationData: CancellationData | null;
  activeOffer: string | null;
  onReactivate: () => void;
}

export default function SubscriptionCard({
  currentPlan,
  onOpenCancellation,
  cancellationData,
  activeOffer,
  onReactivate,
}: SubscriptionCardProps) {
  const isCancelled = !!cancellationData;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Droplet className="w-7 h-7 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentPlan.name}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                isCancelled 
                  ? "bg-amber-100 text-amber-800 border border-amber-200" 
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {isCancelled ? "Canceling at Term End" : "Active Member"}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-semibold mt-0.5">
              CleanRide Member Tier • Vehicle: <span className="text-slate-800">2024 Tesla Model Y (3XYZ)</span>
            </p>
          </div>
        </div>

        {/* Pricing Badge */}
        <div className="sm:text-right">
          <div className="text-2xl font-black text-slate-900">
            {activeOffer?.includes("50%") ? (
              <span>
                <span className="line-through text-slate-400 text-base font-normal mr-2">{currentPlan.priceDisplay}</span>
                <span className="text-emerald-600">
                  {currentPlan.currency}{Math.round(currentPlan.monthlyAmount * 0.5)}
                </span>
                <span className="text-xs font-semibold text-slate-500"> / mo</span>
              </span>
            ) : activeOffer?.includes("Free") ? (
              <span>
                <span className="line-through text-slate-400 text-base font-normal mr-2">{currentPlan.priceDisplay}</span>
                <span className="text-amber-600">{currentPlan.currency}0</span>
                <span className="text-xs font-semibold text-slate-500"> (Next Month)</span>
              </span>
            ) : (
              <span>{currentPlan.priceDisplay} <span className="text-xs font-semibold text-slate-500">/ mo</span></span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Auto-renews monthly
          </p>
        </div>
      </div>

      {/* Applied Offer Banner */}
      {activeOffer && !isCancelled && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between gap-3 text-sm text-emerald-900 font-bold">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Active Perk Applied: <span className="underline decoration-emerald-400">{activeOffer}</span></span>
          </div>
          <span className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold shrink-0">
            Saved!
          </span>
        </div>
      )}

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-950">
                Your subscription will end on {cancellationData.effectiveEndDate}.
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Reason recorded: &ldquo;{cancellationData.reason || "General cancellation"}&rdquo;. You retain full wash access until your expiration date.
              </p>
            </div>
          </div>
          <button
            onClick={onReactivate}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reactivate Pass
          </button>
        </div>
      )}

      {/* Subscription Features & Usage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
            <Zap className="w-4 h-4 text-amber-500" /> Washes This Month
          </div>
          <div className="text-2xl font-black text-slate-900">
            {currentPlan.id === "nano-299" ? "2 Washes" : "8 Washes"}
          </div>
          <p className="text-xs font-semibold text-emerald-600">Saved vs single wash rates</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
            <Calendar className="w-4 h-4 text-blue-500" /> Next Billing Date
          </div>
          <div className="text-2xl font-black text-slate-900">Aug 31, 2026</div>
          <p className="text-xs font-medium text-slate-500">Auto-renews via Visa **** 8829</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Plan Benefits
          </div>
          <div className="text-sm font-bold text-slate-800">
            {currentPlan.features[0] || "Express Wash Access"}
          </div>
          <p className="text-xs font-medium text-slate-500">Included at 45+ locations</p>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <CreditCard className="w-4 h-4 text-slate-400" /> Managed securely by Stripe Subscriptions
        </div>

        {!isCancelled && (
          <button
            onClick={onOpenCancellation}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#cc142d] hover:bg-[#b00f24] active:bg-[#960a1c] text-white font-black text-xs sm:text-sm shadow-md shadow-red-500/20 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-white/90" /> Cancel Subscription
          </button>
        )}
      </div>
    </div>
  );
}
