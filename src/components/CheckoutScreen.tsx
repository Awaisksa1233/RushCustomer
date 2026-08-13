"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Receipt, 
  CreditCard,
  Tag,
  Check,
  X,
  Sparkles,
  Shield,
  Percent,
  ChevronRight,
  PlusCircle,
  CheckSquare
} from "lucide-react";
import confetti from "canvas-confetti";
import { SubscriptionPlan } from "@/types/plan";
import { PaymentMethod, MoyasarPaymentResponse } from "@/types/payment";

interface CheckoutScreenProps {
  selectedPlan: SubscriptionPlan;
  paymentMethods: PaymentMethod[];
  onCompleteCheckout: (details: {
    plan: SubscriptionPlan;
    promoOffer: string;
    totalPaid: number;
  }) => void;
}

// Available Valid Promo Codes
const VALID_PROMO_CODES: Record<string, {
  name: string;
  type: "THREE_FOR_100" | "PAY_2_GET_3RD_FREE" | "PERCENT_50";
  description: string;
}> = {
  "100FOR3": {
    name: "100FOR3",
    type: "THREE_FOR_100",
    description: "100 SAR / Month for First 3 Months (1st: 100, 2nd: 100, 3rd: 100 SAR)",
  },
  "BUY2GET1": {
    name: "BUY2GET1",
    type: "PAY_2_GET_3RD_FREE",
    description: "2+1 Offer: Pay 1st & 2nd Month, Get 3rd Month 100% FREE!",
  },
  "RUSH50": {
    name: "RUSH50",
    type: "PERCENT_50",
    description: "50% OFF First Month Subscription!",
  },
};

export default function CheckoutScreen({
  selectedPlan,
  paymentMethods,
  onCompleteCheckout,
}: CheckoutScreenProps) {
  // Promo State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    name: string;
    type: "THREE_FOR_100" | "PAY_2_GET_3RD_FREE" | "PERCENT_50";
    description: string;
  } | null>(null);

  const [promoError, setPromoError] = useState<string | null>(null);

  // Mandatory Dual Agreement State
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedBilling, setAgreedBilling] = useState(false);

  // Card Selection & Moyasar Form Visibility State
  // If paymentMethods exist, default to selecting the primary card (and hiding Moyasar form)
  const defaultSavedCard = paymentMethods.find((c) => c.isDefault) || paymentMethods[0] || null;
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(
    defaultSavedCard ? defaultSavedCard.id : null
  );

  // "If card is present, moyasar form should be hidden"
  // When a saved card is selected, useMoyasarForm is false.
  const [useMoyasarForm, setUseMoyasarForm] = useState<boolean>(!defaultSavedCard);

  // Moyasar SDK State
  const [isProcessingMoyasar, setIsProcessingMoyasar] = useState(false);
  const [moyasarReceipt, setMoyasarReceipt] = useState<MoyasarPaymentResponse | null>(null);

  // Disabled Check: Pay button disabled unless both agreement checkboxes are checked
  const canPay = agreedTerms && agreedBilling && !isProcessingMoyasar;

  const basePrice = selectedPlan.monthlyAmount;
  const currency = selectedPlan.currency || "SAR";

  // Calculate pricing based on applied promo code
  let totalDueToday = basePrice;
  let savingsAmount = 0;
  let promoTitle = "Standard Monthly";

  if (appliedPromo?.type === "THREE_FOR_100") {
    totalDueToday = 100;
    savingsAmount = Math.max(0, (basePrice - 100) * 3);
    promoTitle = `Code "${appliedPromo.code}" Applied: 100 SAR/mo (First 3 Months)`;
  } else if (appliedPromo?.type === "PAY_2_GET_3RD_FREE") {
    totalDueToday = basePrice;
    savingsAmount = basePrice;
    promoTitle = `Code "${appliedPromo.code}" Applied: 2+1 Offer (3rd Month Free)`;
  } else if (appliedPromo?.type === "PERCENT_50") {
    totalDueToday = Math.round(basePrice * 0.5);
    savingsAmount = basePrice - totalDueToday;
    promoTitle = `Code "${appliedPromo.code}" Applied: 50% OFF First Month`;
  }

  // Official Moyasar SDK Initialization
  useEffect(() => {
    if (useMoyasarForm && typeof window !== "undefined" && (window as any).Moyasar) {
      try {
        const container = document.querySelector(".mysr-form");
        if (container) container.innerHTML = "";
        (window as any).Moyasar.init({
          element: ".mysr-form",
          amount: totalDueToday * 100, // Halalas
          currency: currency,
          description: `Rush Wash - ${selectedPlan.name} Subscription`,
          publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || "pk_test_uVRcHBKku16yhUDrwUJ29FDvevjoCo571xJzjDW8",
          callback_url: "https://rush.com.sa/payment-result",
          methods: ["creditcard"],
          supported_networks: ["mada", "visa", "mastercard", "amex", "unionpay"]
        });
      } catch (err) {
        console.log("Moyasar init info:", err);
      }
    }
  }, [useMoyasarForm, totalDueToday, selectedPlan, currency]);

  // Dynamically enforce disabled state on Moyasar SDK inner button when agreements are incomplete
  useEffect(() => {
    const applyMoyasarBtnStyles = () => {
      const btn = document.querySelector(".mysr-form button, .mysr-form button.mysr-btn, .mysr-form button[type='submit']") as HTMLButtonElement | null;
      if (btn) {
        if (!canPay) {
          btn.setAttribute("disabled", "true");
          btn.style.opacity = "0.5";
          btn.style.cursor = "not-allowed";
          btn.style.pointerEvents = "none";
          btn.style.background = "#334155";
          btn.style.borderColor = "#475569";
          btn.style.backgroundImage = "none";
        } else {
          btn.removeAttribute("disabled");
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
          btn.style.pointerEvents = "auto";
          btn.style.background = "#cc142d";
          btn.style.borderColor = "#cc142d";
          btn.style.backgroundImage = "linear-gradient(135deg, #cc142d 0%, #b00f24 100%)";
        }
      }
    };

    applyMoyasarBtnStyles();
    const interval = setInterval(applyMoyasarBtnStyles, 300);
    return () => clearInterval(interval);
  }, [canPay, useMoyasarForm, totalDueToday]);

  // Apply promo code (1-click or input)
  const applyPromoDirectly = (code: string) => {
    const cleanCode = code.toUpperCase();
    const matched = VALID_PROMO_CODES[cleanCode];
    if (matched) {
      setPromoCodeInput(cleanCode);
      setAppliedPromo({ code: cleanCode, ...matched });
      setPromoError(null);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    applyPromoDirectly(promoCodeInput.trim());
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  };

  // Submit payment
  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPay) return;

    setIsProcessingMoyasar(true);

    setTimeout(() => {
      setIsProcessingMoyasar(false);

      const activeCard = paymentMethods.find((c) => c.id === selectedSavedCardId);
      const cardBrandLabel = activeCard ? activeCard.brand.toUpperCase() : "MADA";
      const cardLast4 = activeCard ? activeCard.last4 : "8829";

      const response: MoyasarPaymentResponse = {
        id: `moy_pay_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-4)}`,
        status: "paid",
        amount: totalDueToday * 100, // Halalas
        currency: "SAR",
        description: `Rush Wash - ${selectedPlan.name} Subscription`,
        source: {
          type: "mada",
          company: cardBrandLabel,
          name: activeCard ? activeCard.holderName : "Alex Morgan",
          number: `•••• ${cardLast4}`,
        },
        createdAt: new Date().toISOString(),
      };

      setMoyasarReceipt(response);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });

      onCompleteCheckout({
        plan: selectedPlan,
        promoOffer: promoTitle,
        totalPaid: totalDueToday,
      });
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {!moyasarReceipt ? (
        <form onSubmit={handleCompletePayment} className="space-y-6">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#cc142d] to-rose-700 flex items-center justify-center text-white font-black shadow-md shadow-red-500/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Rush Wash Checkout</h2>
                <p className="text-xs text-slate-400 font-medium">Complete your order in 5 simple steps</p>
              </div>
            </div>
            <span className="text-xs font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1 rounded-full">
              Red VIP Edition
            </span>
          </div>

          {/* STEP 1: PACKAGE DETAILS */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 1. Selected Package Details
              </span>
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Active Tier
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedPlan.name}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedPlan.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPlan.features.map((feat, idx) => (
                    <span key={idx} className="text-[11px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-700 flex items-center gap-1">
                      <Check className="w-3 h-3 text-red-500" /> {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="sm:text-right bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shrink-0">
                <div className="text-3xl font-black text-white">{selectedPlan.priceDisplay}</div>
                <span className="text-xs font-semibold text-slate-400">/ month auto-renew</span>
              </div>
            </div>
          </div>

          {/* STEP 2: AVAILABLE PROMOS */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> 2. Available Promos & Discounts
              </span>
              <span className="text-[10px] font-bold text-slate-400">Click to Apply</span>
            </div>

            {!appliedPromo ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value);
                      setPromoError(null);
                    }}
                    placeholder="Enter code e.g. 100FOR3, BUY2GET1, RUSH50"
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-mono font-bold text-white uppercase focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-6 py-3 bg-[#cc142d] hover:bg-[#b00f24] text-white font-black text-xs rounded-2xl transition-all shadow-md cursor-pointer shrink-0"
                  >
                    Apply Code
                  </button>
                </div>

                {promoError && (
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5 bg-red-950/40 p-3 rounded-2xl border border-red-800/60">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" /> {promoError}
                  </p>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    Instant 1-Click Available Promos:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => applyPromoDirectly("100FOR3")}
                      className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-left rounded-2xl border border-red-500/30 hover:border-red-500 text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 text-red-400 font-mono font-black mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-red-500" /> 100FOR3
                      </div>
                      <p className="text-[11px] text-slate-300 font-semibold leading-tight">
                        100 SAR / month for first 3 months
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPromoDirectly("BUY2GET1")}
                      className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-left rounded-2xl border border-emerald-500/30 hover:border-emerald-500 text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-black mb-1">
                        <Tag className="w-3.5 h-3.5 text-emerald-500" /> BUY2GET1
                      </div>
                      <p className="text-[11px] text-slate-300 font-semibold leading-tight">
                        2+1 Offer (Pay 2, Get 3rd FREE)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPromoDirectly("RUSH50")}
                      className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-left rounded-2xl border border-blue-500/30 hover:border-blue-500 text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 text-blue-400 font-mono font-black mb-1">
                        <Percent className="w-3.5 h-3.5 text-blue-500" /> RUSH50
                      </div>
                      <p className="text-[11px] text-slate-300 font-semibold leading-tight">
                        50% OFF First Month Subscription
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-emerald-300">{appliedPromo.code}</span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase rounded-full border border-emerald-500/30">Active</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">{appliedPromo.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* STEP 3: RENEWAL SCHEDULE */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 3. Renewable Schedule Timeline
              </span>
              <span className="text-[10px] font-bold text-slate-400">Transparent Billing</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
              {appliedPromo?.type === "THREE_FOR_100" && (
                <>
                  <div className="flex justify-between text-emerald-400 font-bold p-1">
                    <span>Month 1 (Today):</span>
                    <span>100 {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 p-1 border-t border-slate-700/60">
                    <span>Month 2 (Sep 11):</span>
                    <span>100 {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 p-1 border-t border-slate-700/60">
                    <span>Month 3 (Oct 11):</span>
                    <span>100 {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 p-1 border-t border-slate-700">
                    <span>Month 4+ (Nov 11 onwards):</span>
                    <span>{basePrice} {currency} / month</span>
                  </div>
                </>
              )}

              {appliedPromo?.type === "PAY_2_GET_3RD_FREE" && (
                <>
                  <div className="flex justify-between text-emerald-400 font-bold p-1">
                    <span>Month 1 (Today):</span>
                    <span>{basePrice} {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 p-1 border-t border-slate-700/60">
                    <span>Month 2 (Sep 11):</span>
                    <span>{basePrice} {currency}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-extrabold p-1 border-t border-slate-700/60">
                    <span>Month 3 (Oct 11):</span>
                    <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">0 {currency} (100% FREE!)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 p-1 border-t border-slate-700">
                    <span>Month 4+ (Nov 11 onwards):</span>
                    <span>{basePrice} {currency} / month</span>
                  </div>
                </>
              )}

              {appliedPromo?.type === "PERCENT_50" && (
                <>
                  <div className="flex justify-between text-emerald-400 font-bold p-1">
                    <span>Month 1 (Today - 50% OFF):</span>
                    <span>{totalDueToday} {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 p-1 border-t border-slate-700">
                    <span>Month 2+ (Sep 11 onwards):</span>
                    <span>{basePrice} {currency} / month</span>
                  </div>
                </>
              )}

              {!appliedPromo && (
                <>
                  <div className="flex justify-between text-emerald-400 font-bold p-1">
                    <span>Month 1 (Today):</span>
                    <span>{basePrice} {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 p-1 border-t border-slate-700">
                    <span>Month 2+ (Sep 11 onwards):</span>
                    <span>{basePrice} {currency} / month</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* STEP 4: AGREEMENT */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" /> 4. Customer Agreements (Required)
              </span>
              {!(agreedTerms && agreedBilling) && (
                <span className="text-[10px] font-bold text-red-400 bg-red-950/50 px-2.5 py-0.5 rounded-full border border-red-800/60">
                  Check both boxes to enable pay
                </span>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer select-none p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-700 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-200 font-medium">
                  I agree to the{" "}
                  <a
                    href="https://rush.com.sa/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 underline font-extrabold hover:text-red-400"
                  >
                    Terms and Conditions
                  </a>
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={agreedBilling}
                  onChange={(e) => setAgreedBilling(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-700 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-200 font-medium">
                  I understand I will be billed monthly unless I cancel.
                </span>
              </label>
            </div>
          </div>

          {/* STEP 5: CARD & PAYMENT SELECTION */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> 5. Card & Payment Method
              </span>
              <span className="text-[10px] font-bold text-slate-400">Moyasar Gateway</span>
            </div>

            {/* Saved Card Selection List */}
            {paymentMethods.length > 0 && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Card on File:
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {paymentMethods.map((card) => {
                    const isSelected = !useMoyasarForm && selectedSavedCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedSavedCardId(card.id);
                          setUseMoyasarForm(false);
                        }}
                        className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-red-950/30 border-red-500 text-white shadow-md shadow-red-500/10"
                            : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                            card.brand === "visa" ? "bg-blue-600" : "bg-red-600"
                          }`}>
                            {card.brand.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">
                                {card.brand.toUpperCase()} ending in {card.last4}
                              </span>
                              {card.isDefault && (
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-md">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Expires {card.expMonth}/{card.expYear} • {card.holderName}</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-red-500 bg-red-600 text-white" : "border-slate-600"
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Option to Add / Use New Card */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseMoyasarForm(!useMoyasarForm);
                      if (!useMoyasarForm) setSelectedSavedCardId(null);
                      else if (defaultSavedCard) setSelectedSavedCardId(defaultSavedCard.id);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-extrabold flex items-center gap-1.5 cursor-pointer underline"
                  >
                    <PlusCircle className="w-4 h-4 text-red-500" />
                    {useMoyasarForm ? "Use saved card instead" : "+ Add / Pay with New Card via Moyasar SDK"}
                  </button>
                </div>
              </div>
            )}

            {/* IF CARD IS PRESENT, MOYASAR FORM IS HIDDEN (Renders ONLY when useMoyasarForm is true) */}
            {useMoyasarForm ? (
              <div className="pt-3 space-y-3 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Official Moyasar Payment Form:
                </span>
                <div className={`mysr-form w-full rounded-2xl p-2 bg-white transition-all ${!canPay ? "mysr-form-disabled opacity-50 pointer-events-none" : ""}`} />
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Selected saved card on file will be charged automatically via Moyasar recurring vault.</span>
              </div>
            )}
          </div>

          {/* STEP 6: PAY ACTION BUTTON (Rendered ONLY if saved card is selected; HIDDEN when Moyasar SDK form is active) */}
          {!useMoyasarForm && (
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={!canPay}
                className={`w-full py-4 px-6 font-black text-base rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  canPay
                    ? "bg-[#cc142d] hover:bg-[#b00f24] active:bg-[#960a1c] text-white shadow-xl shadow-red-500/30 cursor-pointer transform active:scale-[0.99]"
                    : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none opacity-60"
                }`}
              >
                {isProcessingMoyasar ? (
                  <span className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5 animate-spin text-amber-400" /> Processing via Moyasar Gateway...
                  </span>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-white/90" /> Pay {totalDueToday} {currency} with Saved Card
                  </>
                )}
              </button>

              {!canPay && (
                <p className="text-xs text-amber-400 text-center font-bold flex items-center justify-center gap-1.5 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  Please check both mandatory agreement boxes in Step 4 to enable the Pay button.
                </p>
              )}
            </div>
          )}

        </form>
      ) : (
        /* Moyasar Payment Confirmation Receipt */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 text-center max-w-md mx-auto space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              Moyasar Payment Verified
            </span>
            <h3 className="text-2xl font-extrabold text-white pt-2">Payment Successful!</h3>
            <p className="text-xs text-slate-400">
              Activated <strong className="text-white">{selectedPlan.name}</strong> via Moyasar Gateway.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-left space-y-2 text-slate-300 font-medium">
            <div className="flex justify-between border-b border-slate-700/80 pb-2">
              <span className="text-slate-400">Moyasar Transaction ID:</span>
              <strong className="font-mono text-white">{moyasarReceipt.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>Amount Billed:</span>
              <strong className="text-white">{totalDueToday} {currency}</strong>
            </div>
            <div className="flex justify-between">
              <span>Card / Scheme:</span>
              <strong className="text-emerald-400 uppercase">{moyasarReceipt.source.company} ({moyasarReceipt.source.number})</strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <strong className="text-emerald-400 font-bold uppercase">PAID (3D SECURE VERIFIED)</strong>
            </div>
          </div>

          <button
            onClick={() => {
              setMoyasarReceipt(null);
              setAppliedPromo(null);
              setPromoCodeInput("");
            }}
            className="w-full py-3.5 bg-[#cc142d] hover:bg-[#b00f24] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/25 cursor-pointer"
          >
            Return to Dashboard
          </button>
        </motion.div>
      )}
    </div>
  );
}
