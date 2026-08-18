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
  Trash2,
  Smartphone,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  UserCheck
} from "lucide-react";
import confetti from "canvas-confetti";

interface ServiceItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  category: "MEMBERSHIP" | "SINGLE_WASH" | "ADDON";
}

const AVAILABLE_SERVICES: ServiceItem[] = [
  {
    id: "membership-lava-100",
    name: "Rush Lava Monthly Pass (Promo)",
    nameAr: "اشتراك باقة راش لافا الشهري",
    price: 100,
    category: "MEMBERSHIP",
  },
  {
    id: "membership-nano-299",
    name: "Rush Nano Ceramic VIP (Monthly)",
    nameAr: "اشتراك راش نانو سيراميك VIP",
    price: 299,
    category: "MEMBERSHIP",
  },
  {
    id: "wash-express-45",
    name: "Express Exterior Wash",
    nameAr: "غسيل خارجي سريع",
    price: 45,
    category: "SINGLE_WASH",
  },
  {
    id: "addon-ceramic-50",
    name: "Ceramic Sealant Boost",
    nameAr: "تعزيز حماية السيراميك",
    price: 50,
    category: "ADDON",
  },
  {
    id: "addon-interior-40",
    name: "Interior Sanitization & Vacuum",
    nameAr: "تنظيف وتعقيم داخلي",
    price: 40,
    category: "ADDON",
  },
];

export default function CashierQRScreen() {
  // Theme state: dark VIP mode vs daylight ultra-clean mode
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  
  // Customer & Vehicle State
  const [customerName, setCustomerName] = useState("زيد");
  const [customerNameEng, setCustomerNameEng] = useState("Zaid");
  const [plateNumbers, setPlateNumbers] = useState("7747");
  const [plateLettersEng, setPlateLettersEng] = useState("RAS");
  const [plateLettersAr, setPlateLettersAr] = useState("س ا ر");
  const [vehicleMake, setVehicleMake] = useState("Ford");
  const [vehicleModel, setVehicleModel] = useState("Explorer Limited");
  const [vehicleColor, setVehicleColor] = useState("Oxford White");
  const [orderId, setOrderId] = useState("ORD-25195");
  const [isNewMembership, setIsNewMembership] = useState(true);

  // Selected order items
  const [selectedItems, setSelectedItems] = useState<ServiceItem[]>([
    AVAILABLE_SERVICES[0], // Rush Lava 100 SAR default
  ]);

  // Payment status
  const [paymentStatus, setPaymentStatus] = useState<
    "WAITING" | "SCANNING" | "PROCESSING" | "SUCCESS"
  >("WAITING");

  // Timer & lane status
  const [timeString, setTimeString] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "MOYASAR" | "APPLE_PAY" | "STC_PAY" | "MADA"
  >("APPLE_PAY");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate totals
  const subtotal = selectedItems.reduce((acc, item) => acc + item.price, 0);
  const vatAmount = subtotal * 0.15; // 15% Saudi VAT
  const totalAmount = subtotal; // If VAT included or subtotal = total

  const toggleItem = (service: ServiceItem) => {
    if (selectedItems.some((i) => i.id === service.id)) {
      setSelectedItems(selectedItems.filter((i) => i.id !== service.id));
    } else {
      setSelectedItems([...selectedItems, service]);
    }
  };

  const handleSimulateScan = () => {
    if (subtotal === 0) return;
    setPaymentStatus("SCANNING");
    setTimeout(() => {
      setPaymentStatus("PROCESSING");
      setTimeout(() => {
        setPaymentStatus("SUCCESS");
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      }, 1500);
    }, 1200);
  };

  const handleResetPayment = () => {
    setPaymentStatus("WAITING");
  };

  // Generate QR Image URL dynamically based on totalAmount & payment method
  const qrPaymentPayload = `https://rush-customer.vercel.app/pay?ord=${orderId}&amount=${totalAmount}&customer=${encodeURIComponent(
    customerNameEng
  )}&method=${selectedPaymentMethod}`;
  
  const qrBgColor = themeMode === "dark" ? "0f172a" : "ffffff";
  const qrFgColor = themeMode === "dark" ? "ffffff" : "0f172a";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    qrPaymentPayload
  )}&bgcolor=${qrBgColor}&color=${qrFgColor}&format=svg`;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        themeMode === "dark"
          ? "bg-[#0b0f19] text-slate-100 selection:bg-red-500 selection:text-white"
          : "bg-slate-50 text-slate-900 selection:bg-red-500 selection:text-white"
      } p-3 sm:p-6 lg:p-8 rounded-3xl border ${
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

      {/* TOP KIOSK HEADER & CONTROL BAR */}
      <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700/40">
        <div className="flex items-center gap-4">
          {/* Official Rush Logo Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c91e2f] to-[#9b0f1e] flex items-center justify-center shadow-lg shadow-red-500/25 shrink-0">
            <span className="font-black text-xl text-white tracking-tighter">
              RUSH
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  themeMode === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Pay via QR
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Lane 01 Active
              </span>
            </div>
            <p
              className={`text-xs sm:text-sm font-medium mt-0.5 ${
                themeMode === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Live view of the cashier lane — customer, vehicle, and order as they build.
            </p>
          </div>
        </div>

        {/* Action Controls & Controls Bar */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Live Clock */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              themeMode === "dark"
                ? "bg-slate-900/80 border-slate-800 text-slate-300"
                : "bg-white border-slate-200 text-slate-700 shadow-sm"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span>{timeString || "12:00:00 PM"}</span>
          </div>

          {/* Theme Mode Toggle */}
          <button
            onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              themeMode === "dark"
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
            title="Toggle Light / Dark Cashier Theme"
          >
            {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              themeMode === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
            title="Toggle Scan Beep Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
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
            <RefreshCw className="w-3.5 h-3.5" />
            Reset State
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3.5 py-2 rounded-xl bg-[#c91e2f] hover:bg-[#b01725] text-white text-xs font-extrabold shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFullscreen ? "Exit Fullscreen" : "Kiosk View"}
          </button>
        </div>
      </header>

      {/* MAIN TWO-COLUMN REDESIGNED INTERFACE */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* LEFT COLUMN: ORDER SUMMARY & VEHICLE IDENTITY (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className={`rounded-3xl p-6 border backdrop-blur-xl transition-all shadow-xl ${
              themeMode === "dark"
                ? "bg-slate-900/90 border-slate-800/80"
                : "bg-white border-slate-200/90"
            }`}
          >
            {/* Card Section Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <h2
                  className={`text-xs font-black uppercase tracking-wider ${
                    themeMode === "dark" ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Order Summary
                </h2>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
                #{orderId}
              </span>
            </div>

            {/* CUSTOMER & VEHICLE DETAILS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              
              {/* Customer Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  themeMode === "dark"
                    ? "bg-slate-950/60 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Customer
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black tracking-tight">
                      {customerName}
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                      ({customerNameEng})
                    </div>
                  </div>
                  <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
              </div>

              {/* SAUDI LICENSE PLATE GRAPHIC */}
              <div
                className={`p-3 rounded-2xl border flex flex-col justify-between ${
                  themeMode === "dark"
                    ? "bg-slate-950/60 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Plate Number
                </div>
                
                {/* Authentic Saudi License Plate SVG/CSS Component */}
                <div className="w-full bg-white text-slate-950 rounded-lg border-2 border-slate-900 p-1.5 shadow-md flex items-center justify-between font-mono select-none">
                  {/* Left Side: English */}
                  <div className="flex flex-col items-center justify-center px-1.5">
                    <span className="text-sm font-black tracking-widest leading-none">
                      {plateNumbers}
                    </span>
                    <span className="text-xs font-black tracking-widest mt-1 leading-none uppercase">
                      {plateLettersEng}
                    </span>
                  </div>

                  {/* Center Divider with Saudi Emblem */}
                  <div className="h-9 w-px bg-slate-400 mx-1 flex flex-col items-center justify-center relative">
                    <div className="text-[8px] font-extrabold text-emerald-700 uppercase tracking-tighter">
                      KSA
                    </div>
                    <div className="text-[9px] text-emerald-800 font-bold">🌴⚔️</div>
                  </div>

                  {/* Right Side: Arabic */}
                  <div className="flex flex-col items-center justify-center px-1.5 dir-rtl">
                    <span className="text-sm font-black tracking-widest leading-none font-sans">
                      ٧٧٤٧
                    </span>
                    <span className="text-xs font-black tracking-widest mt-1 leading-none font-sans">
                      {plateLettersAr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Model Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  themeMode === "dark"
                    ? "bg-slate-950/60 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Vehicle
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black tracking-tight">
                      {vehicleMake}
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                      {vehicleModel}
                    </div>
                  </div>
                  <Car className="w-5 h-5 text-red-500 shrink-0" />
                </div>
              </div>
            </div>

            {/* MEMBERSHIP STATUS BADGE */}
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {isNewMembership && (
                  <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-red-500/15 text-red-500 border border-red-500/30 shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 fill-red-500/30" />
                    New Membership
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800/60 text-slate-300 border border-slate-700/60">
                  RFID Tag: #RF-7747-FORD
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Camera Lane Detection Verified
              </span>
            </div>

            {/* LIVE ORDER SERVICES ITEM BUILDER */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={`text-xs font-black uppercase tracking-wider ${
                    themeMode === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Select Service / Membership Package
                </h3>
                <span className="text-xs text-slate-400">
                  Click to add or remove items
                </span>
              </div>

              {/* Service Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_SERVICES.map((service) => {
                  const isSelected = selectedItems.some(
                    (i) => i.id === service.id
                  );
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleItem(service)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-red-500/10 border-red-500/50 text-white shadow-md"
                          : themeMode === "dark"
                          ? "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold tracking-tight">
                          {service.name}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                          {service.nameAr}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-red-500 whitespace-nowrap">
                          {service.price}.00 SAR
                        </span>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isSelected
                              ? "bg-red-500 border-red-500 text-white"
                              : "border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATUS MESSAGE BOX */}
            <div
              className={`mt-6 p-4 rounded-2xl border flex items-start gap-3 ${
                selectedItems.length === 0
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : themeMode === "dark"
                  ? "bg-slate-950/80 border-slate-800 text-slate-300"
                  : "bg-slate-100 border-slate-200 text-slate-800"
              }`}
            >
              <Zap className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold tracking-tight">
                  {selectedItems.length === 0
                    ? "Vehicle selected — waiting for services or a membership package."
                    : `Active Package Selected (${selectedItems.length} items)`}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {selectedItems.length === 0
                    ? "Cashier lane identified Ford Explorer (#7747 RAS). Please select a package or wash tier above to generate QR payment link."
                    : "Customer ready to pay via QR. Scan the QR code on the right display screen or choose your preferred mobile payment method."}
                </p>
              </div>
            </div>

            {/* TOTAL PRICE FOOTER */}
            <div className="mt-6 pt-5 border-t border-slate-700/40 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Total Order Amount
                </div>
                <div className="text-[11px] text-slate-400">
                  Includes 15% Saudi VAT ({(vatAmount).toFixed(2)} SAR)
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-[#c91e2f] tracking-tight">
                  {totalAmount.toFixed(2)} SAR
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-CONTRAST QR PAYMENT DISPLAY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`rounded-3xl p-6 sm:p-8 border backdrop-blur-xl transition-all shadow-2xl flex flex-col items-center justify-between relative overflow-hidden ${
              themeMode === "dark"
                ? "bg-slate-900/90 border-slate-800/80"
                : "bg-white border-slate-200/90"
            }`}
          >
            {/* Header instruction */}
            <div className="text-center space-y-1 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 mb-1">
                <Smartphone className="w-3.5 h-3.5" /> Direct Mobile Payment
              </div>
              <h2
                className={`text-lg sm:text-xl font-black tracking-tight ${
                  themeMode === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Scan this code to complete payment
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Supports Apple Pay, Mada, Moyasar, and STC Pay
              </p>
            </div>

            {/* DYNAMIC QR CODE DISPLAY CONTAINER */}
            <div className="relative my-6 group">
              {/* Outer Glow / Target Ring */}
              <div
                className={`absolute -inset-4 rounded-3xl opacity-75 blur-xl transition-all ${
                  paymentStatus === "SUCCESS"
                    ? "bg-emerald-500/40"
                    : paymentStatus === "SCANNING" || paymentStatus === "PROCESSING"
                    ? "bg-amber-500/40 animate-pulse"
                    : "bg-red-500/25 group-hover:opacity-100"
                }`}
              />

              {/* QR Image Frame */}
              <div
                className={`relative p-5 sm:p-6 rounded-3xl border-2 transition-all ${
                  themeMode === "dark"
                    ? "bg-slate-950 border-slate-800"
                    : "bg-slate-100 border-slate-300"
                } shadow-2xl flex flex-col items-center justify-center`}
              >
                {/* QR Code SVG Image */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-white p-3 shadow-inner flex items-center justify-center">
                  <img
                    src={qrImageUrl}
                    alt="Rush Cashier QR Code"
                    className={`w-full h-full object-contain transition-opacity duration-300 ${
                      paymentStatus === "PROCESSING" ? "opacity-30 blur-xs" : "opacity-100"
                    }`}
                  />

                  {/* SUCCESS OVERLAY */}
                  {paymentStatus === "SUCCESS" && (
                    <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                      <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-3 animate-bounce">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h4 className="text-xl font-black text-white">Payment Approved!</h4>
                      <p className="text-xs text-emerald-200 mt-1 font-medium">
                        Receipt generated • Lane gate opening
                      </p>
                    </div>
                  )}

                  {/* PROCESSING OVERLAY */}
                  {paymentStatus === "PROCESSING" && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                      <RefreshCw className="w-10 h-10 text-red-500 animate-spin mb-2" />
                      <h4 className="text-base font-black text-white">Authorizing Payment...</h4>
                      <p className="text-xs text-slate-300 mt-1">Connecting to Moyasar Gateway</p>
                    </div>
                  )}
                </div>

                {/* Scan Corner Crosshairs */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br" />
              </div>
            </div>

            {/* DISPLAY AMOUNT UNDER QR */}
            <div className="text-center w-full space-y-3">
              <div
                className={`py-2.5 px-6 rounded-2xl border text-center transition-all ${
                  themeMode === "dark"
                    ? "bg-slate-950/80 border-slate-800"
                    : "bg-slate-100 border-slate-200"
                }`}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Amount Due
                </div>
                <div className="text-3xl font-black text-[#c91e2f] tracking-tight">
                  {totalAmount.toFixed(2)} SAR
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR PILLS */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {[
                  { id: "APPLE_PAY", label: "Apple Pay" },
                  { id: "MADA", label: "Mada" },
                  { id: "MOYASAR", label: "Credit Card" },
                  { id: "STC_PAY", label: "STC Pay" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedPaymentMethod(m.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      selectedPaymentMethod === m.id
                        ? "bg-[#c91e2f] text-white shadow-sm"
                        : "bg-slate-800/40 text-slate-400 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* SIMULATE & PRINT ACTIONS */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={handleSimulateScan}
                  disabled={subtotal === 0 || paymentStatus === "SUCCESS"}
                  className={`py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    paymentStatus === "SUCCESS"
                      ? "bg-emerald-600 text-white cursor-default"
                      : subtotal === 0
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-[#c91e2f] hover:bg-[#b01725] active:bg-[#960a1c] text-white shadow-red-500/25"
                  }`}
                >
                  {paymentStatus === "SUCCESS" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Paid
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Simulate Scan
                    </>
                  )}
                </button>

                <button
                  onClick={() => alert(`Printing cashier receipt for Order #${orderId}...`)}
                  className={`py-3 px-4 rounded-2xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    themeMode === "dark"
                      ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  Print Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
