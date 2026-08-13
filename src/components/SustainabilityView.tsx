"use client";

import React from "react";
import { Leaf, RefreshCw, Sun, ShieldCheck, Droplets } from "lucide-react";
import { Language, translations } from "@/lib/i18n";

interface SustainabilityViewProps {
  lang: Language;
}

export default function SustainabilityView({ lang }: SustainabilityViewProps) {
  const t = translations[lang].sustainability;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{t.title}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full self-start sm:self-auto flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-emerald-600" /> 95% Water Recycled
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-base">{t.stat1Title}</h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{t.stat1Desc}</p>
        </div>

        <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-200/80 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-base">{t.stat2Title}</h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{t.stat2Desc}</p>
        </div>

        <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Sun className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-base">{t.stat3Title}</h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{t.stat3Desc}</p>
        </div>
      </div>
    </div>
  );
}
