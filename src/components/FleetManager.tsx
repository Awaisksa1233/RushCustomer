"use client";

import React, { useState } from "react";
import { Building2, ShieldCheck, ArrowRight, Zap, CheckCircle2, Car, PhoneCall } from "lucide-react";
import confetti from "canvas-confetti";
import { Language, translations } from "@/lib/i18n";

interface FleetManagerProps {
  lang: Language;
}

export default function FleetManager({ lang }: FleetManagerProps) {
  const t = translations[lang].fleet;
  const isRtl = lang === "ar";

  const [vehicleCount, setVehicleCount] = useState(10);
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Corporate Fleet Discount Formula (20% off for 10-25 vehicles, 30% off for 25+)
  const perVehicleRate = vehicleCount >= 25 ? 139 : 159;
  const totalMonthlyRate = vehicleCount * perVehicleRate;
  const totalSavings = vehicleCount * (199 - perVehicleRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md">
            <Building2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{t.title}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full self-start sm:self-auto">
          🇸🇦 Serving Saudi Corporate Fleets
        </div>
      </div>

      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Fleet Interactive Savings Calculator */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-6">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> {t.estimateSavings}
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>{t.numVehicles}</span>
                  <span className="text-base font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-200">
                    {vehicleCount} Vehicles
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={vehicleCount}
                  onChange={(e) => setVehicleCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#cc142d]"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>5 Vehicles</span>
                  <span>50 Vehicles</span>
                  <span>100+ Vehicles</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Discount Rate:</span>
                  <span className="font-bold text-amber-400">{perVehicleRate} SAR / vehicle / mo</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Estimated Monthly Savings:</span>
                  <span className="font-extrabold text-emerald-400">Save {totalSavings} SAR / mo</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">{t.monthlyBill}</span>
                  <span className="text-2xl font-black text-white">{totalMonthlyRate} SAR <span className="text-xs font-normal text-slate-400">/ mo</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Proposal Request Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
              <h4 className="font-black text-sm uppercase text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-red-400" /> Request Fleet Proposal
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Aramco Logistics / Saudi Fleet Co."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +966 50 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#cc142d] hover:bg-[#b00f24] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {t.requestFleetQuote}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="text-xl font-black text-slate-900">Fleet Proposal Requested!</h4>
          <p className="text-xs text-slate-500">
            Our Saudi corporate fleet team will contact <strong>{companyName}</strong> at <strong>{contactPhone}</strong> within 2 hours with customized RFID pass pricing for {vehicleCount} vehicles.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            Calculate Another Fleet
          </button>
        </div>
      )}
    </div>
  );
}
