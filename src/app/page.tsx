"use client";

import React, { useState } from "react";
import SubscriptionCard from "@/components/SubscriptionCard";
import CancellationModal from "@/components/CancellationModal";
import RetentionAnalytics from "@/components/RetentionAnalytics";
import PaymentMethodsManager from "@/components/PaymentMethodsManager";
import PlanSelection, { PLANS } from "@/components/PlanSelection";
import FamilyVehiclesManager from "@/components/FamilyVehiclesManager";
import CheckoutScreen from "@/components/CheckoutScreen";
import CashierQRScreen from "@/components/CashierQRScreen";

import { CancellationData, AnalyticsMetric } from "@/types/cancellation";
import { PaymentMethod, CardFormData, CardBrand } from "@/types/payment";
import { SubscriptionPlan, FamilyVehicle } from "@/types/plan";
import { 
  Sparkles, 
  BarChart3, 
  Layers, 
  CreditCard, 
  Tag, 
  Users, 
  ShoppingBag,
  Droplets,
  ShieldCheck,
  ExternalLink,
  QrCode
} from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellationData, setCancellationData] = useState<CancellationData | null>(null);
  const [activeOffer, setActiveOffer] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "CASHIER_QR" | "SUBSCRIBER" | "PLANS" | "CHECKOUT" | "FAMILY" | "PAYMENTS" | "ANALYTICS"
  >("CASHIER_QR");

  // Active Plan State (Default to Rush Nano Ceramic 299 SAR)
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(() => PLANS[2] || PLANS[0]);

  // Family Vehicles State
  const [familyVehicles, setFamilyVehicles] = useState<FamilyVehicle[]>([
    {
      id: "veh_1",
      plateNumber: "3XYZ",
      make: "Tesla",
      model: "Model Y",
      year: "2024",
      color: "Solid Black",
      ownerName: "Alex Morgan",
      relationship: "Primary",
      status: "Active",
      tierId: "rush-nano-ceramic-299",
      tierName: "Rush Nano Ceramic",
      tierPrice: 299,
      addons: [
        { id: "add_1", name: "Ceramic Coating Refresh", price: 49, description: "Monthly hydro-barrier hydrophobic shield boost" }
      ],
      washCountThisMonth: 6,
      lastWashDate: "2026-08-12",
      qrCodeData: "RUSH-VIP-TESLA-3XYZ",
      rfidTagId: "RF-8849-TES",
    },
    {
      id: "veh_2",
      plateNumber: "7ABC",
      make: "Toyota",
      model: "Camry SE",
      year: "2023",
      color: "Pearl White",
      ownerName: "Sarah Morgan",
      relationship: "Spouse",
      status: "Active",
      tierId: "rush-lava-199",
      tierName: "Rush Lava",
      tierPrice: 199,
      addons: [],
      washCountThisMonth: 4,
      lastWashDate: "2026-08-10",
      qrCodeData: "RUSH-PASS-CAMRY-7ABC",
      rfidTagId: "RF-3312-TOY",
    },
    {
      id: "veh_3",
      plateNumber: "9DEF",
      make: "GMC",
      model: "Yukon Denali",
      year: "2024",
      color: "Midnight Blue",
      ownerName: "David Morgan",
      relationship: "Son/Daughter",
      status: "Active",
      tierId: "rush-express-149",
      tierName: "Rush Express",
      tierPrice: 149,
      addons: [],
      washCountThisMonth: 2,
      lastWashDate: "2026-08-04",
      qrCodeData: "RUSH-PASS-YUKON-9DEF",
      rfidTagId: "RF-9120-GMC",
    },
  ]);

  // Saved Cards State
  const [cards, setCards] = useState<PaymentMethod[]>([
    {
      id: "card_1",
      brand: "visa",
      last4: "8829",
      expMonth: "08",
      expYear: "28",
      holderName: "Alex Morgan",
      isDefault: true,
      createdAt: "2025-01-15",
    },
    {
      id: "card_2",
      brand: "mastercard",
      last4: "4102",
      expMonth: "11",
      expYear: "27",
      holderName: "Alex Morgan",
      isDefault: false,
      createdAt: "2025-04-20",
    },
  ]);

  // Telemetry metrics state
  const [analytics, setAnalytics] = useState<AnalyticsMetric[]>([
    { reason: "Too expensive", count: 42, savedCount: 26 },
    { reason: "Not washing often", count: 31, savedCount: 18 },
    { reason: "Poor service", count: 14, savedCount: 7 },
    { reason: "Other", count: 19, savedCount: 5 },
  ]);

  const [totalSavedRevenue, setTotalSavedRevenue] = useState(26840);

  // Handlers
  const handleConfirmCancellation = (data: CancellationData) => {
    setCancellationData(data);
    setActiveOffer(null);

    if (data.reason) {
      setAnalytics((prev) =>
        prev.map((item) =>
          item.reason === data.reason
            ? { ...item, count: item.count + 1 }
            : item
        )
      );
    }
  };

  const handleAcceptOffer = (offerName: string) => {
    setActiveOffer(offerName);
    setCancellationData(null);

    setAnalytics((prev) =>
      prev.map((item) =>
        item.reason === cancellationData?.reason || item.reason === "Too expensive"
          ? { ...item, count: item.count + 1, savedCount: item.savedCount + 1 }
          : item
      )
    );
    setTotalSavedRevenue((prev) => prev + 480);
  };

  const handleReactivate = () => {
    setCancellationData(null);
    setActiveOffer(null);
  };

  const handleSelectPlan = (plan: SubscriptionPlan, option?: "IMMEDIATE" | "END_OF_PERIOD") => {
    const isUpgrade = plan.monthlyAmount > currentPlan.monthlyAmount;
    setCurrentPlan(plan);
    setCancellationData(null);

    if (isUpgrade) {
      setActiveOffer(`Prorated Upgrade to ${plan.name} Applied`);
    } else if (option === "END_OF_PERIOD") {
      setActiveOffer(`Downgrade to ${plan.name} scheduled for Aug 31, 2026`);
    } else {
      setActiveOffer(`Downgraded to ${plan.name} immediately (No refund)`);
    }
    setActiveTab("CHECKOUT");
  };

  const handleCompleteCheckout = (details: {
    plan: SubscriptionPlan;
    promoOffer: string;
    totalPaid: number;
  }) => {
    setCurrentPlan(details.plan);
    setActiveOffer(`Active Promo: ${details.promoOffer} (${details.totalPaid} SAR Paid)`);
    setCancellationData(null);
  };

  const handleAddFamilyVehicle = (vehicleData: Omit<FamilyVehicle, "id">) => {
    const newVehicle: FamilyVehicle = {
      ...vehicleData,
      id: `veh_${Date.now()}`,
    };
    setFamilyVehicles((prev) => [...prev, newVehicle]);
  };

  const handleRemoveFamilyVehicle = (id: string) => {
    setFamilyVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdateFamilyVehicle = (id: string, updates: Partial<FamilyVehicle>) => {
    setFamilyVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const handleAddCard = (data: CardFormData) => {
    const cleanNum = data.cardNumber.replace(/\D/g, "");
    let brand: CardBrand = "visa";
    if (cleanNum.startsWith("5")) brand = "mastercard";
    if (cleanNum.startsWith("3")) brand = "amex";

    const last4 = cleanNum.slice(-4) || "1234";

    const newCard: PaymentMethod = {
      id: `card_${Date.now()}`,
      brand,
      last4,
      expMonth: data.expMonth,
      expYear: data.expYear,
      holderName: data.holderName,
      isDefault: data.isDefault || cards.length === 0,
      createdAt: new Date().toISOString(),
    };

    let updatedCards = [...cards];
    if (newCard.isDefault) {
      updatedCards = updatedCards.map((c) => ({ ...c, isDefault: false }));
    }
    setCards([...updatedCards, newCard]);
  };

  const handleUpdateCard = (id: string, data: CardFormData) => {
    const cleanNum = data.cardNumber.replace(/\D/g, "");
    const last4 = cleanNum.length >= 4 ? cleanNum.slice(-4) : undefined;

    setCards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          return {
            ...card,
            holderName: data.holderName,
            expMonth: data.expMonth,
            expYear: data.expYear,
            isDefault: data.isDefault ? true : card.isDefault,
            ...(last4 ? { last4 } : {}),
          };
        }
        if (data.isDefault) {
          return { ...card, isDefault: false };
        }
        return card;
      })
    );
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) return;
    const targetCard = cards.find((c) => c.id === id);
    const filtered = cards.filter((c) => c.id !== id);

    if (targetCard?.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }

    setCards(filtered);
  };

  const handleSetDefaultCard = (id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === id,
      }))
    );
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-red-500 selection:text-white pb-24 antialiased">
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(204,20,45,0.18),rgba(255,255,255,0))]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        
        {/* Top Navbar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c91e2f] to-rose-700 flex items-center justify-center text-white font-black shadow-lg shadow-red-500/25">
              <Droplets className="w-6 h-6 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  Rush Wash
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  Unlimited VIP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Saudi Arabia&apos;s Premier Subscription Car Wash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Portal Login Link */}
            <a
              href="https://rush.com.sa/en/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#c91e2f] hover:bg-[#b01725] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
            >
              Portal Login <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Main Navigation Pill Tabs */}
        <nav className="flex items-center p-1 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-x-auto shadow-inner">
          {[
            { id: "CASHIER_QR", label: "Pay via QR", icon: QrCode },
            { id: "SUBSCRIBER", label: "Portal", icon: Layers },
            { id: "PLANS", label: "Plans", icon: Tag },
            { id: "CHECKOUT", label: "Moyasar Checkout", icon: ShoppingBag },
            { id: "FAMILY", label: "Family Pass", icon: Users },
            { id: "PAYMENTS", label: `Cards (${cards.length})`, icon: CreditCard },
            { id: "ANALYTICS", label: "Analytics", icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === id
                  ? "bg-[#c91e2f] text-white shadow-md shadow-red-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </nav>

        {/* Active Subscription Banner */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold shrink-0 border border-slate-700">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current Active Plan:</span>
                <span className="text-sm font-black text-white">{currentPlan.name} ({currentPlan.priceDisplay}/mo)</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Renews Aug 31 • Click to launch the mandatory 4-step exit survey & cancellation retention flow
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#c91e2f] hover:bg-[#b01725] text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" /> Cancellation Flow
          </button>
        </div>

        {/* Dynamic Tab Views */}
        {activeTab === "CASHIER_QR" && (
          <div className="space-y-6">
            <CashierQRScreen />
          </div>
        )}

        {activeTab === "SUBSCRIBER" && (
          <div className="space-y-6">
            <SubscriptionCard
              currentPlan={currentPlan || PLANS[0]}
              onOpenCancellation={() => setIsModalOpen(true)}
              cancellationData={cancellationData}
              activeOffer={activeOffer}
              onReactivate={handleReactivate}
            />
          </div>
        )}

        {activeTab === "PLANS" && (
          <div className="space-y-6">
            <PlanSelection
              currentPlan={currentPlan || PLANS[0]}
              onSelectPlan={handleSelectPlan}
            />
          </div>
        )}

        {activeTab === "CHECKOUT" && (
          <div className="space-y-6">
            <CheckoutScreen
              selectedPlan={currentPlan || PLANS[0]}
              paymentMethods={cards}
              onCompleteCheckout={handleCompleteCheckout}
            />
          </div>
        )}

        {activeTab === "FAMILY" && (
          <div className="space-y-6">
            <FamilyVehiclesManager
              vehicles={familyVehicles}
              currentPlan={currentPlan || PLANS[0]}
              maxSlots={5}
              onAddVehicle={handleAddFamilyVehicle}
              onRemoveVehicle={handleRemoveFamilyVehicle}
              onUpdateVehicle={handleUpdateFamilyVehicle}
            />
          </div>
        )}

        {activeTab === "PAYMENTS" && (
          <div className="space-y-6">
            <PaymentMethodsManager
              cards={cards}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onSetDefaultCard={handleSetDefaultCard}
            />
          </div>
        )}

        {activeTab === "ANALYTICS" && (
          <div className="space-y-6">
            <RetentionAnalytics
              metrics={analytics}
              totalSavedRevenue={totalSavedRevenue}
            />
          </div>
        )}
      </div>

      {/* Cancellation Exit Modal */}
      <CancellationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmCancellation={handleConfirmCancellation}
        onAcceptOffer={handleAcceptOffer}
      />
    </main>
  );
}
