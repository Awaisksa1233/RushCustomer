"use client";

import React, { useState } from "react";
import { Gift, Sparkles, CheckCircle2, Heart, CreditCard, Send } from "lucide-react";
import confetti from "canvas-confetti";
import { Language, translations } from "@/lib/i18n";

interface GiftCardsManagerProps {
  lang: Language;
}

export default function GiftCardsManager({ lang }: GiftCardsManagerProps) {
  const t = translations[lang].giftCards;
  const [selectedAmount, setSelectedAmount] = useState(200);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPurchased, setIsPurchased] = useState(false);

  const amounts = [100, 200, 300, 500];

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPurchased(true);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white flex items-center justify-center font-bold shadow-md">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{t.title}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {!isPurchased ? (
        <form onSubmit={handlePurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* Amount Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-slate-500">{t.selectAmount}</label>
              <div className="grid grid-cols-4 gap-3">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-3.5 rounded-2xl font-extrabold text-sm border transition-all cursor-pointer ${
                      selectedAmount === amt
                        ? "bg-[#cc142d] text-white border-red-500 shadow-md shadow-red-500/20"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {amt} SAR
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.recipientName}</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Faisal Al-Saud"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.recipientEmail}</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. faisal@example.sa"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.message}</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enjoy unlimited car wash shine from Rush Wash!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Card Preview & Action */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white space-y-6 shadow-2xl border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-red-400">Rush Gift Card</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>

              <div className="text-center py-4 space-y-1">
                <span className="text-4xl font-black text-white">{selectedAmount} SAR</span>
                <span className="text-xs text-slate-300 block font-medium">Valid at all Rush stations in KSA</span>
              </div>

              {recipientName && (
                <div className="p-3 rounded-xl bg-white/10 text-xs text-slate-200">
                  <span className="block font-bold text-white">For: {recipientName}</span>
                  {message && <p className="text-[11px] italic text-slate-300 mt-0.5">"{message}"</p>}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-[#cc142d] hover:bg-[#b00f24] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> {t.buyGiftCard} ({selectedAmount} SAR)
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-8 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="text-xl font-black text-slate-900">Gift Card Issued!</h4>
          <p className="text-xs text-slate-500">
            A digital Rush Gift Voucher for <strong>{selectedAmount} SAR</strong> has been sent to <strong>{recipientEmail}</strong> for {recipientName}.
          </p>
          <button
            onClick={() => setIsPurchased(false)}
            className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            Send Another Gift Card
          </button>
        </div>
      )}
    </div>
  );
}
