"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  Car,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Zap,
  Printer,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  ChevronRight,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Smartphone,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  UserCheck,
  Tag,
  Search,
  X,
  Monitor,
  LayoutGrid,
  Check,
  AlertCircle,
  Receipt,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";

// Data Models
export interface ServiceItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  category: "SUBSCRIPTION" | "SINGLE_WASH" | "ADDON";
  description?: string;
}

export interface CartItem extends ServiceItem {
  quantity: number;
}

export interface VehicleProfile {
  id: string;
  customerName: string;
  customerNameEng: string;
  plateNumbers: string;
  plateLettersEng: string;
  plateLettersAr: string;
  make: string;
  model: string;
  color: string;
  rfidTag: string;
  isMember: boolean;
}

export interface CouponCode {
  code: string;
  label: string;
  discountType: "PERCENT" | "FIXED" | "OVERRIDE_PRICE";
  value: number; // percentage (e.g. 50 = 50%) or fixed SAR amount
  description: string;
}

// Preset catalog items
const CATALOG_ITEMS: ServiceItem[] = [
  {
    id: "sub-lava-199",
    name: "Rush Lava Unlimited Pass",
    nameAr: "اشتراك باقة راش لافا",
    price: 199,
    category: "SUBSCRIPTION",
    description: "Unlimited daily lava foam washes + wax",
  },
  {
    id: "sub-nano-299",
    name: "Rush Nano Ceramic VIP Pass",
    nameAr: "اشتراك باقة راش نانو سيراميك",
    price: 299,
    category: "SUBSCRIPTION",
    description: "Hydrophobic nano-shield protection + full care",
  },
  {
    id: "sub-express-149",
    name: "Rush Express Unlimited Pass",
    nameAr: "اشتراك راش إكسبريس الشهري",
    price: 149,
    category: "SUBSCRIPTION",
    description: "Quick daily exterior touchless wash",
  },
  {
    id: "wash-[#c91e2f]-75",
    name: "VIP Lava Foam Single Wash",
    nameAr: "غسيل لافا فوم VIP فردي",
    price: 75,
    category: "SINGLE_WASH",
    description: "Triple color lava foam + tire shine",
  },
  {
    id: "wash-express-45",
    name: "Express Touchless Wash",
    nameAr: "غسيل خارجي سريع",
    price: 45,
    category: "SINGLE_WASH",
    description: "5-minute fast exterior wash",
  },
  {
    id: "addon-ceramic-50",
    name: "Nano-Ceramic Hydro Boost",
    nameAr: "تعزيز حماية السيراميك",
    price: 50,
    category: "ADDON",
    description: "Hydrophobic surface sealant layer",
  },
  {
    id: "addon-interior-40",
    name: "Interior Deep Vacuum & Sanitization",
    nameAr: "تنظيف وتعقيم داخلي",
    price: 40,
    category: "ADDON",
    description: "Ozone sanitization + cabin vacuum",
  },
  {
    id: "addon-tire-25",
    name: "Tire Gloss & Rim Polish",
    nameAr: "تلميع الإطارات والجنوط",
    price: 25,
    category: "ADDON",
    description: "Long-lasting deep black tire shine",
  },
];

// Identified vehicles in lane
const LANE_VEHICLES: VehicleProfile[] = [
  {
    id: "veh_ford_7747",
    customerName: "زيد",
    customerNameEng: "Zaid Al-Harbi",
    plateNumbers: "7747",
    plateLettersEng: "RAS",
    plateLettersAr: "س ا ر",
    make: "Ford",
    model: "Explorer Limited",
    color: "Oxford White",
    rfidTag: "RF-7747-FORD",
    isMember: false,
  },
  {
    id: "veh_tesla_3xyz",
    customerName: "أليكس مورجان",
    customerNameEng: "Alex Morgan",
    plateNumbers: "3829",
    plateLettersEng: "XYZ",
    plateLettersAr: "س ي ز",
    make: "Tesla",
    model: "Model Y Dual Motor",
    color: "Solid Black",
    rfidTag: "RF-8849-TES",
    isMember: true,
  },
  {
    id: "veh_toyota_7abc",
    customerName: "سارة العتيبي",
    customerNameEng: "Sarah Al-Otaibi",
    plateNumbers: "7102",
    plateLettersEng: "ABC",
    plateLettersAr: "أ ب ج",
    make: "Toyota",
    model: "Camry SE",
    color: "Pearl White",
    rfidTag: "RF-3312-TOY",
    isMember: true,
  },
];

// Available Coupons
const PRESET_COUPONS: Record<string, CouponCode> = {
  RUSH50: {
    code: "RUSH50",
    label: "50% OFF PROMO",
    discountType: "PERCENT",
    value: 50,
    description: "50% Discount on Total Order",
  },
  "100FOR3": {
    code: "100FOR3",
    label: "100 SAR PROMO",
    discountType: "OVERRIDE_PRICE",
    value: 100,
    description: "Rush Lava Special Price: 100.00 SAR",
  },
  BUY2GET1: {
    code: "BUY2GET1",
    label: "BUY 2 GET 1 (33% OFF)",
    discountType: "PERCENT",
    value: 33.33,
    description: "Pay 2, 3rd Free (33.33% Off)",
  },
  VIP20: {
    code: "VIP20",
    label: "20 SAR OFF",
    discountType: "FIXED",
    value: 20,
    description: "20 SAR Instant Cash Discount",
  },
};

export default function CashierQRScreen() {
  // Screen Mode: DUAL (POS + Mirror), POS_ONLY, CUSTOMER_MIRROR
  const [viewMode, setViewMode] = useState<"DUAL" | "POS" | "CUSTOMER">("DUAL");

  // Theme state: dark VIP mode vs daylight ultra-clean mode
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  // Selected vehicle & customer in POS lane
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleProfile>(
    LANE_VEHICLES[0]
  );
  const [orderId, setOrderId] = useState("ORD-25195");

  // Cart state on POS
  const [cart, setCart] = useState<CartItem[]>([
    {
      ...CATALOG_ITEMS[0], // Rush Lava 199 SAR
      quantity: 1,
    },
  ]);

  // Active Category Filter in POS catalog
  const [catalogFilter, setCatalogFilter] = useState<
    "ALL" | "SUBSCRIPTION" | "SINGLE_WASH" | "ADDON"
  >("ALL");

  // Coupon state
  const [couponInput, setCouponInput] = useState("100FOR3");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(
    PRESET_COUPONS["100FOR3"]
  );
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment status
  const [paymentStatus, setPaymentStatus] = useState<
    "WAITING" | "SCANNING" | "PROCESSING" | "SUCCESS"
  >("WAITING");

  // Selected payment channel
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "MOYASAR" | "APPLE_PAY" | "STC_PAY" | "MADA"
  >("APPLE_PAY");

  // System status
  const [timeString, setTimeString] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setTimeString(formatted);
      setLastSyncTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cart Management Handlers
  const addToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...service, quantity: 1 }];
    });
    setPaymentStatus("WAITING");
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
    setPaymentStatus("WAITING");
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    setPaymentStatus("WAITING");
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setPaymentStatus("WAITING");
  };

  // Coupon Handlers
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;

    if (PRESET_COUPONS[code]) {
      setAppliedCoupon(PRESET_COUPONS[code]);
      setCouponInput(code);
      setCouponError(null);
      if (typeof window !== "undefined") {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      setCouponError(`Invalid coupon code "${code}". Try RUSH50, 100FOR3, BUY2GET1, or VIP20.`);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  // Financial Calculations
  const rawSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountAmount = 0;
  if (appliedCoupon && rawSubtotal > 0) {
    if (appliedCoupon.discountType === "PERCENT") {
      discountAmount = (rawSubtotal * appliedCoupon.value) / 100;
    } else if (appliedCoupon.discountType === "FIXED") {
      discountAmount = Math.min(appliedCoupon.value, rawSubtotal);
    } else if (appliedCoupon.discountType === "OVERRIDE_PRICE") {
      // e.g. 100FOR3 sets first subscription package to 100 SAR
      discountAmount = Math.max(0, rawSubtotal - appliedCoupon.value);
    }
  }

  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const vatAmount = subtotalAfterDiscount * 0.15; // 15% Saudi VAT included in total display or added
  const finalTotalAmount = subtotalAfterDiscount;

  // Simulate Payment Scan Flow
  const handleSimulateScan = () => {
    if (cart.length === 0 || finalTotalAmount === 0) return;
    setPaymentStatus("SCANNING");
    setTimeout(() => {
      setPaymentStatus("PROCESSING");
      setTimeout(() => {
        setPaymentStatus("SUCCESS");
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      }, 1500);
    }, 1200);
  };

  const handleResetPayment = () => {
    setPaymentStatus("WAITING");
  };

  // Dynamic QR Code Payload
  const qrPaymentPayload = `https://rush-customer.vercel.app/pay?ord=${orderId}&amount=${finalTotalAmount.toFixed(
    2
  )}&customer=${encodeURIComponent(
    selectedVehicle.customerNameEng
  )}&promo=${appliedCoupon?.code || ""}&method=${selectedPaymentMethod}`;

  const qrBgColor = themeMode === "dark" ? "0f172a" : "ffffff";
  const qrFgColor = themeMode === "dark" ? "ffffff" : "0f172a";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    qrPaymentPayload
  )}&bgcolor=${qrBgColor}&color=${qrFgColor}&format=svg`;

  // Catalog items filtered by category
  const filteredCatalog = CATALOG_ITEMS.filter((item) => {
    if (catalogFilter === "ALL") return true;
    return item.category === catalogFilter;
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        themeMode === "dark"
          ? "bg-[#0b0f19] text-slate-100 selection:bg-red-500 selection:text-white"
          : "bg-slate-50 text-slate-900 selection:bg-red-500 selection:text-white"
      } p-3 sm:p-6 rounded-3xl border ${
        themeMode === "dark" ? "border-slate-800/80" : "border-slate-200"
      } shadow-2xl relative overflow-hidden`}
    >
      {/* Background ambient lighting */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          themeMode === "dark"
            ? "bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(201,30,47,0.15),transparent)]"
            : "bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(201,30,47,0.06),transparent)]"
        }`}
      />

      {/* TOP POS & CUSTOMER MIRROR HEADER */}
      <header className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/40">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c91e2f] to-[#9b0f1e] flex items-center justify-center shadow-lg shadow-red-500/25 shrink-0">
            <span className="font-black text-lg text-white tracking-tighter">
              RUSH
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  themeMode === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Cashier POS & Pay via QR
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                POS Sync Active
              </span>
            </div>
            <p
              className={`text-xs font-medium mt-0.5 ${
                themeMode === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Order changes made on the Cashier POS mirror live onto the Customer Screen.
            </p>
          </div>
        </div>

        {/* View Controls & Action Bar */}
        <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
          {/* VIEW SWITCHER TABS */}
          <div
            className={`p-1 rounded-2xl border flex items-center gap-1 ${
              themeMode === "dark"
                ? "bg-slate-950/80 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <button
              onClick={() => setViewMode("DUAL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "DUAL"
                  ? "bg-[#c91e2f] text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Dual View: Cashier POS + Customer Mirror"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Split Screen
            </button>
            <button
              onClick={() => setViewMode("POS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "POS"
                  ? "bg-[#c91e2f] text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Cashier POS Terminal Only"
            >
              <Monitor className="w-3.5 h-3.5" /> Cashier POS
            </button>
            <button
              onClick={() => setViewMode("CUSTOMER")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "CUSTOMER"
                  ? "bg-[#c91e2f] text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Customer Facing Screen Only"
            >
              <QrCode className="w-3.5 h-3.5" /> Customer Mirror
            </button>
          </div>

          {/* Theme Mode Toggle */}
          <button
            onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              themeMode === "dark"
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
            title="Toggle Light / Dark Theme"
          >
            {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={handleResetPayment}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              themeMode === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset State
          </button>
        </div>
      </header>

      {/* DUAL SCREEN CONTAINER */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* ============================================================ */}
        {/* SECTION 1: CASHIER POS TERMINAL (Col 1-7 or Full when POS)  */}
        {/* ============================================================ */}
        {(viewMode === "DUAL" || viewMode === "POS") && (
          <div
            className={`${
              viewMode === "POS" ? "lg:col-span-12" : "lg:col-span-7"
            } space-y-6`}
          >
            <div
              className={`rounded-3xl p-5 sm:p-6 border backdrop-blur-xl transition-all shadow-xl ${
                themeMode === "dark"
                  ? "bg-slate-900/90 border-slate-800/80"
                  : "bg-white border-slate-200/90"
              }`}
            >
              {/* POS HEADER & VEHICLE SELECTOR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Monitor className="w-4 h-4" />
                  </span>
                  <div>
                    <h2
                      className={`text-xs font-black uppercase tracking-wider ${
                        themeMode === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Cashier POS Terminal
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Lane RFID Camera Detection Active
                    </span>
                  </div>
                </div>

                {/* Vehicle Selection Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Lane Car:
                  </span>
                  <select
                    value={selectedVehicle.id}
                    onChange={(e) => {
                      const found = LANE_VEHICLES.find(
                        (v) => v.id === e.target.value
                      );
                      if (found) setSelectedVehicle(found);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      themeMode === "dark"
                        ? "bg-slate-950 border-slate-800 text-white"
                        : "bg-slate-100 border-slate-300 text-slate-900"
                    }`}
                  >
                    {LANE_VEHICLES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.customerNameEng} ({v.make} {v.plateNumbers} {v.plateLettersEng})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SERVICE CATALOG BROWSER & CART GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-5">
                
                {/* POS Catalog Column (7 cols on split) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Service Catalog
                    </span>

                    {/* Catalog Filters */}
                    <div className="flex items-center gap-1">
                      {[
                        { id: "ALL", label: "All" },
                        { id: "SUBSCRIPTION", label: "Passes" },
                        { id: "SINGLE_WASH", label: "Washes" },
                        { id: "ADDON", label: "Addons" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setCatalogFilter(f.id as any)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            catalogFilter === f.id
                              ? "bg-[#c91e2f] text-white"
                              : "bg-slate-800/40 text-slate-400 hover:text-white"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catalog Cards Grid */}
                  <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
                    {filteredCatalog.map((item) => {
                      const inCart = cart.find((i) => i.id === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            inCart
                              ? "bg-red-500/10 border-red-500/50 text-white"
                              : themeMode === "dark"
                              ? "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                              : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold tracking-tight">
                                {item.name}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  item.category === "SUBSCRIPTION"
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    : item.category === "SINGLE_WASH"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {item.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {item.nameAr}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-[#c91e2f]">
                              {item.price}.00 SAR
                            </span>
                            <div className="w-6 h-6 rounded-lg bg-[#c91e2f] text-white flex items-center justify-center shadow-sm">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* POS Order Cart Column (5 cols on split) */}
                <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Current Cart ({cart.reduce((a, c) => a + c.quantity, 0)})
                      </span>
                      {cart.length > 0 && (
                        <button
                          onClick={clearCart}
                          className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {cart.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                          No items in cashier cart. Click items from catalog to add.
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              themeMode === "dark"
                                ? "bg-slate-950/80 border-slate-800 text-slate-200"
                                : "bg-slate-100 border-slate-200 text-slate-900"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {item.price} SAR × {item.quantity} = {item.price * item.quantity} SAR
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black px-1.5">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PROMO / COUPON CODE SECTION */}
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      themeMode === "dark"
                        ? "bg-slate-950/90 border-slate-800"
                        : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-red-500" /> Apply Coupon Code
                      </span>
                      {appliedCoupon && (
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {appliedCoupon.code} Applied
                        </span>
                      )}
                    </div>

                    {/* Quick Coupon Preset Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                      {Object.keys(PRESET_COUPONS).map((codeKey) => {
                        const coupon = PRESET_COUPONS[codeKey];
                        const isApplied = appliedCoupon?.code === codeKey;
                        return (
                          <button
                            key={codeKey}
                            onClick={() => handleApplyCoupon(codeKey)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer border ${
                              isApplied
                                ? "bg-red-500 text-white border-red-500 shadow-sm"
                                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {coupon.code}
                          </button>
                        );
                      })}
                    </div>

                    {/* Manual Coupon Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          setCouponError(null);
                        }}
                        placeholder="Enter coupon (e.g. RUSH50)"
                        className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold uppercase outline-none ${
                          themeMode === "dark"
                            ? "bg-slate-900 border-slate-700 text-white"
                            : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                      {appliedCoupon ? (
                        <button
                          onClick={handleRemoveCoupon}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyCoupon()}
                          className="px-3 py-1.5 bg-[#c91e2f] hover:bg-[#b01725] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {couponError && (
                      <p className="text-[11px] text-amber-400 font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        {couponError}
                      </p>
                    )}
                  </div>

                  {/* POS TOTAL & CASHIER ACTIONS */}
                  <div className="pt-3 border-t border-slate-700/40 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Subtotal:</span>
                      <span>{rawSubtotal.toFixed(2)} SAR</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                        <span>Coupon Discount ({appliedCoupon.code}):</span>
                        <span>-{discountAmount.toFixed(2)} SAR</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm font-black text-[#c91e2f]">
                      <span>Final Net Total (VAT Incl):</span>
                      <span className="text-xl">{finalTotalAmount.toFixed(2)} SAR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 2: CUSTOMER FACING DISPLAY (LIVE MIRROR PAY VIA QR)  */}
        {/* ============================================================ */}
        {(viewMode === "DUAL" || viewMode === "CUSTOMER") && (
          <div
            className={`${
              viewMode === "CUSTOMER" ? "lg:col-span-12" : "lg:col-span-5"
            } space-y-6`}
          >
            <div
              className={`rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all shadow-2xl flex flex-col items-center justify-between relative overflow-hidden ${
                themeMode === "dark"
                  ? "bg-slate-900/90 border-slate-800/80"
                  : "bg-white border-slate-200/90"
              }`}
            >
              {/* LIVE MIRROR HEADER */}
              <div className="flex items-center justify-between w-full pb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <QrCode className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Customer Screen (Live Mirror)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Sync: {lastSyncTime}
                </span>
              </div>

              {/* SAUDI LICENSE PLATE & CUSTOMER IDENTITY CARD */}
              <div
                className={`w-full mt-4 p-3.5 rounded-2xl border flex items-center justify-between ${
                  themeMode === "dark"
                    ? "bg-slate-950/80 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Customer & Vehicle
                  </div>
                  <div className="text-sm font-black text-white">
                    {selectedVehicle.customerName} ({selectedVehicle.customerNameEng})
                  </div>
                  <div className="text-xs text-slate-400">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </div>
                </div>

                {/* Saudi License Plate Component */}
                <div className="bg-white text-slate-950 rounded-lg border-2 border-slate-900 p-1 shadow-md flex items-center justify-between font-mono select-none">
                  <div className="flex flex-col items-center justify-center px-1.5">
                    <span className="text-xs font-black tracking-widest leading-none">
                      {selectedVehicle.plateNumbers}
                    </span>
                    <span className="text-[10px] font-black tracking-widest mt-0.5 leading-none uppercase">
                      {selectedVehicle.plateLettersEng}
                    </span>
                  </div>
                  <div className="h-7 w-px bg-slate-400 mx-1 flex flex-col items-center justify-center relative">
                    <span className="text-[7px] font-extrabold text-emerald-700">KSA</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-1.5 dir-rtl">
                    <span className="text-xs font-black tracking-widest leading-none font-sans">
                      ٧٧٤٧
                    </span>
                    <span className="text-[10px] font-black tracking-widest mt-0.5 leading-none font-sans">
                      {selectedVehicle.plateLettersAr}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE ITEM MIRROR TABLE */}
              <div
                className={`w-full mt-3 p-3 rounded-2xl border ${
                  themeMode === "dark"
                    ? "bg-slate-950/40 border-slate-800"
                    : "bg-slate-100/70 border-slate-200"
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Order Items</span>
                  <span>Price</span>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-3">
                      Waiting for cashier to add items...
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-200">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="font-mono text-slate-300">
                          {(item.price * item.quantity).toFixed(2)} SAR
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Applied Coupon Display on Customer Screen */}
                {appliedCoupon && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Coupon ({appliedCoupon.code})
                    </span>
                    <span>-{discountAmount.toFixed(2)} SAR</span>
                  </div>
                )}
              </div>

              {/* DYNAMIC QR CODE CONTAINER */}
              <div className="relative my-4 group">
                <div
                  className={`absolute -inset-4 rounded-3xl opacity-75 blur-xl transition-all ${
                    paymentStatus === "SUCCESS"
                      ? "bg-emerald-500/40"
                      : paymentStatus === "SCANNING" || paymentStatus === "PROCESSING"
                      ? "bg-amber-500/40 animate-pulse"
                      : "bg-red-500/25 group-hover:opacity-100"
                  }`}
                />

                <div
                  className={`relative p-4 rounded-3xl border-2 transition-all ${
                    themeMode === "dark"
                      ? "bg-slate-950 border-slate-800"
                      : "bg-slate-100 border-slate-300"
                  } shadow-2xl flex flex-col items-center justify-center`}
                >
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden bg-white p-3 shadow-inner flex items-center justify-center">
                    <img
                      src={qrImageUrl}
                      alt="Rush Pay via QR"
                      className={`w-full h-full object-contain transition-opacity duration-300 ${
                        paymentStatus === "PROCESSING" ? "opacity-30 blur-xs" : "opacity-100"
                      }`}
                    />

                    {/* SUCCESS OVERLAY */}
                    {paymentStatus === "SUCCESS" && (
                      <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-2 animate-bounce">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-white">Payment Approved!</h4>
                        <p className="text-xs text-emerald-200 mt-1 font-medium">
                          Receipt generated • Lane gate opening
                        </p>
                      </div>
                    )}

                    {/* PROCESSING OVERLAY */}
                    {paymentStatus === "PROCESSING" && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mb-2" />
                        <h4 className="text-sm font-black text-white">Authorizing Payment...</h4>
                        <p className="text-[11px] text-slate-300 mt-1">Moyasar Gateway</p>
                      </div>
                    )}
                  </div>

                  {/* Corner Target Markers */}
                  <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-red-500 rounded-tl" />
                  <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-red-500 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-red-500 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-red-500 rounded-br" />
                </div>
              </div>

              {/* TOTAL AMOUNT & SCAN SIMULATOR */}
              <div className="text-center w-full space-y-2.5">
                <div
                  className={`py-2 px-4 rounded-xl border text-center transition-all ${
                    themeMode === "dark"
                      ? "bg-slate-950/80 border-slate-800"
                      : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Scan Code to Pay Total
                  </div>
                  <div className="text-2xl font-black text-[#c91e2f] tracking-tight">
                    {finalTotalAmount.toFixed(2)} SAR
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSimulateScan}
                    disabled={cart.length === 0 || paymentStatus === "SUCCESS"}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      paymentStatus === "SUCCESS"
                        ? "bg-emerald-600 text-white cursor-default"
                        : cart.length === 0
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-[#c91e2f] hover:bg-[#b01725] text-white shadow-red-500/25"
                    }`}
                  >
                    {paymentStatus === "SUCCESS" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </>
                    ) : (
                      <>
                        <QrCode className="w-3.5 h-3.5" /> Simulate Scan
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      alert(
                        `Printing cashier slip for Order #${orderId} (${finalTotalAmount.toFixed(
                          2
                        )} SAR)`
                      )
                    }
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      themeMode === "dark"
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    Print Slip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
