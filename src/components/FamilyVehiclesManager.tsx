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
  ArrowUpRight,
  ArrowDownRight,
  PauseCircle,
  PlayCircle,
  QrCode,
  ShieldAlert,
  Sliders,
  Check,
  History,
  Gift,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import { FamilyVehicle, FamilyVehicleAddon, SubscriptionPlan } from "@/types/plan";

interface FamilyVehiclesManagerProps {
  vehicles: FamilyVehicle[];
  currentPlan: SubscriptionPlan;
  maxSlots?: number;
  onAddVehicle: (vehicle: Omit<FamilyVehicle, "id">) => void;
  onRemoveVehicle: (id: string) => void;
  onUpdateVehicle?: (id: string, updates: Partial<FamilyVehicle>) => void;
}

export const getDiscountPercentage = (index: number): number => {
  if (index === 0) return 0;  // 1st car: 0%
  if (index === 1) return 10; // 2nd car: 10%
  if (index === 2) return 15; // 3rd car: 15%
  if (index === 3) return 20; // 4th car: 20%
  return 25;                  // 5th car+: 25%
};

const AVAILABLE_PLANS = [
  {
    id: "rush-express-149",
    name: "Rush Express",
    price: 149,
    desc: "Unlimited exterior washes & active foam",
  },
  {
    id: "rush-lava-199",
    name: "Rush Lava",
    price: 199,
    desc: "Underbody chassis wash + Lava wax protectant",
  },
  {
    id: "rush-nano-ceramic-299",
    name: "Rush Nano Ceramic",
    price: 299,
    desc: "Nano Ceramic paint shield + hydrophobic barrier + VIP express line",
  },
];

const AVAILABLE_ADDONS: FamilyVehicleAddon[] = [
  {
    id: "add_ceramic",
    name: "Ceramic Coating Refresh",
    price: 49,
    description: "Monthly hydrophobic spray boost & high-gloss paint defense",
  },
  {
    id: "add_interior",
    name: "Interior Steam Sanitization",
    price: 39,
    description: "AC vent purification & antibacterial dashboard treatment",
  },
  {
    id: "add_engine",
    name: "Engine Bay Wash & Dressing",
    price: 29,
    description: "Degreasing spray & protective rubber hose gloss",
  },
];

const MOCK_WASH_LOGS = [
  { id: "log_1", date: "Aug 12, 2026 - 14:30", location: "Riyadh Tunnel #1 (Olaya)", washType: "Rush Nano Ceramic + Spray Wax" },
  { id: "log_2", date: "Aug 07, 2026 - 11:15", location: "Riyadh Tunnel #3 (King Fahd Rd)", washType: "Rush Lava Wash" },
  { id: "log_3", date: "Jul 29, 2026 - 18:40", location: "Jeddah Corniche Express", washType: "Rush Nano Ceramic Shield" },
  { id: "log_4", date: "Jul 22, 2026 - 09:10", location: "Dammam Highway Tunnel", washType: "Underbody + Lava Foam" },
];

export default function FamilyVehiclesManager({
  vehicles,
  currentPlan,
  maxSlots = 5,
  onAddVehicle,
  onRemoveVehicle,
  onUpdateVehicle,
}: FamilyVehiclesManagerProps) {
  // Add Car Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("2024");
  const [color, setColor] = useState("Black");
  const [ownerName, setOwnerName] = useState("");
  const [relationship, setRelationship] = useState<FamilyVehicle["relationship"]>("Spouse");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Per-Car Modals State
  const [upgradingVehicle, setUpgradingVehicle] = useState<FamilyVehicle | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Cancellation Modal State
  const [cancellingVehicle, setCancellingVehicle] = useState<FamilyVehicle | null>(null);
  const [cancelStep, setCancelStep] = useState<1 | 2 | 3 | 4>(1);
  const [cancelReason, setCancelReason] = useState<string>("Sold vehicle");
  const [cancelTiming, setCancelTiming] = useState<"END_OF_PERIOD" | "IMMEDIATE">("END_OF_PERIOD");

  // Pause Modal State
  const [pausingVehicle, setPausingVehicle] = useState<FamilyVehicle | null>(null);
  const [pauseMonths, setPauseMonths] = useState<number>(1);

  // Digital QR Pass Modal State
  const [qrPassVehicle, setQrPassVehicle] = useState<FamilyVehicle | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Cycle days for mid-term pro-rata calculation
  const daysRemaining = 18;
  const totalDays = 30;
  const currency = currentPlan.currency || "SAR";

  // Calculate overall family pricing
  let totalFamilyPrice = 0;
  let totalSavings = 0;
  let activeVehicleIndex = 0;

  const vehicleBreakdown = vehicles.map((v) => {
    let discountPct = 0;

    if (v.status === "Active") {
      discountPct = getDiscountPercentage(activeVehicleIndex);
      activeVehicleIndex++;
    }

    const vehicleBasePrice = v.tierPrice || currentPlan.monthlyAmount;
    const addonsTotalPrice = (v.addons || []).reduce((acc, a) => acc + a.price, 0);
    const rawMonthly = vehicleBasePrice + addonsTotalPrice;
    const discountAmount = v.status === "Active" ? Math.round((vehicleBasePrice * discountPct) / 100) : 0;
    const finalPrice = Math.max(0, rawMonthly - discountAmount);

    if (v.status === "Active") {
      totalFamilyPrice += finalPrice;
      totalSavings += discountAmount;
    }

    return {
      vehicle: v,
      vehicleBasePrice,
      addonsTotalPrice,
      rawMonthly,
      discountPct,
      discountAmount,
      finalPrice,
    };
  });

  // Prorated Charge for adding next car mid-cycle
  const nextCarIndex = vehicles.filter((v) => v.status === "Active").length;
  const nextCarDiscountPct = getDiscountPercentage(nextCarIndex);
  const basePrice = currentPlan.monthlyAmount;
  const nextCarFullMonthlyRate = basePrice - Math.round((basePrice * nextCarDiscountPct) / 100);
  const nextCarProratedCharge = Math.round((nextCarFullMonthlyRate / totalDays) * daysRemaining);

  // Add Vehicle Submit
  const handleAddSubmit = (e: React.FormEvent) => {
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
      tierId: currentPlan.id,
      tierName: currentPlan.name,
      tierPrice: currentPlan.monthlyAmount,
      addons: [],
      washCountThisMonth: 0,
      qrCodeData: `RUSH-PASS-${make.toUpperCase()}-${plateNumber.toUpperCase()}`,
      rfidTagId: `RF-${Math.floor(1000 + Math.random() * 9000)}-KSA`,
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
    setIsAddModalOpen(false);
    showToast(`Vehicle ${make} ${model} added to Family Pass!`);
  };

  // Open Upgrade Modal
  const openUpgradeModal = (v: FamilyVehicle) => {
    setUpgradingVehicle(v);
    setSelectedTierId(v.tierId || currentPlan.id);
    setSelectedAddonIds((v.addons || []).map((a) => a.id));
  };

  // Confirm Upgrade
  const handleConfirmUpgrade = () => {
    if (!upgradingVehicle || !onUpdateVehicle) return;

    const targetPlan = AVAILABLE_PLANS.find((p) => p.id === selectedTierId) || {
      id: currentPlan.id,
      name: currentPlan.name,
      price: currentPlan.monthlyAmount,
    };

    const newAddons = AVAILABLE_ADDONS.filter((a) => selectedAddonIds.includes(a.id));

    onUpdateVehicle(upgradingVehicle.id, {
      tierId: targetPlan.id,
      tierName: targetPlan.name,
      tierPrice: targetPlan.price,
      addons: newAddons,
    });

    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.5 }
    });

    showToast(`${upgradingVehicle.make} ${upgradingVehicle.model} upgraded to ${targetPlan.name}!`);
    setUpgradingVehicle(null);
  };

  // Open Cancellation Modal
  const openCancelModal = (v: FamilyVehicle) => {
    setCancellingVehicle(v);
    setCancelStep(1);
    setCancelReason("Sold vehicle");
    setCancelTiming("END_OF_PERIOD");
  };

  // Confirm Cancellation
  const handleConfirmCancelCar = () => {
    if (!cancellingVehicle) return;

    if (cancelTiming === "IMMEDIATE") {
      onRemoveVehicle(cancellingVehicle.id);
      showToast(`${cancellingVehicle.make} ${cancellingVehicle.model} cancelled immediately.`);
    } else {
      if (onUpdateVehicle) {
        onUpdateVehicle(cancellingVehicle.id, {
          status: "Scheduled Cancel",
          effectiveCancelDate: "Aug 31, 2026",
          cancellationReason: cancelReason,
        });
      }
      showToast(`Cancellation scheduled for ${cancellingVehicle.make} ${cancellingVehicle.model} on Aug 31.`);
    }

    setCancellingVehicle(null);
  };

  // Confirm Pause
  const handleConfirmPause = () => {
    if (!pausingVehicle || !onUpdateVehicle) return;

    const resumeDate = new Date();
    resumeDate.setMonth(resumeDate.getMonth() + pauseMonths);
    const formattedDate = resumeDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    onUpdateVehicle(pausingVehicle.id, {
      status: "Paused",
      pauseUntilDate: formattedDate,
    });

    showToast(`Pass paused for ${pausingVehicle.make} ${pausingVehicle.model} until ${formattedDate}.`);
    setPausingVehicle(null);
  };

  // Reactivate Vehicle
  const handleReactivateCar = (v: FamilyVehicle) => {
    if (!onUpdateVehicle) return;
    onUpdateVehicle(v.id, {
      status: "Active",
      pauseUntilDate: undefined,
      effectiveCancelDate: undefined,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    showToast(`Pass reactivated for ${v.make} ${v.model}!`);
  };

  // Calculate Upgrade Prorated Fee
  const getUpgradeProratedFee = () => {
    if (!upgradingVehicle) return { proratedFee: 0, newMonthlyRate: 0, diffMonthly: 0 };
    const currentBase = upgradingVehicle.tierPrice || currentPlan.monthlyAmount;
    const currentAddonsSum = (upgradingVehicle.addons || []).reduce((acc, a) => acc + a.price, 0);

    const targetPlan = AVAILABLE_PLANS.find((p) => p.id === selectedTierId);
    const newBase = targetPlan ? targetPlan.price : currentBase;
    const newAddonsSum = AVAILABLE_ADDONS.filter((a) => selectedAddonIds.includes(a.id)).reduce((acc, a) => acc + a.price, 0);

    const oldMonthly = currentBase + currentAddonsSum;
    const newMonthly = newBase + newAddonsSum;
    const diffMonthly = newMonthly - oldMonthly;
    const proratedFee = Math.max(0, Math.round((diffMonthly / totalDays) * daysRemaining));

    return { proratedFee, newMonthlyRate: newMonthly, diffMonthly };
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#cc142d]" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Multi-Car Family Pass Management
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Upgrade individual car packages, schedule cancellations with retention offers, freeze passes, or view digital RFID QR codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {vehicles.filter(v => v.status === "Active").length} Active / {vehicles.length} Total ({maxSlots} Max)
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
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
            <Sparkles className="w-4 h-4" /> Multi-Car Tiered Discount Ladder & Prorata Rules
          </div>
          <span className="text-[10px] font-extrabold bg-red-600 text-white px-2.5 py-0.5 rounded-full uppercase">
            Auto-Calculated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">1st Active Car</span>
            <span className="font-extrabold text-slate-900">Base Plan</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">2nd Active Car</span>
            <span className="font-extrabold text-emerald-600">10% OFF</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">3rd Active Car</span>
            <span className="font-extrabold text-emerald-600">15% OFF</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">4th Active Car</span>
            <span className="font-extrabold text-emerald-600">20% OFF</span>
          </div>

          <div className="p-2 rounded-xl bg-white/80 border border-red-100 font-semibold">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">5th Active Car</span>
            <span className="font-extrabold text-emerald-600">25% OFF</span>
          </div>
        </div>
      </div>

      {/* Unified Subscription Rules Info Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <Tag className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Default Family Base</span>
            <span className="font-bold text-slate-800 text-xs">{currentPlan.name} ({currentPlan.priceDisplay}/mo)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Consolidated Renewal</span>
            <span className="font-bold text-slate-800 text-xs">Aug 31, 2026 ({daysRemaining} Days Left)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">Master Payment Method</span>
            <span className="font-bold text-slate-800 text-xs">Visa ending in 8829</span>
          </div>
        </div>
      </div>

      {/* Vehicles Cards List with Interactive Per-Car Management */}
      <div className="space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Car className="w-4 h-4 text-red-600" /> Linked Family Vehicles ({vehicles.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleBreakdown.map(({ vehicle: v, vehicleBasePrice, rawMonthly, discountPct, finalPrice }, index) => {
            const planName = v.tierName || currentPlan.name;
            const washCount = v.washCountThisMonth || 0;

            return (
              <div
                key={v.id}
                className={`relative p-5 rounded-2xl border transition-all duration-200 space-y-4 flex flex-col justify-between ${
                  v.status === "Paused"
                    ? "border-amber-200 bg-amber-50/20 ring-1 ring-amber-100"
                    : v.status === "Scheduled Cancel"
                    ? "border-rose-200 bg-rose-50/20 ring-1 ring-rose-100 opacity-90"
                    : index === 0
                    ? "border-slate-300 bg-white shadow-sm"
                    : "border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white ring-1 ring-emerald-100 shadow-sm"
                }`}
              >
                {/* Header Row */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md font-bold text-white ${
                        v.status === "Paused"
                          ? "bg-amber-600"
                          : v.status === "Scheduled Cancel"
                          ? "bg-rose-600"
                          : "bg-slate-900"
                      }`}>
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {v.year} {v.make} {v.model}
                          </h4>

                          {/* Status Pill */}
                          {v.status === "Active" ? (
                            discountPct > 0 ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                                {discountPct}% OFF
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-full">
                                Primary Car
                              </span>
                            )
                          ) : v.status === "Paused" ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                              <PauseCircle className="w-3 h-3 text-amber-700" /> Paused
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-full">
                              Scheduled Cancel
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-medium">
                          Car #{index + 1} • {v.ownerName} ({v.relationship})
                        </p>
                      </div>
                    </div>

                    {/* Quick Delete / QR trigger */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQrPassVehicle(v)}
                        className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Digital Pass & QR"
                      >
                        <QrCode className="w-4.5 h-4.5" />
                      </button>

                      {index > 0 && v.status === "Active" && (
                        <button
                          onClick={() => setDeletingId(v.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Instant Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tier & Add-ons Badges */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                      Package: {planName} ({vehicleBasePrice} {currency})
                    </span>

                    {(v.addons || []).map((addon) => (
                      <span
                        key={addon.id}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200 flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-purple-600" /> {addon.name} (+{addon.price} SAR)
                      </span>
                    ))}
                  </div>

                  {/* Monthly Wash Usage & Info Status */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600 font-semibold">
                      <History className="w-4 h-4 text-slate-400" />
                      <span>Monthly Usage: <strong className="text-slate-900">{washCount} washes</strong> completed</span>
                    </div>

                    {v.status === "Paused" && v.pauseUntilDate && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg">
                        Resumes: {v.pauseUntilDate}
                      </span>
                    )}

                    {v.status === "Scheduled Cancel" && (
                      <span className="text-[11px] font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-lg">
                        Ends: Aug 31, 2026
                      </span>
                    )}
                  </div>
                </div>

                {/* Per-Car Management Action Bar */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Action 1: Upgrade / Custom Tier */}
                    <button
                      onClick={() => openUpgradeModal(v)}
                      className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Upgrade
                    </button>

                    {/* Action 2: Pause Pass */}
                    {v.status === "Paused" ? (
                      <button
                        onClick={() => handleReactivateCar(v)}
                        className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => setPausingVehicle(v)}
                        disabled={v.status === "Scheduled Cancel"}
                        className={`px-2.5 py-2 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          v.status === "Scheduled Cancel"
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                        }`}
                      >
                        <PauseCircle className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}

                    {/* Action 3: Cancel Pass */}
                    {v.status === "Scheduled Cancel" ? (
                      <button
                        onClick={() => handleReactivateCar(v)}
                        className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Keep Car
                      </button>
                    ) : (
                      <button
                        onClick={() => openCancelModal(v)}
                        className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer border border-rose-200"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel Pass
                      </button>
                    )}
                  </div>

                  {/* Pricing Breakdown Footer */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Plate:</span>
                      <span className="px-2.5 py-0.5 bg-slate-900 text-amber-400 font-mono font-black rounded-lg text-xs tracking-widest">
                        {v.plateNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      {v.status === "Paused" ? (
                        <span className="font-black text-amber-800 text-xs">0 SAR (Paused)</span>
                      ) : discountPct > 0 ? (
                        <div>
                          <span className="line-through text-slate-400 text-[11px] mr-1.5">{rawMonthly} {currency}</span>
                          <span className="font-black text-emerald-700 text-sm">{finalPrice} {currency}/mo</span>
                        </div>
                      ) : (
                        <span className="font-black text-slate-900 text-sm">{finalPrice} {currency}/mo</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confirm Delete Prompt Overlay */}
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
            );
          })}
        </div>
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

        <div className="space-y-2.5 text-xs">
          {vehicleBreakdown.map(({ vehicle: v, discountPct, finalPrice }) => (
            <div key={v.id} className="flex justify-between items-center text-slate-300">
              <div className="flex items-center gap-2">
                <span>
                  {v.make} {v.model} ({v.plateNumber})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">[{v.tierName || currentPlan.name}]</span>
                {v.status === "Paused" && (
                  <span className="text-amber-400 font-bold text-[10px] uppercase">(Paused - No Charge)</span>
                )}
                {v.status === "Scheduled Cancel" && (
                  <span className="text-rose-400 font-bold text-[10px] uppercase">(Scheduled End Aug 31)</span>
                )}
                {v.status === "Active" && discountPct > 0 && (
                  <span className="text-emerald-400 font-bold">({discountPct}% Multi-Car Discount)</span>
                )}
              </div>
              <span className="font-mono font-bold text-white">
                {v.status === "Paused" ? "0 SAR" : `${finalPrice} ${currency}`}
              </span>
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
            <span className="block text-[10px] uppercase font-bold text-slate-400">Consolidated Master Charge:</span>
            <span className="text-2xl font-black text-white">
              {totalFamilyPrice} {currency} <span className="text-xs text-slate-400 font-normal">/ mo</span>
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: PER-CAR PACKAGE UPGRADE & ADD-ONS */}
      <AnimatePresence>
        {upgradingVehicle && (() => {
          const { proratedFee, newMonthlyRate } = getUpgradeProratedFee();
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setUpgradingVehicle(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-7 z-10 border border-slate-100 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        Upgrade Package: {upgradingVehicle.make} {upgradingVehicle.model}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        License Plate: <strong className="text-slate-800">{upgradingVehicle.plateNumber}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setUpgradingVehicle(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Select Plan Tier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Choose Wash Package Tier:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {AVAILABLE_PLANS.map((plan) => {
                        const isSelected = selectedTierId === plan.id;
                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedTierId(plan.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-100 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900">{plan.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                            </div>
                            <p className="text-[11px] font-black text-slate-900 mt-1">{plan.price} SAR/mo</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-snug">{plan.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggle Add-ons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Optional Per-Vehicle Add-ons:
                    </label>

                    <div className="space-y-2">
                      {AVAILABLE_ADDONS.map((addon) => {
                        const isChecked = selectedAddonIds.includes(addon.id);
                        return (
                          <div
                            key={addon.id}
                            onClick={() => {
                              setSelectedAddonIds((prev) =>
                                isChecked ? prev.filter((id) => id !== addon.id) : [...prev, addon.id]
                              );
                            }}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                              isChecked
                                ? "border-purple-500 bg-purple-50/40"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                              />
                              <div>
                                <span className="font-bold text-xs text-slate-900">{addon.name}</span>
                                <p className="text-[10px] text-slate-500">{addon.description}</p>
                              </div>
                            </div>
                            <span className="font-extrabold text-xs text-purple-700">+{addon.price} SAR/mo</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prorated Fee Summary Box */}
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-2 text-purple-950">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1 text-purple-900">
                        <Zap className="w-4 h-4 text-purple-600" /> New Vehicle Rate:
                      </span>
                      <span className="font-extrabold text-sm">{newMonthlyRate} SAR / mo</span>
                    </div>

                    <div className="flex items-center justify-between text-purple-800">
                      <span>Prorated Ratio ({daysRemaining} of 30 days remaining):</span>
                      <span>Mid-Cycle Upgrade</span>
                    </div>

                    <div className="pt-2 border-t border-purple-200 flex items-center justify-between font-black text-sm text-purple-900">
                      <span>Prorated Fee Due Today:</span>
                      <span className="text-base text-purple-700">{proratedFee} SAR</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setUpgradingVehicle(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpgrade}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    Pay {proratedFee} SAR & Upgrade
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL 2: 4-STEP STEP-BY-STEP CAR CANCELLATION & RETENTION */}
      <AnimatePresence>
        {cancellingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancellingVehicle(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-7 z-10 border border-slate-100 space-y-5"
            >
              {/* Modal Top Indicator */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-rose-600">
                  <ShieldAlert className="w-4 h-4" /> Cancel Car Pass (Step {cancelStep} of 3)
                </div>

                <button
                  onClick={() => setCancellingVehicle(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEP 1: SELECT REASON */}
              {cancelStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Why are you cancelling pass for {cancellingVehicle.make} {cancellingVehicle.model}?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      License Plate: <strong className="text-slate-800">{cancellingVehicle.plateNumber}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      "Sold or transferred vehicle",
                      "Moved or changed daily route",
                      "Too expensive for multi-car budget",
                      "Not washing this car enough",
                      "Other reason",
                    ].map((reason) => (
                      <div
                        key={reason}
                        onClick={() => setCancelReason(reason)}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          cancelReason === reason
                            ? "border-rose-500 bg-rose-50/50 font-bold text-slate-900"
                            : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                        }`}
                      >
                        <span className="text-xs">{reason}</span>
                        <input
                          type="radio"
                          name="cancel-reason-opt"
                          checked={cancelReason === reason}
                          onChange={() => setCancelReason(reason)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setCancellingVehicle(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Keep Car Pass
                    </button>
                    <button
                      onClick={() => setCancelStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: RETENTION OFFER */}
              {cancelStep === 2 && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 text-slate-900 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wider">
                      <Gift className="w-5 h-5 text-emerald-600" /> Exclusive Family Member Offer!
                    </div>

                    <h4 className="text-lg font-black text-slate-900">
                      Keep {cancellingVehicle.make} for 50% OFF Next Month
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We hate to see your {cancellingVehicle.model} go! Stay with us for another month and pay only <strong className="text-emerald-700">half price</strong> on your next renewal.
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span>Regular: {cancellingVehicle.tierPrice || currentPlan.monthlyAmount} SAR</span>
                      <span className="text-sm font-black text-emerald-700">Special: {Math.round((cancellingVehicle.tierPrice || currentPlan.monthlyAmount) / 2)} SAR</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                    <span className="font-semibold">Or pause pass for 1–3 months instead of cancelling?</span>
                    <button
                      onClick={() => {
                        setCancellingVehicle(null);
                        setPausingVehicle(cancellingVehicle);
                      }}
                      className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg cursor-pointer text-[11px]"
                    >
                      Pause Pass
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => {
                        showToast(`Retention offer accepted! 50% discount applied to ${cancellingVehicle.make}.`);
                        setCancellingVehicle(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      Claim 50% OFF Offer
                    </button>
                    <button
                      onClick={() => setCancelStep(3)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Decline & Continue Cancellation
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: EFFECTIVE DATE & CONFIRMATION */}
              {cancelStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Choose Cancellation Timing
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {cancellingVehicle.make} {cancellingVehicle.model} ({cancellingVehicle.plateNumber})
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div
                      onClick={() => setCancelTiming("END_OF_PERIOD")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        cancelTiming === "END_OF_PERIOD"
                          ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-100"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="timing-opt"
                          checked={cancelTiming === "END_OF_PERIOD"}
                          onChange={() => setCancelTiming("END_OF_PERIOD")}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <span className="font-bold text-xs text-slate-900">
                            End of Billing Cycle (Aug 31, 2026) - Recommended
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Keep unlimited car washes for this vehicle until Aug 31. It will not renew next month.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setCancelTiming("IMMEDIATE")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        cancelTiming === "IMMEDIATE"
                          ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-100"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="timing-opt"
                          checked={cancelTiming === "IMMEDIATE"}
                          onChange={() => setCancelTiming("IMMEDIATE")}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <span className="font-bold text-xs text-slate-900">
                            Cancel Immediately Today
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Remove car from family pass immediately. (No prorated refund per standard subscription terms).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setCancelStep(2)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmCancelCar}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-rose-500/20"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: PAUSE / FREEZE PASS */}
      <AnimatePresence>
        {pausingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPausingVehicle(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-7 z-10 border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-6 h-6 text-amber-600" />
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Pause Subscription Pass
                  </h3>
                </div>
                <button
                  onClick={() => setPausingVehicle(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Select how long you want to freeze washes for <strong className="text-slate-900">{pausingVehicle.make} {pausingVehicle.model} ({pausingVehicle.plateNumber})</strong>. You will not be charged for this car while paused.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((m) => (
                    <div
                      key={m}
                      onClick={() => setPauseMonths(m)}
                      className={`p-4 rounded-2xl border text-center cursor-pointer transition-all ${
                        pauseMonths === m
                          ? "border-amber-500 bg-amber-50 font-black text-amber-900 ring-2 ring-amber-100"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white font-bold"
                      }`}
                    >
                      <span className="text-lg block">{m}</span>
                      <span className="text-[10px] uppercase tracking-wider">{m === 1 ? "Month" : "Months"}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-extrabold">Pause Details:</span>
                  <p>• Billing for this car will be frozen starting today.</p>
                  <p>• Car slot remains reserved in your multi-car family pass ladder.</p>
                  <p>• Auto-resumes after {pauseMonths} month{pauseMonths > 1 ? "s" : ""}.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setPausingVehicle(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPause}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Freeze Pass for {pauseMonths} Month{pauseMonths > 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: DIGITAL PASS & QR CODE */}
      <AnimatePresence>
        {qrPassVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrPassVehicle(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 z-10 border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-black text-slate-900">
                    Digital RFID Wash Pass
                  </h3>
                </div>
                <button
                  onClick={() => setQrPassVehicle(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Digital Pass Card UI */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-2xl" />

                <div className="flex justify-between items-start text-left">
                  <div>
                    <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Rush Wash VIP Pass</span>
                    <h4 className="text-lg font-black text-white">{qrPassVehicle.year} {qrPassVehicle.make} {qrPassVehicle.model}</h4>
                    <p className="text-xs text-slate-400">{qrPassVehicle.ownerName} ({qrPassVehicle.relationship})</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-400 text-slate-950 font-mono font-black rounded-xl text-xs">
                    {qrPassVehicle.plateNumber}
                  </span>
                </div>

                {/* QR Visual Barcode Simulation */}
                <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 flex flex-col items-center justify-center space-y-2 shadow-inner border border-slate-200">
                  <QrCode className="w-36 h-36 text-slate-900" />
                  <span className="font-mono text-[9px] text-slate-600 font-bold tracking-widest">{qrPassVehicle.qrCodeData || "RUSH-VIP-PASS-8849"}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>RFID Tag: {qrPassVehicle.rfidTagId || "RF-8849-KSA"}</span>
                  <span className="text-emerald-400 font-bold">Auto-Scan Gate Ready</span>
                </div>
              </div>

              {/* Wash History for this car */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider">Recent Wash History:</h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {MOCK_WASH_LOGS.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800 block">{log.location}</span>
                        <span className="text-slate-400 text-[10px]">{log.washType}</span>
                      </div>
                      <span className="text-slate-500 font-medium text-[10px]">{log.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setQrPassVehicle(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  Close Pass Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD VEHICLE MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
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
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#cc142d] hover:bg-[#b00f24] text-[#ffffff] font-bold text-xs shadow-md shadow-red-500/20 cursor-pointer flex items-center gap-1.5"
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
