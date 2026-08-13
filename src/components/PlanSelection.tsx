"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  ArrowRight,
  RefreshCw,
  Droplets,
  AlertCircle,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert
} from "lucide-react";
import confetti from "canvas-confetti";
import { SubscriptionPlan } from "@/types/plan";

interface PlanSelectionProps {
  currentPlan: SubscriptionPlan;
  onSelectPlan: (plan: SubscriptionPlan, option?: "IMMEDIATE" | "END_OF_PERIOD") => void;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: "rush-express-149",
    name: "Rush Express",
    badge: "Basic Unlimited",
    priceDisplay: "149 SAR",
    period: "month",
    monthlyAmount: 149,
    currency: "SAR",
    description: "Unlimited exterior washes with essential soft touch cleaning.",
    features: [
      "Unlimited monthly washes",
      "Pre-Soak Treatment",
      "Blow Drying finish",
      "Rush Active Foam",
      "Soft Touch Brush System",
    ],
    colorTheme: "slate",
  },
  {
    id: "rush-lava-199",
    name: "Rush Lava",
    badge: "Most Popular",
    priceDisplay: "199 SAR",
    period: "month",
    monthlyAmount: 199,
    currency: "SAR",
    description: "Enhanced underbody wash, Lava foam, and protective wax finish.",
    features: [
      "Everything in Rush Express",
      "Under Car Chassis Wash",
      "Lava Foam Wash",
      "Lava Wax Protectant",
      "Drying Brushes Finish",
    ],
    isPopular: true,
    colorTheme: "red",
  },
  {
    id: "rush-nano-ceramic-299",
    name: "Rush Nano Ceramic",
    badge: "Ultimate Shield",
    priceDisplay: "299 SAR",
    period: "month",
    monthlyAmount: 299,
    currency: "SAR",
    description: "Premium Nano Ceramic coating for mirror shine and water-repellent protection.",
    features: [
      "Everything in Rush Lava",
      "Nano Ceramic Paint Shield",
      "High-Gloss Hydrophobic Barrier",
      "UV & Oxidation Defense",
      "VIP Express Line Access",
    ],
    colorTheme: "purple",
  },
];

export default function PlanSelection({
  currentPlan,
  onSelectPlan,
}: PlanSelectionProps) {
  const activePlan = currentPlan || PLANS[0];
  const [selectedPlanId, setSelectedPlanId] = useState(activePlan?.id || PLANS[0].id);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [switchingPlan, setSwitchingPlan] = useState<SubscriptionPlan | null>(null);
  const [downgradeOption, setDowngradeOption] = useState<"END_OF_PERIOD" | "IMMEDIATE">("END_OF_PERIOD");

  const handlePlanChange = (plan: SubscriptionPlan) => {
    if (plan.id === activePlan.id) return;
    setSwitchingPlan(plan);
    setDowngradeOption("END_OF_PERIOD");
  };

  const confirmSwitch = () => {
    if (!switchingPlan) return;
    setSelectedPlanId(switchingPlan.id);
    onSelectPlan(switchingPlan, downgradeOption);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setSwitchingPlan(null);
  };

  // Prorata calculations for Upgrades (assuming 18 days left in 30 day cycle)
  const daysRemaining = 18;
  const totalDays = 30;

  const getUpgradeProrata = (targetPlan: SubscriptionPlan) => {
    const priceDiff = targetPlan.monthlyAmount - activePlan.monthlyAmount;
    const proratedAmount = Math.round((priceDiff / totalDays) * daysRemaining);
    const unusedCredit = Math.round((activePlan.monthlyAmount / totalDays) * daysRemaining);
    const newPlanCost = Math.round((targetPlan.monthlyAmount / totalDays) * daysRemaining);

    return {
      priceDiff,
      proratedAmount,
      unusedCredit,
      newPlanCost,
    };
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-[#cc142d]" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Rush Wash Unlimited Plans
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Prorated upgrades & flexible downgrade options. No hidden fees.
          </p>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              billingCycle === "yearly"
                ? "bg-[#cc142d] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Yearly <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">Save 15%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === activePlan.id;
          const isNano = plan.id.includes("nano");
          const isUpgrade = plan.monthlyAmount > activePlan.monthlyAmount;
          const isDowngrade = plan.monthlyAmount < activePlan.monthlyAmount;

          const price = billingCycle === "yearly"
            ? `${Math.round(plan.monthlyAmount * 0.85 * 12)} SAR`
            : plan.priceDisplay;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 border flex flex-col justify-between transition-all duration-200 ${
                plan.isPopular
                  ? "border-red-500 bg-gradient-to-b from-red-50/50 via-white to-white ring-2 ring-red-100 shadow-xl scale-[1.02]"
                  : isNano
                  ? "border-purple-300 bg-gradient-to-b from-purple-50/40 via-white to-white shadow-md hover:border-purple-400"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                  plan.isPopular
                    ? "bg-[#cc142d] text-white"
                    : isNano
                    ? "bg-purple-700 text-white"
                    : "bg-slate-900 text-white"
                }`}>
                  {plan.badge}
                </span>
              )}

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900">{plan.name}</h4>
                    {isNano && <Sparkles className="w-5 h-5 text-purple-600" />}
                    {plan.isPopular && <Crown className="w-5 h-5 text-[#cc142d]" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="py-3 border-y border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">{price}</span>
                    <span className="text-xs font-bold text-slate-400">
                      / {billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                      Billed annually (Includes 15% discount)
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                        plan.isPopular ? "text-red-600" : isNano ? "text-purple-600" : "text-emerald-600"
                      }`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Action Button */}
              <div className="pt-6">
                {isCurrent ? (
                  <div className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 font-extrabold text-xs text-center border border-slate-200">
                    Current Active Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handlePlanChange(plan)}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isUpgrade
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isUpgrade ? (
                      <>Upgrade (Prorated) <ArrowUpRight className="w-4 h-4" /></>
                    ) : (
                      <>Downgrade Options <ArrowDownRight className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Switch Confirmation Modal */}
      <AnimatePresence>
        {switchingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSwitchingPlan(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-6 border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  switchingPlan.monthlyAmount > activePlan.monthlyAmount
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {switchingPlan.monthlyAmount > activePlan.monthlyAmount ? (
                    <ArrowUpRight className="w-6 h-6" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {switchingPlan.monthlyAmount > activePlan.monthlyAmount
                      ? `Upgrade to ${switchingPlan.name}`
                      : `Downgrade to ${switchingPlan.name}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {switchingPlan.monthlyAmount > activePlan.monthlyAmount
                      ? "Prorated charge applied for remaining 18 days"
                      : "Choose when your downgrade takes effect"}
                  </p>
                </div>
              </div>

              {/* UPGRADE VIEW: Prorata Calculation Breakdown */}
              {switchingPlan.monthlyAmount > activePlan.monthlyAmount && (() => {
                const prorata = getUpgradeProrata(switchingPlan);
                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2.5 text-xs text-emerald-950">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-600">Current Plan Credit ({activePlan.name}):</span>
                        <span className="font-bold text-slate-700">-{prorata.unusedCredit} SAR</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-600">New Plan Charge ({switchingPlan.name}):</span>
                        <span className="font-bold text-slate-700">+{prorata.newPlanCost} SAR</span>
                      </div>
                      <div className="pt-2 border-t border-emerald-200 flex items-center justify-between font-black text-sm">
                        <span className="text-emerald-900">Total Prorated Amount Due Today:</span>
                        <span className="text-emerald-700 text-base">{prorata.proratedAmount} SAR</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        Starting today, your pass is upgraded to <strong className="text-slate-800">{switchingPlan.name}</strong>. Next billing on Aug 31 at regular price ({switchingPlan.priceDisplay}/mo).
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* DOWNGRADE VIEW: 2 Options (End of Period vs Immediate) + No Refunds Policy */}
              {switchingPlan.monthlyAmount < activePlan.monthlyAmount && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Select Downgrade Timing:
                  </label>

                  <div className="space-y-3">
                    {/* Option 1: End of Period */}
                    <div
                      onClick={() => setDowngradeOption("END_OF_PERIOD")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        downgradeOption === "END_OF_PERIOD"
                          ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-100 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="downgrade-opt"
                          checked={downgradeOption === "END_OF_PERIOD"}
                          onChange={() => setDowngradeOption("END_OF_PERIOD")}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              End of Billing Period (Recommended)
                            </span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase rounded-full">
                              Keep Perks
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Keep your current <strong className="text-slate-800">{activePlan.name}</strong> benefits until <strong className="text-slate-800">August 31, 2026</strong>. Your subscription will change to {switchingPlan.name} ({switchingPlan.priceDisplay}/mo) on your next billing date.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Immediate Switch (Now) */}
                    <div
                      onClick={() => setDowngradeOption("IMMEDIATE")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        downgradeOption === "IMMEDIATE"
                          ? "border-red-500 bg-red-50/50 ring-2 ring-red-100 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="downgrade-opt"
                          checked={downgradeOption === "IMMEDIATE"}
                          onChange={() => setDowngradeOption("IMMEDIATE")}
                          className="mt-0.5 text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <span className="font-bold text-sm text-slate-900">
                            Switch Immediately (Now)
                          </span>
                          <p className="text-xs text-slate-600 mt-1">
                            Downgrade your features to {switchingPlan.name} immediately today.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strict No Refunds Policy Notice */}
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-900 font-semibold">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-extrabold text-red-950">No Refunds Policy:</strong> Per subscription terms, no partial or prorated refunds are issued for immediate downgrades.
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSwitchingPlan(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSwitch}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                    switchingPlan.monthlyAmount > activePlan.monthlyAmount
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      : "bg-[#cc142d] hover:bg-[#b00f24] shadow-red-500/20"
                  }`}
                >
                  {switchingPlan.monthlyAmount > activePlan.monthlyAmount
                    ? "Confirm Upgrade & Pay Prorated Fee"
                    : "Confirm Downgrade"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
