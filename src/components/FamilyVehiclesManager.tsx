"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Car, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Users, 
  X,
  Sparkles,
  AlertCircle,
  CreditCard,
  Calendar,
  Tag,
  Receipt,
  Zap,
  ArrowUpRight
} from "lucide-react";
import confetti from "canvas-confetti";
import { FamilyVehicle, SubscriptionPlan } from "@/types/plan";

interface FamilyVehiclesManagerProps {
  vehicles: FamilyVehicle[];
  currentPlan: SubscriptionPlan;
  maxSlots?: number;
  onAddVehicle: (vehicle: Omit<FamilyVehicle, "id">) => void;
  onRemoveVehicle: (id: string) => void;
}

export const getDiscountPercentage = (index: number): number => {
  if (index === 0) return 0;  // 1st car: 0%
  if (index === 1) return 10; // 2nd car: 10%
  if (index === 2) return 15; // 3rd car: 15%
  if (index === 3) return 20; // 4th car: 20%
  return 25;                  // 5th car+: 25%
};

export default function FamilyVehiclesManager({
  vehicles,
  currentPlan,
  maxSlots = 5,
  onAddVehicle,
  onRemoveVehicle,
}: FamilyVehiclesManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("2024");
  const [color, setColor] = useState("Black");
  const [ownerName, setOwnerName] = useState("");
  const [relationship, setRelationship] = useState<FamilyVehicle["relationship"]>("Spouse");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cycle days for mid-term pro-rata calculation
  const daysRemaining = 18;
  const totalDays = 30;

  const basePrice = currentPlan.monthlyAmount;
  const currency = currentPlan.currency || "SAR";

  // Calculate pricing & discounts
  let totalFamilyPrice = 0;
  let totalSavings = 0;

  const vehicleBreakdown = vehicles.map((v, index) => {
    const discountPct = getDiscountPercentage(index);
    const discountAmount = Math.round((basePrice * discountPct) / 100);
    const finalPrice = basePrice - discountAmount;

    totalFamilyPrice += finalPrice;
    totalSavings += discountAmount;

    return {
      vehicle: v,
      index: index + 1,
      discountPct,
      discountAmount,
      finalPrice,
    };
  });

  // Prorated Charge for adding next car mid-cycle
  const nextCarIndex = vehicles.length; // 0-indexed for discount
  const nextCarDiscountPct = getDiscountPercentage(nextCarIndex);
  const nextCarFullMonthlyRate = basePrice - Math.round((basePrice * nextCarDiscountPct) / 100);
  const nextCarProratedCharge = Math.round((nextCarFullMonthlyRate / totalDays) * daysRemaining);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !make || !model || !ownerName) return;

    onAddVehicle({
      plateNumber: plateNumber.toUpperCase(),
      make,
      model,
      year,
      color,
      ownerName,
      relationship,
      status: "Active",
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setPlateNumber("");
    setMake("");
    setModel("");
    setOwnerName("");
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#cc142d]" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Multi-Car Family Pass
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Same package ({currentPlan.name}), same renewal date, same card with prorated mid-cycle additions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {vehicles.length} of {maxSlots} Cars Linked
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={vehicles.length >= maxSlots}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
              vehicles.length >= maxSlots
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-[#cc142d] hover:bg-[#b00f24] text-white shadow-red-500/20"
            }`}
          >
            <Plus className="w-4 h-4" /> Add Car #{vehicles.length + 1} (Prorated)
          </button>
        </div>
      </div>

      {/* Tiered Discount Rule Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border border-red-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700">
            <Sparkles className="w-4 h-4" /> Tiered Multi-Car Discount & Prorata Policy
          </div>
          <span className="text-[10px] font-extrabold bg-red-600 text-white px-2.5 py-0.5 rounded-full uppercase">
            Auto-Prorated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">1st Car</span>
            <span className="font-extrabold text-slate-900">Base Price</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">2nd Car</span>
            <span className="font-extrabold text-emerald-600">10% OFF</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">3rd Car</span>
            <span className="font-extrabold text-emerald-600">15% OFF</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">4th Car</span>
            <span className="font-extrabold text-emerald-600">20% OFF</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">5th Car</span>
            <span className="font-extrabold text-emerald-600">25% OFF</span>
          </div>
        </div>
      </div>

      {/* Unified Subscription Rule Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <Tag className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Same Package</span>
            <span className="font-bold text-slate-800 text-xs">{currentPlan.name}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Same Renewal Date</span>
            <span className="font-bold text-slate-800 text-xs">Aug 31, 2026 ({daysRemaining} Days Left)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Same Payment Method</span>
            <span className="font-bold text-slate-800 text-xs">Visa ending in 8829</span>
          </div>
        </div>
      </div>

      {/* Vehicles Cards List with Itemized Discounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicleBreakdown.map(({ vehicle: v, index, discountPct, finalPrice }) => (
          <div
            key={v.id}
            className={`relative p-5 rounded-2xl border transition-all duration-200 space-y-4 ${
              index === 1
                ? "border-slate-300 bg-white shadow-sm"
                : "border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white ring-1 ring-emerald-100 shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {v.year} {v.make} {v.model}
                    </h4>
                    {discountPct > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                        {discountPct}% OFF
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-full">
                        Primary Car
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Car #{index} • {v.ownerName} ({v.relationship})
                  </p>
                </div>
              </div>

              {/* Remove Button */}
              {index > 1 && (
                <button
                  onClick={() => setDeletingId(v.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pricing Breakdown for this car */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Plate:</span>
                <span className="px-2.5 py-0.5 bg-slate-900 text-amber-400 font-mono font-black rounded-lg text-xs tracking-widest">
                  {v.plateNumber}
                </span>
              </div>

              <div className="text-right">
                {discountPct > 0 ? (
                  <div>
                    <span className="line-through text-slate-400 text-[11px] mr-1.5">{basePrice} {currency}</span>
                    <span className="font-black text-emerald-700 text-sm">{finalPrice} {currency}/mo</span>
                  </div>
                ) : (
                  <span className="font-black text-slate-900 text-sm">{finalPrice} {currency}/mo</span>
                )}
              </div>
            </div>

            {/* Confirm Delete Prompt */}
            {deletingId === v.id && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-3 z-10 border border-red-200">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <p className="text-xs font-extrabold text-slate-900">
                  Remove {v.make} {v.model} ({v.plateNumber})?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onRemoveVehicle(v.id);
                      setDeletingId(null);
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Confirm Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Itemized Consolidated Family Invoice Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Consolidated Monthly Family Invoice
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Next Renewal: Aug 31, 2026
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {vehicleBreakdown.map(({ vehicle: v, index, discountPct, finalPrice }) => (
            <div key={v.id} className="flex justify-between items-center text-slate-300">
              <span>
                Car #{index}: {v.make} {v.model} ({v.plateNumber})
                {discountPct > 0 && (
                  <span className="ml-2 text-emerald-400 font-bold">({discountPct}% Family Discount)</span>
                )}
              </span>
              <span className="font-mono font-bold text-white">{finalPrice} {currency}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Monthly Savings:</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              Save {totalSavings} {currency} / month
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Charged to Master Card:</span>
            <span className="text-2xl font-black text-white">{totalFamilyPrice} {currency} <span className="text-xs text-slate-400 font-normal">/ mo</span></span>
          </div>
        </div>
      </div>

      {/* Add Family Vehicle Modal with Pro-Rata Charge Breakdown */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 z-10 border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#cc142d] flex items-center justify-center font-bold">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Add Car #{vehicles.length + 1} to Family Pass
                    </h3>
                    <p className="text-xs text-slate-500">
                      Eligible for <strong className="text-emerald-700 font-extrabold">{nextCarDiscountPct}% Discount</strong> under {currentPlan.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      License Plate Number
                    </label>
                    <input
                      type="text"
                      required
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      placeholder="e.g. 7ABC / 4KSA"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 uppercase focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:border-red-500 outline-none"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son/Daughter">Son / Daughter</option>
                      <option value="Other">Other Family Member</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Make (Brand)
                    </label>
                    <input
                      type="text"
                      required
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g. Toyota / Lexus / GMC"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-red-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Camry / Yukon / Land Cruiser"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Car Color
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Pearl White"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-red-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Driver / Owner Name
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Sarah Morgan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                {/* PRORATED CHARGE BREAKDOWN */}
                <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-2 text-xs text-emerald-950">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-600" /> Car #{vehicles.length + 1} Rate ({nextCarDiscountPct}% Discount):
                    </span>
                    <span className="font-extrabold">{nextCarFullMonthlyRate} {currency} / mo</span>
                  </div>

                  <div className="flex items-center justify-between text-[#065f46]">
                    <span>Cycle Days Remaining ({daysRemaining} of {totalDays} days):</span>
                    <span>Prorated Ratio ({daysRemaining}/30)</span>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between font-black text-sm text-emerald-900">
                    <span>Prorated Charge Due Today:</span>
                    <span className="text-base font-black text-emerald-700 flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4" /> {nextCarProratedCharge} {currency}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium italic">
                    Charged immediately to Visa ending in 8829. Future renewal on Aug 31 at {nextCarFullMonthlyRate} {currency}/mo.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#cc142d] hover:bg-[#b00f24] text-white font-bold text-xs shadow-md shadow-red-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    Pay {nextCarProratedCharge} {currency} & Add Car #{vehicles.length + 1}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
