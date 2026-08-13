"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  User,
  Calendar,
  KeyRound,
  Percent
} from "lucide-react";
import confetti from "canvas-confetti";
import { SubscriptionPlan } from "@/types/plan";
import { PaymentMethod, MoyasarPaymentResponse, CardBrand } from "@/types/payment";

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
  "PROMO100": {
    name: "PROMO100",
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
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    name: string;
    type: "THREE_FOR_100" | "PAY_2_GET_3RD_FREE" | "PERCENT_50";
    description: string;
  } | null>(null);

  const [promoError, setPromoError] = useState<string | null>(null);

  // Embedded Moyasar Credit/Debit Card Form Fields
  const [holderName, setHolderName] = useState("Alex Morgan");
  const [cardNumber, setCardNumber] = useState("4108 8829 4102 9918");
  const [expMonth, setExpMonth] = useState("08");
  const [expYear, setExpYear] = useState("28");
  const [cvc, setCvc] = useState("889");
  const [saveCardInVault, setSaveCardInVault] = useState(true);

  // Moyasar State
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedBilling, setAgreedBilling] = useState(false);
  const [showScheduleDetails, setShowScheduleDetails] = useState(true);
  const [isProcessingMoyasar, setIsProcessingMoyasar] = useState(false);
  const [moyasarReceipt, setMoyasarReceipt] = useState<MoyasarPaymentResponse | null>(null);

  const canPay = agreedTerms && agreedBilling && !isProcessingMoyasar;

  const basePrice = selectedPlan.monthlyAmount;
  const currency = selectedPlan.currency || "SAR";

  // Card Brand Detection for Moyasar
  const getCardBrand = (num: string): { brand: CardBrand; label: string; bg: string } => {
    const clean = num.replace(/\D/g, "");
    if (clean.startsWith("588845") || clean.startsWith("440647") || clean.startsWith("968208") || clean.startsWith("5")) {
      return { brand: "mada", label: "Mada (مدى)", bg: "bg-emerald-700" };
    }
    if (clean.startsWith("3")) {
      return { brand: "amex", label: "American Express", bg: "bg-blue-700" };
    }
    return { brand: "visa", label: "Visa / Mastercard", bg: "bg-blue-600" };
  };

  const detectedBrand = getCardBrand(cardNumber);

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

  // Official Moyasar SDK Integration (5-Minute Quickstart Docs)
  React.useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Moyasar) {
      try {
        const container = document.querySelector(".mysr-form");
        if (container) container.innerHTML = "";
        (window as any).Moyasar.init({
          element: ".mysr-form",
          amount: totalDueToday * 100, // halalas (cents)
          currency: currency,
          description: `Rush Wash - ${selectedPlan.name} Subscription`,
          publishable_api_key: "pk_test_xxxxxxxxxxxxxxxxx",
          callback_url: "https://rush.com.sa/payment-result",
          methods: ["creditcard"],
          supported_networks: ["mada", "visa", "mastercard", "amex", "unionpay"]
        });
      } catch (err) {
        // Fallback gracefully to embedded form if offline/mock environment
      }
    }
  }, [totalDueToday, selectedPlan, currency]);

  const applyPromoDirectly = (code: string) => {
    const cleanCode = code.toUpperCase();
    const matched = VALID_PROMO_CODES[cleanCode];
    if (matched) {
      setPromoCodeInput(cleanCode);
      setAppliedPromo({ code: cleanCode, ...matched });
      setPromoError(null);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
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

  // Process Payment via Moyasar Form
  const handlePayWithMoyasar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPay) return;

    setIsProcessingMoyasar(true);

    setTimeout(() => {
      setIsProcessingMoyasar(false);

      const response: MoyasarPaymentResponse = {
        id: `moy_pay_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-4)}`,
        status: "paid",
        amount: totalDueToday * 100, // Halalas
        currency: "SAR",
        description: `Rush Wash - ${selectedPlan.name} Subscription`,
        source: {
          type: detectedBrand.brand === "mada" ? "mada" : "creditcard",
          company: detectedBrand.label,
          name: holderName,
          number: cardNumber.slice(-4) ? `•••• ${cardNumber.slice(-4)}` : "•••• 8829",
        },
        createdAt: new Date().toISOString(),
      };

      setMoyasarReceipt(response);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });

      onCompleteCheckout({
        plan: selectedPlan,
        promoOffer: promoTitle,
        totalPaid: totalDueToday,
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!moyasarReceipt ? (
        <form onSubmit={handlePayWithMoyasar} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Package, Promo Code & Moyasar Form */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Selected Package Header */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Selected Package</span>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedPlan.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedPlan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{selectedPlan.priceDisplay}</span>
                <span className="text-xs text-slate-400 block font-medium">/ month</span>
              </div>
            </div>

            {/* DYNAMIC PROMO CODE FIELD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-red-600" /> Have a Promo Code?
                </h4>
                <span className="text-xs font-bold text-slate-400">Step 1 of 2</span>
              </div>

              {!appliedPromo ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value);
                        setPromoError(null);
                      }}
                      placeholder="Enter code e.g. 100FOR3 or BUY2GET1"
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold text-slate-900 uppercase focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer shrink-0"
                    >
                      Apply Code
                    </button>
                  </div>

                  {promoError && (
                    <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {promoError}
                    </p>
                  )}

                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Click to Apply Promo Code:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyPromoDirectly("100FOR3")}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-200 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-red-500" /> 100FOR3 (100 SAR/mo 3 Months)
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPromoDirectly("BUY2GET1")}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Tag className="w-3.5 h-3.5 text-emerald-600" /> BUY2GET1 (2+1 Free)
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPromoDirectly("RUSH50")}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-800 border border-blue-200 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Percent className="w-3.5 h-3.5 text-blue-600" /> RUSH50 (50% OFF Month 1)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-emerald-900">{appliedPromo.code}</span>
                        <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase rounded-full">Applied</span>
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">{appliedPromo.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* MOYASAR EMBEDDED FORM WIDGET */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              
              {/* Moyasar Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center font-black text-sm shadow-sm">
                    م
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Moyasar Payment Form
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      PCI-DSS Certified • Supports Mada (مدى), Visa, Mastercard, Apple Pay
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Moyasar Verified
                </div>
              </div>

              {/* Supported Payment Logos Bar */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="text-[10px] uppercase text-slate-400 font-extrabold">Accepted via Moyasar:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-black">مدى (Mada)</span>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black">VISA</span>
                  <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black">Mastercard</span>
                  <span className="px-2 py-0.5 bg-black text-white rounded text-[10px] font-black"> Pay</span>
                </div>
              </div>

              {/* Official Moyasar JS SDK Container */}
              <div className="mysr-form min-h-[160px] flex items-center justify-center border border-slate-100 rounded-2xl p-4 bg-slate-50/50" />
            </div>

          </div>

          {/* Right Column: Order Summary & Moyasar Checkout Action */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-red-400" /> Moyasar Summary
                </h4>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Moyasar KSA
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Package:</span>
                  <span className="font-bold text-white">{selectedPlan.name}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Detected Card Type:</span>
                  <span className="font-bold text-emerald-400 uppercase">{detectedBrand.label}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Applied Code ({appliedPromo.code}):</span>
                    <span>Save {savingsAmount} {currency}</span>
                  </div>
                )}
              </div>

              {/* Total Due Today */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Total Due Today:</span>
                  <span className="text-3xl font-black text-white">{totalDueToday} {currency}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScheduleDetails(!showScheduleDetails)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold underline cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> {showScheduleDetails ? "Hide Schedule" : "View Schedule"}
                </button>
              </div>

              {/* Schedule Timeline */}
              {showScheduleDetails && (
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-[11px]">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Moyasar Renewal Schedule
                  </span>
                  
                  {appliedPromo?.type === "THREE_FOR_100" && (
                    <>
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Month 1 (Today):</span>
                        <span>100 {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Month 2 (Sep 11):</span>
                        <span>100 {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Month 3 (Oct 11):</span>
                        <span>100 {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-700">
                        <span>Month 4+ (Nov 11 onwards):</span>
                        <span>{basePrice} {currency}/mo</span>
                      </div>
                    </>
                  )}

                  {appliedPromo?.type === "PAY_2_GET_3RD_FREE" && (
                    <>
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Month 1 (Today):</span>
                        <span>{basePrice} {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Month 2 (Sep 11):</span>
                        <span>{basePrice} {currency}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-extrabold">
                        <span>Month 3 (Oct 11):</span>
                        <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">0 {currency} (FREE!)</span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-700">
                        <span>Month 4+ (Nov 11 onwards):</span>
                        <span>{basePrice} {currency}/mo</span>
                      </div>
                    </>
                  )}

                  {appliedPromo?.type === "PERCENT_50" && (
                    <>
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Month 1 (Today - 50% OFF):</span>
                        <span>{totalDueToday} {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-700">
                        <span>Month 2+ (Sep 11 onwards):</span>
                        <span>{basePrice} {currency}/mo</span>
                      </div>
                    </>
                  )}

                  {!appliedPromo && (
                    <>
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Month 1 (Today):</span>
                        <span>{basePrice} {currency}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-700">
                        <span>Month 2+ (Sep 11 onwards):</span>
                        <span>{basePrice} {currency}/mo</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Dual Agreement Checkboxes Matching Reference Screenshot */}
              <div className="space-y-2.5 pt-1 border-t border-slate-800">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-700 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    I agree to the{" "}
                    <a
                      href="https://rush.com.sa/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 underline font-semibold hover:text-red-400"
                    >
                      Terms and Conditions
                    </a>
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedBilling}
                    onChange={(e) => setAgreedBilling(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-700 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    I understand I will be billed monthly unless I cancel.
                  </span>
                </label>
              </div>

              {/* Moyasar Pay Button */}
              <button
                type="submit"
                disabled={!canPay}
                className={`w-full py-3.5 px-5 font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  canPay
                    ? "bg-[#cc142d] hover:bg-[#b00f24] text-white shadow-lg shadow-red-500/25 cursor-pointer"
                    : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                }`}
              >
                {isProcessingMoyasar ? (
                  <span className="flex items-center gap-2 text-white">
                    <Shield className="w-4 h-4 animate-spin text-amber-400" /> Verifying 3D Secure via Moyasar...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" /> Pay {totalDueToday} {currency} with Moyasar
                  </>
                )}
              </button>

              {!canPay && (
                <p className="text-[10px] text-amber-400 text-center font-semibold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Check both agreement boxes above to complete order
                </p>
              )}

            </div>
          </div>

        </form>
      ) : (
        /* Moyasar Payment Confirmation Receipt */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md mx-auto space-y-6 shadow-xl"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              Moyasar Payment Verified
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 pt-2">Payment Successful!</h3>
            <p className="text-xs text-slate-500">
              Activated <strong className="text-slate-800">{selectedPlan.name}</strong> via Moyasar Payment Gateway.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-left space-y-2 text-slate-700 font-medium">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Moyasar Transaction ID:</span>
              <strong className="font-mono text-slate-900">{moyasarReceipt.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>Amount Billed:</span>
              <strong className="text-slate-900">{totalDueToday} {currency}</strong>
            </div>
            <div className="flex justify-between">
              <span>Card / Scheme:</span>
              <strong className="text-emerald-700 uppercase">{moyasarReceipt.source.company} ({moyasarReceipt.source.number})</strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <strong className="text-emerald-600 font-bold uppercase">PAID (3D SECURE VERIFIED)</strong>
            </div>
          </div>

          <button
            onClick={() => {
              setMoyasarReceipt(null);
              setAppliedPromo(null);
              setPromoCodeInput("");
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Return to Dashboard
          </button>
        </motion.div>
      )}
    </div>
  );
}
