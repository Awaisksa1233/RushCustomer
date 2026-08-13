"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, ShieldCheck, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { PaymentMethod, CardFormData, CardBrand } from "@/types/payment";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCard?: PaymentMethod | null;
  onSaveCard: (cardData: CardFormData, cardId?: string) => void;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  initialCard,
  onSaveCard,
}: PaymentMethodModalProps) {
  const isEditing = !!initialCard;

  const [holderName, setHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("08");
  const [expYear, setExpYear] = useState("28");
  const [cvc, setCvc] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialCard) {
      setHolderName(initialCard.holderName);
      setCardNumber(`•••• •••• •••• ${initialCard.last4}`);
      setExpMonth(initialCard.expMonth);
      setExpYear(initialCard.expYear);
      setCvc("•••");
      setIsDefault(initialCard.isDefault);
    } else {
      setHolderName("");
      setCardNumber("");
      setExpMonth("08");
      setExpYear("28");
      setCvc("");
      setIsDefault(false);
    }
    setErrors({});
  }, [initialCard, isOpen]);

  if (!isOpen) return null;

  // Detect Brand from first digit
  const detectBrand = (num: string): CardBrand => {
    const cleanNum = num.replace(/\D/g, "");
    if (cleanNum.startsWith("4")) return "visa";
    if (cleanNum.startsWith("5")) return "mastercard";
    if (cleanNum.startsWith("3")) return "amex";
    if (cleanNum.startsWith("6") || cleanNum.startsWith("588845")) return "mada";
    return initialCard?.brand || "visa";
  };

  const brand = detectBrand(cardNumber);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { [key: string]: string } = {};

    if (!holderName.trim()) errs.holderName = "Cardholder name is required";
    if (!isEditing && cardNumber.replace(/\D/g, "").length < 13) {
      errs.cardNumber = "Valid 13-16 digit card number required";
    }
    if (!cvc.trim() || cvc.length < 3) errs.cvc = "Valid CVC required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSaveCard(
      {
        holderName,
        cardNumber,
        expMonth,
        expYear,
        cvc,
        isDefault,
      },
      initialCard?.id
    );

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {isEditing ? "Update Payment Card" : "Add New Payment Card"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isEditing ? "Modify your billing card details" : "Add a new card to your account"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Live Interactive Card Preview */}
            <div className="relative h-44 w-full rounded-2xl p-5 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl flex flex-col justify-between overflow-hidden border border-slate-700">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-red-500/10 blur-xl pointer-events-none" />

              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                  CleanRide Payment Card
                </span>
                <span className="text-sm font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/10 border border-white/20">
                  {brand}
                </span>
              </div>

              <div className="z-10 space-y-1">
                <div className="text-lg sm:text-xl font-mono font-extrabold tracking-wider text-slate-100">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
              </div>

              <div className="flex items-center justify-between z-10 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Cardholder
                  </span>
                  <span className="font-bold text-slate-200 uppercase tracking-wide">
                    {holderName || "YOUR NAME"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Expires
                  </span>
                  <span className="font-bold text-slate-200">
                    {expMonth}/{expYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    errors.holderName
                      ? "border-red-500 bg-red-50/50"
                      : "border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  }`}
                />
                {errors.holderName && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.holderName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4532 0000 0000 0000"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                      errors.cardNumber
                        ? "border-red-500 bg-red-50/50"
                        : "border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    }`}
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Month
                  </label>
                  <select
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  >
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Year
                  </label>
                  <select
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  >
                    {["25","26","27","28","29","30","31","32"].map((y) => (
                      <option key={y} value={y}>20{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                    placeholder="123"
                    className={`w-full px-3 py-3 rounded-xl border text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                      errors.cvc
                        ? "border-red-500 bg-red-50/50"
                        : "border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    }`}
                  />
                  {errors.cvc && (
                    <p className="text-[10px] text-red-600 mt-1 font-medium">{errors.cvc}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="set-default-card"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="set-default-card" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as default payment method for subscription
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#cc142d] hover:bg-[#b00f24] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4" /> {isEditing ? "Update Card" : "Save & Add Card"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
