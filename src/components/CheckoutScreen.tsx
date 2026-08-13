"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CheckSquare,
  QrCode,
  Smartphone,
  ExternalLink,
  Bug
} from "lucide-react";
import confetti from "canvas-confetti";
import { SubscriptionPlan } from "@/types/plan";
import { PaymentMethod, MoyasarPaymentResponse } from "@/types/payment";
import ApplePayDebugWindow, { ApplePayLogEntry } from "@/components/ApplePayDebugWindow";

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
  const [applePayError, setApplePayError] = useState<string | null>(null);

  // Apple Pay QR Code State (for non-Apple devices)
  const [showApplePayQR, setShowApplePayQR] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(true);
  const [showDebugSheet, setShowDebugSheet] = useState(false);
  const qrModalRef = useRef<HTMLDivElement>(null);

  // Apple Pay Live Debug Window State
  const [isApplePayDebugOpen, setIsApplePayDebugOpen] = useState(false);
  const [applePayLogs, setApplePayLogs] = useState<ApplePayLogEntry[]>([]);

  const addApplePayLog = (entry: Omit<ApplePayLogEntry, "id" | "timestamp">) => {
    const newEntry: ApplePayLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      ...entry,
    };
    setApplePayLogs((prev) => [newEntry, ...prev]);
  };

  // Detect Apple device on mount & handle QR scan handoff params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod|macintosh|mac os x/.test(ua) && 
                      (navigator.maxTouchPoints > 0 || /safari/.test(ua));
      const hasApplePay = !!(window as any).ApplePaySession;
      setIsAppleDevice(isApple || hasApplePay);

      const params = new URLSearchParams(window.location.search);
      const method = params.get("method");
      const promo = params.get("promo");

      if (method === "applepay") {
        setPaymentChoice("applepay");
        setUseMoyasarForm(false);
        setAgreedTerms(true);
        setAgreedBilling(true);
      }

      if (promo && VALID_PROMO_CODES[promo.toUpperCase()]) {
        const cleanCode = promo.toUpperCase();
        setPromoCodeInput(cleanCode);
        setAppliedPromo({ code: cleanCode, ...VALID_PROMO_CODES[cleanCode] });
      }
    }
  }, []);

  // Mandatory Dual Agreement State
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedBilling, setAgreedBilling] = useState(false);

  // Card Selection & Moyasar Form Visibility State
  // If paymentMethods exist, default to selecting the primary card (and hiding Moyasar form)
  const defaultSavedCard = paymentMethods.find((c) => c.isDefault) || paymentMethods[0] || null;
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(
    defaultSavedCard ? defaultSavedCard.id : null
  );

  // Payment Choice State ("card" | "applepay" | "saved") - Default to Moyasar Card Form
  const [paymentChoice, setPaymentChoice] = useState<"applepay" | "card" | "saved">("card");

  // Moyasar form is visible by default when paymentChoice is "card"
  const [useMoyasarForm, setUseMoyasarForm] = useState<boolean>(true);

  // Sync useMoyasarForm with paymentChoice
  useEffect(() => {
    setUseMoyasarForm(paymentChoice === "card");
  }, [paymentChoice]);

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
          callback_url: "https://rush-customer.vercel.app/payment-result",
          methods: ["creditcard"],
          save_card: true,
          savecard: true,
          supported_networks: ["mada", "visa", "mastercard"]
        });
      } catch (err) {
        console.log("Moyasar init info:", err);
      }
    }
  }, [useMoyasarForm, totalDueToday, selectedPlan, currency]);

  // Build dynamic Apple Pay line items based on active promo
  const buildApplePayLineItems = () => {
    const items: { label: string; amount: string; type: "final" | "pending" }[] = [];

    if (appliedPromo?.type === "THREE_FOR_100") {
      items.push({ label: `${selectedPlan.name} (Regular Price)`, amount: basePrice.toFixed(2), type: "final" });
      items.push({ label: `Promo "${appliedPromo.code}" — 100 SAR/mo x3`, amount: `-${(basePrice - 100).toFixed(2)}`, type: "final" });
    } else if (appliedPromo?.type === "PERCENT_50") {
      items.push({ label: `${selectedPlan.name} (Regular Price)`, amount: basePrice.toFixed(2), type: "final" });
      items.push({ label: `50% OFF First Month (${appliedPromo.code})`, amount: `-${savingsAmount.toFixed(2)}`, type: "final" });
    } else if (appliedPromo?.type === "PAY_2_GET_3RD_FREE") {
      items.push({ label: `${selectedPlan.name} — Month 1`, amount: basePrice.toFixed(2), type: "final" });
      items.push({ label: `3rd Month FREE (${appliedPromo.code})`, amount: "0.00", type: "pending" });
    } else {
      items.push({ label: `${selectedPlan.name} Subscription`, amount: basePrice.toFixed(2), type: "final" });
    }

    return items;
  };

  // Build Apple Pay recurringPaymentRequest
  const buildRecurringPaymentRequest = () => {
    const now = new Date();
    const nextRenewalDate = new Date(now);

    const recurring: any = {
      paymentDescription: `Rush Wash — ${selectedPlan.name} Monthly Subscription`,
      regularBilling: {
        label: `Rush Wash - ${selectedPlan.name}`,
        amount: basePrice.toFixed(2),
        paymentTiming: "recurring",
        intervalUnit: "month",
        intervalCount: 1,
      },
      managementURL: "https://rush-customer.vercel.app/account",
      billingAgreement: `You will be charged ${basePrice} ${currency}/month for ${selectedPlan.name}. Cancel anytime from your account settings.`,
    };

    if (appliedPromo?.type === "THREE_FOR_100") {
      // 100 SAR/month for first 3 months. Standard rate starts in 3 months!
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 3);
      recurring.regularBilling.recurringPaymentStartDate = nextRenewalDate.toISOString();

      recurring.trialBilling = {
        label: `Promo: 100 SAR/month (First 3 Months)`,
        amount: "100.00",
        paymentTiming: "recurring",
        intervalUnit: "month",
        intervalCount: 1,
      };
      recurring.billingAgreement = `Promo ${appliedPromo.code}: 100 SAR/month for the first 3 months. Standard rate of ${basePrice} ${currency}/month resumes on ${nextRenewalDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Cancel anytime.`;
    } else if (appliedPromo?.type === "PERCENT_50") {
      // 50% OFF first month. Standard rate starts in 1 month!
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
      recurring.regularBilling.recurringPaymentStartDate = nextRenewalDate.toISOString();

      recurring.trialBilling = {
        label: `50% OFF First Month (${totalDueToday} ${currency})`,
        amount: totalDueToday.toFixed(2),
        paymentTiming: "immediate",
        intervalUnit: "month",
        intervalCount: 1,
      };
      recurring.billingAgreement = `Promo ${appliedPromo.code}: First month 50% off (${totalDueToday} ${currency}). Standard rate of ${basePrice} ${currency}/month resumes on ${nextRenewalDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Cancel anytime.`;
    } else if (appliedPromo?.type === "PAY_2_GET_3RD_FREE") {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
      recurring.regularBilling.recurringPaymentStartDate = nextRenewalDate.toISOString();
      recurring.billingAgreement = `Promo ${appliedPromo.code}: Pay months 1 & 2 at regular price (${basePrice} ${currency}), 3rd month is 100% FREE! Standard rate resumes month 4. Cancel anytime.`;
    } else {
      // Standard monthly plan with no promo: Next renewal starts in 1 month!
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
      recurring.regularBilling.recurringPaymentStartDate = nextRenewalDate.toISOString();
    }

    return recurring;
  };

  // Handle Native Apple Pay 1-Click Subscription with Certificate Merchant Validation
  const handleApplePaySubscribe = async () => {
    if (!canPay) return;
    setApplePayError(null);
    setIsProcessingMoyasar(true);

    addApplePayLog({
      type: "info",
      message: "Initiating Apple Pay Checkout",
      details: { plan: selectedPlan.name, totalDueToday, currency, promo: appliedPromo?.code || "None" },
    });

    const ApplePaySession = typeof window !== "undefined" ? (window as any).ApplePaySession : null;

    if (!ApplePaySession) {
      addApplePayLog({
        type: "warn",
        message: "ApplePaySession object not defined in window (Non-Safari / Non-iOS device)",
      });
    }

    // Try native ApplePaySession (supports iOS 18 native circular "Scan Code with iPhone" modal & Safari 1-click)
    const canTryApplePayJS = ApplePaySession && (
      (typeof ApplePaySession.supportsVersion === "function" && ApplePaySession.supportsVersion(14)) ||
      (typeof ApplePaySession.canMakePayments === "function" && ApplePaySession.canMakePayments())
    );

    if (canTryApplePayJS) {
      addApplePayLog({
        type: "success",
        message: "ApplePaySession JS v14 supported. Initializing native Apple Pay session...",
      });

      try {
        const paymentRequest: any = {
          countryCode: "SA",
          currencyCode: currency,
          supportedNetworks: ["mada", "visa", "mastercard"],
          merchantCapabilities: ["supports3DS"],
          lineItems: buildApplePayLineItems(),
          total: {
            label: `Rush Wash - ${selectedPlan.name}`,
            amount: totalDueToday.toFixed(2),
            type: "final",
          },
          recurringPaymentRequest: buildRecurringPaymentRequest(),
        };

        addApplePayLog({
          type: "info",
          message: "Created ApplePayPaymentRequest v14 Payload",
          details: paymentRequest,
        });

        // Use Apple Pay JS version 14 for recurring + lineItems support
        addApplePayLog({
          type: "info",
          message: "Constructing new ApplePaySession(14, paymentRequest)...",
        });

        const session = new ApplePaySession(14, paymentRequest);

        // Merchant Validation Callback (uses merchant_id.pem & merchant_id.key)
        session.onvalidatemerchant = async (event: any) => {
          addApplePayLog({
            type: "info",
            message: "Native Callback: session.onvalidatemerchant triggered by Apple",
            details: { validationURL: event.validationURL },
          });

          try {
            const res = await fetch("/api/applepay/validate-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ validationUrl: event.validationURL }),
            });

            const merchantSession = await res.json();

            if (merchantSession.error) {
              addApplePayLog({
                type: "error",
                message: "Backend merchant validation failed!",
                details: { status: res.status, merchantSession },
              });
              console.error("Apple Pay Merchant Validation Error:", merchantSession);
              session.abort();
              setIsProcessingMoyasar(false);
              setApplePayError("Apple Pay Merchant Validation failed. Please use Credit Card.");
              return;
            }

            addApplePayLog({
              type: "success",
              message: "Backend merchant session validated successfully. Completing merchant validation with Apple...",
              details: { merchantSession },
            });

            session.completeMerchantValidation(merchantSession);
          } catch (err: any) {
            addApplePayLog({
              type: "error",
              message: `Failed merchant validation API call: ${err.message}`,
              details: { error: err.message },
            });
            console.error("Failed merchant validation:", err);
            session.abort();
            setIsProcessingMoyasar(false);
            setApplePayError("Could not validate Apple Pay session.");
          }
        };

        // Payment Authorization Callback (Triggers ONLY when user authorizes on native Apple Pay sheet)
        session.onpaymentauthorized = (event: any) => {
          addApplePayLog({
            type: "success",
            message: "Native Callback: session.onpaymentauthorized triggered! Payment authorized by user.",
            details: event.payment,
          });

          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          setIsProcessingMoyasar(false);

          const response: MoyasarPaymentResponse = {
            id: `moy_pay_apple_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-4)}`,
            status: "paid",
            amount: totalDueToday * 100, // Halalas
            currency: currency,
            description: `Rush Wash - ${selectedPlan.name} Subscription (Apple Pay)`,
            source: {
              type: "applepay",
              company: "Apple Pay (Mada / Visa)",
              name: "Apple Pay User",
              number: "•••• 8829",
            },
            createdAt: new Date().toISOString(),
          };

          setMoyasarReceipt(response);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

          onCompleteCheckout({
            plan: selectedPlan,
            promoOffer: `${promoTitle} via Apple Pay`,
            totalPaid: totalDueToday,
          });
        };

        session.oncancel = () => {
          addApplePayLog({
            type: "warn",
            message: "Native Callback: session.oncancel triggered. User dismissed or cancelled Apple Pay sheet.",
          });
          setIsProcessingMoyasar(false);
        };

        // Trigger native Apple Pay sheet popup
        addApplePayLog({
          type: "info",
          message: "Calling session.begin() to launch native Apple Pay sheet...",
        });

        session.begin();
        return;
      } catch (err: any) {
        addApplePayLog({
          type: "error",
          message: `Apple Pay Session error: ${err.message}`,
          details: { error: err.message, stack: err.stack },
        });
        console.error("Apple Pay Session error:", err);
        setIsProcessingMoyasar(false);
        setApplePayError("Apple Pay initialization failed on this device/browser. Please use Credit / Debit card.");
        return;
      }
    }

    // Non-Apple device or unsupported browser
    addApplePayLog({
      type: "warn",
      message: "ApplePaySession is not supported on this browser or device.",
    });

    setIsProcessingMoyasar(false);
    setApplePayError("Apple Pay requires Safari on iOS or Mac. Please select Credit / Debit card.");
  };

  // Generate Apple Pay checkout QR URL (links to rush-customer.vercel.app checkout on Safari)
  const applePayQRUrl = `https://rush-customer.vercel.app/checkout?plan=${selectedPlan.id}&amount=${totalDueToday}&promo=${appliedPromo?.code || ""}&method=applepay`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(applePayQRUrl)}&bgcolor=0f172a&color=ffffff&format=svg`;

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
          btn.style.background = "#c91e2f";
          btn.style.borderColor = "#c91e2f";
          btn.style.backgroundImage = "linear-gradient(135deg, #c91e2f 0%, #b01725 100%)";
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
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-28 sm:pb-8 px-2 sm:px-0">
      {!moyasarReceipt ? (
        <form onSubmit={handleCompletePayment} className="space-y-5 sm:space-y-6">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c91e2f] to-rose-700 flex items-center justify-center text-white font-black shadow-md shadow-red-500/30">
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
                    className="px-6 py-3 bg-[#c91e2f] hover:bg-[#b01725] text-white font-black text-xs rounded-2xl transition-all shadow-md cursor-pointer shrink-0"
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

          {/* STEP 5: PAYMENT METHOD SELECTION */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> 5. Select Payment Method
              </span>
              <span className="text-[10px] font-bold text-slate-400">Moyasar Gateway</span>
            </div>

            {applePayError && (
              <p className="text-xs font-semibold text-amber-300 flex items-center gap-2 bg-amber-950/40 p-3 rounded-2xl border border-amber-800/60">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{applePayError}</span>
              </p>
            )}

            {/* Payment Choice Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Apple Pay */}
              <button
                type="button"
                onClick={() => {
                  setPaymentChoice("applepay");
                  setUseMoyasarForm(false);
                }}
                className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  paymentChoice === "applepay"
                    ? "bg-black border-slate-600 text-white shadow-xl shadow-slate-900/50 ring-2 ring-slate-500/50"
                    : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-white text-xl font-serif">
                    
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-white block">Apple Pay</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isAppleDevice ? "1-Click Express Checkout" : "Safari on iPhone / Mac required"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentChoice === "applepay" ? "border-white bg-white text-black" : "border-slate-600"
                  }`}>
                    {paymentChoice === "applepay" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Option B: Credit / Mada / Debit Card */}
              <button
                type="button"
                onClick={() => {
                  setPaymentChoice("card");
                  setUseMoyasarForm(true);
                }}
                className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  paymentChoice === "card"
                    ? "bg-red-950/30 border-red-500 text-white shadow-md shadow-red-500/10 ring-2 ring-red-500/40"
                    : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-white block">Credit / Debit / Mada</span>
                    <span className="text-[11px] text-slate-400 font-medium">Official Moyasar Form</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  paymentChoice === "card" ? "border-red-500 bg-red-600 text-white" : "border-slate-600"
                }`}>
                  {paymentChoice === "card" && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>

            {/* Saved Card Option (If Saved Cards Exist) */}
            {paymentMethods.length > 0 && (
              <div className="pt-2 space-y-3 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or Charge Saved Card on File:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {paymentMethods.map((card) => {
                    const isSelected = paymentChoice === "saved" && selectedSavedCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedSavedCardId(card.id);
                          setPaymentChoice("saved");
                          setUseMoyasarForm(false);
                        }}
                        className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-red-950/30 border-red-500 text-white shadow-md shadow-red-500/10 ring-2 ring-red-500/40"
                            : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 shrink-0 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm overflow-hidden border border-slate-700">
                            {card.brand === "visa" && (
                              <div className="w-full h-full bg-[#1A1F71] text-white text-[11px] font-black italic tracking-wider flex items-center justify-center font-serif">
                                VISA
                              </div>
                            )}
                            {card.brand === "mastercard" && (
                              <div className="w-full h-full bg-slate-950 text-white flex items-center justify-center">
                                <div className="flex -space-x-1.5 items-center">
                                  <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                                  <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
                                </div>
                              </div>
                            )}
                            {card.brand === "mada" && (
                              <div className="w-full h-full bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center">
                                مدى
                              </div>
                            )}
                            {card.brand !== "visa" && card.brand !== "mastercard" && card.brand !== "mada" && (
                              <div className="w-full h-full bg-slate-800 text-white text-[10px] font-bold uppercase flex items-center justify-center">
                                {card.brand.slice(0, 3)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white uppercase">
                                {card.brand} ending in {card.last4}
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
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Moyasar SDK Form Rendered when paymentChoice is "card" */}
            {paymentChoice === "card" && (
              <div className="pt-3 space-y-3 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                    Official Moyasar Card Form:
                  </span>
                  
                  {/* Accepted Payment Scheme Logos */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-emerald-800 text-white px-2.5 py-1 rounded-lg border border-emerald-500/40 text-[10px] font-black tracking-wide shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <span>مدى mada</span>
                    </div>
                    <div className="bg-[#1A1F71] text-white px-3 py-1 rounded-lg border border-blue-400/40 text-[11px] font-black italic tracking-widest shadow-sm font-serif">
                      VISA
                    </div>
                    <div className="bg-slate-950 text-white px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
                      <div className="flex -space-x-1.5 items-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                        <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
                      </div>
                      <span className="text-[10px] font-black tracking-tight text-slate-200">mastercard</span>
                    </div>
                  </div>
                </div>

                <div className={`mysr-form w-full rounded-2xl p-2 bg-white transition-all ${!canPay ? "mysr-btn-disabled" : ""}`} />
              </div>
            )}
          </div>

          {/* DEBUG: Apple Pay Sheet Preview */}
          {paymentChoice === "applepay" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowDebugSheet(!showDebugSheet)}
                className="flex items-center gap-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Bug className="w-3.5 h-3.5" />
                {showDebugSheet ? "Hide" : "Show"} Apple Pay Sheet Debug Preview
              </button>

              {showDebugSheet && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-3xl overflow-hidden border border-slate-700 shadow-2xl"
                >
                  {/* Sheet Header */}
                  <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-5 pt-5 pb-4 text-center border-b border-slate-700/60">
                    <div className="w-12 h-12 rounded-2xl bg-black border border-slate-600 flex items-center justify-center text-white text-2xl font-serif mx-auto mb-2 shadow-lg">
                      
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apple Pay Sheet Preview</p>
                    <p className="text-xs font-extrabold text-amber-400 mt-0.5">⚠ DEBUG MODE — Not a real Apple Pay sheet</p>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-slate-900 px-5 py-4 space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Summary</p>
                    {buildApplePayLineItems().map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center py-1.5 ${
                        idx > 0 ? "border-t border-slate-800/60" : ""
                      }`}>
                        <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.type === "pending" && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded">PENDING</span>
                          )}
                          <span className={`text-xs font-bold ${
                            item.amount.startsWith("-") ? "text-emerald-400" : "text-white"
                          }`}>
                            {item.amount} {currency}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-slate-700">
                      <span className="text-sm font-black text-white">TOTAL</span>
                      <span className="text-sm font-black text-white">{totalDueToday.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-medium">Type</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Final</span>
                    </div>
                  </div>

                  {/* Recurring Payment Details */}
                  <div className="bg-slate-950 px-5 py-4 space-y-2.5 border-t border-slate-700/60">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">recurringPaymentRequest</p>
                    {(() => {
                      const rpr = buildRecurringPaymentRequest();
                      return (
                        <div className="space-y-2">
                          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500 font-medium">paymentDescription</span>
                              <span className="text-white font-semibold text-right max-w-[60%]">{rpr.paymentDescription}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500 font-medium">managementURL</span>
                              <span className="text-blue-400 font-mono text-[10px]">{rpr.managementURL}</span>
                            </div>
                          </div>

                          {/* Regular Billing */}
                          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-1.5">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">regularBilling</p>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">label</span>
                              <span className="text-white font-semibold">{rpr.regularBilling.label}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">amount</span>
                              <span className="text-white font-bold">{rpr.regularBilling.amount} {currency}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">interval</span>
                              <span className="text-slate-300 font-medium">
                                Every {rpr.regularBilling.intervalCount} {rpr.regularBilling.intervalUnit}(s)
                              </span>
                            </div>
                          </div>

                          {/* Trial Billing (if exists) */}
                          {rpr.trialBilling && (
                            <div className="bg-amber-950/30 rounded-xl p-3 border border-amber-800/40 space-y-1.5">
                              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">trialBilling (Intro Offer)</p>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">label</span>
                                <span className="text-amber-300 font-semibold">{rpr.trialBilling.label}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">amount</span>
                                <span className="text-amber-300 font-bold">{rpr.trialBilling.amount} {currency}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">paymentTiming</span>
                                <span className="text-amber-300 font-medium">{rpr.trialBilling.paymentTiming}</span>
                              </div>
                            </div>
                          )}

                          {/* Billing Agreement */}
                          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">billingAgreement</p>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">{rpr.billingAgreement}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Raw JSON */}
                  <details className="bg-slate-950 border-t border-slate-700/60">
                    <summary className="px-5 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors">
                      Raw paymentRequest JSON
                    </summary>
                    <pre className="px-5 pb-4 text-[10px] font-mono text-slate-400 overflow-x-auto leading-relaxed max-h-72 overflow-y-auto">
{JSON.stringify({
  countryCode: "SA",
  currencyCode: currency,
  supportedNetworks: ["mada", "visa", "mastercard"],
  merchantCapabilities: ["supports3DS"],
  lineItems: buildApplePayLineItems(),
  total: {
    label: `Rush Wash - ${selectedPlan.name}`,
    amount: totalDueToday.toFixed(2),
    type: "final",
  },
  recurringPaymentRequest: buildRecurringPaymentRequest(),
}, null, 2)}
                    </pre>
                  </details>

                  {/* Session Version */}
                  <div className="bg-slate-900 px-5 py-2.5 border-t border-slate-700/60 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500">ApplePaySession Version</span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">v14</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}



          <div className="pt-2 space-y-3">
            {paymentChoice === "applepay" ? (
              <div className="w-full space-y-2">
                {isProcessingMoyasar ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-4 px-6 rounded-2xl font-black text-base bg-black text-white border border-slate-700 flex items-center justify-center gap-2.5 shadow-2xl opacity-80"
                  >
                    <Shield className="w-5 h-5 animate-spin text-amber-400" /> Processing Apple Pay...
                  </button>
                ) : (
                  <apple-pay-button
                    buttonstyle="black"
                    type="subscribe"
                    locale="en-US"
                    onClick={handleApplePaySubscribe}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "56px",
                      borderRadius: "16px",
                      cursor: canPay ? "pointer" : "not-allowed",
                      opacity: canPay ? 1 : 0.5,
                      pointerEvents: canPay ? "auto" : "none",
                    }}
                  />
                )}
              </div>
            ) : (
              <button
                type="submit"
                disabled={!canPay}
                className={`w-full py-4 px-6 font-black text-base rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  canPay
                    ? "bg-[#c91e2f] hover:bg-[#b01725] active:bg-[#960a1c] text-white shadow-xl shadow-red-500/30 cursor-pointer transform active:scale-[0.99]"
                    : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none opacity-60"
                }`}
              >
                {isProcessingMoyasar ? (
                  <span className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5 animate-spin text-amber-400" /> Processing Payment...
                  </span>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-white/90" />
                    {paymentChoice === "saved"
                      ? `Pay ${totalDueToday} ${currency} with Saved Card`
                      : `Subscribe & Pay ${totalDueToday} ${currency}`}
                  </>
                )}
              </button>
            )}

            {!canPay && (
              <p className="text-xs text-amber-400 text-center font-bold flex items-center justify-center gap-1.5 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                Please check both mandatory agreement boxes in Step 4 to enable the Pay button.
              </p>
            )}
          </div>

          {/* MOBILE STICKY FIXED BOTTOM PAY BAR (Thumb Zone Optimized) */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 z-50 shadow-2xl space-y-1.5">
            {paymentChoice === "applepay" ? (
              <button
                type="button"
                disabled={!canPay}
                onClick={handleApplePaySubscribe}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-xl border ${
                  canPay
                    ? "bg-black text-white border-slate-700 active:scale-[0.98]"
                    : "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-50 shadow-none"
                }`}
              >
                {isProcessingMoyasar ? (
                  <span className="flex items-center gap-2 text-white text-xs">
                    <Shield className="w-4 h-4 animate-spin text-amber-400" /> Processing Apple Pay...
                  </span>
                ) : isAppleDevice ? (
                  <>
                    <span className="text-xl leading-none font-serif"></span>
                    <span>Subscribe with Apple Pay ({totalDueToday} {currency})</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Apple Pay QR ({totalDueToday} {currency})</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canPay}
                className={`w-full py-3.5 px-4 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                  canPay
                    ? "bg-[#c91e2f] active:bg-[#b01725] text-white shadow-xl shadow-red-500/30 active:scale-[0.98]"
                    : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none opacity-60"
                }`}
              >
                {isProcessingMoyasar ? (
                  <span className="flex items-center gap-2 text-white text-xs">
                    <Shield className="w-4 h-4 animate-spin text-amber-400" /> Processing Payment...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white/90" />
                    {paymentChoice === "saved"
                      ? `Pay ${totalDueToday} ${currency}`
                      : `Subscribe & Pay ${totalDueToday} ${currency}`}
                  </>
                )}
              </button>
            )}

            {!canPay && (
              <p className="text-[10px] text-amber-400 text-center font-bold">
                Check mandatory agreement boxes in Step 4 to enable Pay button
              </p>
            )}
          </div>

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
            className="w-full py-3.5 bg-[#c91e2f] hover:bg-[#b01725] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/25 cursor-pointer"
          >
            Return to Dashboard
          </button>
        </motion.div>
      )}

      {/* Persistent Floating Apple Pay Debug Console Trigger */}
      <button
        type="button"
        onClick={() => setIsApplePayDebugOpen(true)}
        className="fixed bottom-20 left-4 z-[90] px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-amber-300 transform active:scale-95 transition-all cursor-pointer"
      >
        <Bug className="w-4 h-4 text-slate-950" />
        <span>Apple Pay Debug</span>
        {applePayLogs.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-300 text-[10px] flex items-center justify-center font-extrabold">
            {applePayLogs.length}
          </span>
        )}
      </button>

      {/* On-Page Apple Pay Debug Console Modal */}
      <ApplePayDebugWindow
        isOpen={isApplePayDebugOpen}
        onClose={() => setIsApplePayDebugOpen(false)}
        logs={applePayLogs}
        onClearLogs={() => setApplePayLogs([])}
        onAddLog={addApplePayLog}
        selectedPlan={selectedPlan}
        totalDueToday={totalDueToday}
        currency={currency}
        paymentRequestData={{
          countryCode: "SA",
          currencyCode: currency,
          supportedNetworks: ["mada", "visa", "mastercard"],
          merchantCapabilities: ["supports3DS"],
          lineItems: buildApplePayLineItems(),
          total: {
            label: `Rush Wash - ${selectedPlan.name}`,
            amount: totalDueToday.toFixed(2),
            type: "final",
          },
          recurringPaymentRequest: buildRecurringPaymentRequest(),
        }}
      />
    </div>
  );
}
