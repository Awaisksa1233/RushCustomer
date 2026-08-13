"use client";

import React from "react";
import { Info, MapPin, Mail, Phone, Briefcase, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { Language, translations } from "@/lib/i18n";

interface AboutContactViewProps {
  lang: Language;
}

export default function AboutContactView({ lang }: AboutContactViewProps) {
  const tAbout = translations[lang].about;
  const tContact = translations[lang].contact;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* About Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#cc142d] flex items-center justify-center font-bold">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{tAbout.title}</h3>
            <p className="text-xs text-slate-500 font-semibold">{tAbout.subtitle}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
          {tAbout.mission}
        </p>
      </div>

      {/* Locations & Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Frequencies & Hubs</h4>
          </div>

          <div className="space-y-2 text-xs text-slate-700 font-medium">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Riyadh (King Fahd, Olaya, Northern Ring)
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Jeddah (Corniche, Al-Zahra, Sari Street)
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Dammam & Khobar (Dhahran Highway)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">{tContact.title}</h4>
          </div>

          <div className="space-y-2 text-xs text-slate-700 font-medium">
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {tContact.supportEmail}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {tContact.tollFree}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {tContact.headquarters}
            </p>
          </div>
        </div>
      </div>

      {/* External Links: Customer Portal, Terms & Privacy */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-black text-sm text-white">External Customer Portal & Legal</h4>
          <p className="text-xs text-slate-400">Official Rush Wash Saudi Arabia platform links.</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://rush.com.sa/en/login"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            Portal Login <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://rush.com.sa/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            Terms <FileText className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://rush.com.sa/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            Privacy <ShieldCheck className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
