"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  Sparkles, 
  PauseCircle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowLeft,
  DollarSign,
  HeartHandshake,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Gift,
  Clock
} from "lucide-react";
import confetti from "canvas-confetti";
import { CancellationReason, FlowStep, CancellationData } from "@/types/cancellation";

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancellation: (data: CancellationData) => void;
  onAcceptOffer: (offerName: string) => void;
}

const REASON_OPTIONS: CancellationReason[] = [
  "Too expensive",
  "Not washing often",
  "Poor service",
  "Other"
];

export default function CancellationModal({
  isOpen,
  onClose,
  onConfirmCancellation,
  onAcceptOffer,
}: CancellationModalProps) {
  const [step, setStep] = useState<FlowStep>("REASON");
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [pauseMonths, setPauseMonths] = useState<number>(1);
  const [acceptedOfferName, setAcceptedOfferName] = useState<string>("");

  if (!isOpen) return null;

  const handleReasonSelect = (reason: CancellationReason) => {
    setSelectedReason(selectedReason === reason ? null : reason);
  };

  const handleNextFromReason = () => {
    if (selectedReason) {
      setStep("OFFER");
    } else {
      // If no reason picked, skip directly to confirmation
      setStep("CONFIRM");
    }
  };

  const handleAcceptOffer = (offerName: string) => {
    setAcceptedOfferName(offerName);
    onAcceptOffer(offerName);
    
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onClose();
  };

  const handleFinalConfirm = () => {
    const finalData: CancellationData = {
      reason: selectedReason,
      feedbackText,
      cancelledAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      effectiveEndDate: "Aug 31, 2026",
    };
    onConfirmCancellation(finalData);
    setStep("SUCCESS");

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const resetAndClose = () => {
    setStep("REASON");
    setSelectedReason(null);
    setFeedbackText("");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10"
        >
          {/* Header Bar */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-white">
            <div className="flex items-center gap-3">
              {step !== "REASON" && step !== "SUCCESS" && (
                <button
                  onClick={() => {
                    if (step === "OFFER") setStep("REASON");
                    if (step === "CONFIRM") setStep(selectedReason ? "OFFER" : "REASON");
                  }}
                  className="p-1.5 -ml-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-snug">
                  {step === "REASON" && "Why are you thinking of leaving?"}
                  {step === "OFFER" && "Before you go..."}
                  {step === "CONFIRM" && "Are you sure you want to cancel?"}
                  {step === "SUCCESS" && "Cancellation Scheduled"}
                </h2>
                {step !== "SUCCESS" && (
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    Step {step === "REASON" ? "1" : step === "OFFER" ? "2" : "3"} of 3
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={resetAndClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: Reason Selection (Exact Screenshot UI) */}
              {step === "REASON" && (
                <motion.div
                  key="step-reason"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-900 font-extrabold text-sm sm:text-base">
                        Select a cancellation reason <span className="text-red-600 font-black">(Required)</span>
                      </h3>
                      {!selectedReason && (
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Must select a reason
                        </span>
                      )}
                    </div>

                    {/* Pill Options matching screenshot */}
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {REASON_OPTIONS.map((reason) => {
                        const isSelected = selectedReason === reason;
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => handleReasonSelect(reason)}
                            className={`px-5 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer flex items-center gap-2 select-none ${
                              isSelected
                                ? "bg-red-50 border-2 border-red-600 text-red-700 shadow-sm ring-2 ring-red-100 scale-[1.02]"
                                : "bg-white border border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                            }`}
                          >
                            {reason}
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Feedback Box */}
                  {selectedReason && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2"
                    >
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                        Tell us a bit more about why ({selectedReason})
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="What could we have done better?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-slate-900 placeholder:text-slate-400 text-sm outline-none transition-all resize-none bg-slate-50/50"
                      />
                    </motion.div>
                  )}

                  {/* Continue Button (Disabled until reason selected) */}
                  <div className="pt-4 space-y-2">
                    <button
                      type="button"
                      disabled={!selectedReason}
                      onClick={handleNextFromReason}
                      className={`w-full py-3.5 px-6 font-bold text-base rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
                        selectedReason
                          ? "bg-[#cc142d] hover:bg-[#b00f24] active:bg-[#960a1c] text-white shadow-md cursor-pointer transform active:scale-[0.99]"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      }`}
                    >
                      Continue
                    </button>
                    {!selectedReason && (
                      <p className="text-xs text-slate-400 text-center font-medium">
                        Please choose a reason above to enable the Continue button.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Tailored Retention Offer */}
              {step === "OFFER" && (
                <motion.div
                  key="step-offer"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {/* Option A: Too Expensive -> 50% Off Offer */}
                  {selectedReason === "Too expensive" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider bg-emerald-100/80 px-3 py-1 rounded-full w-fit">
                        <Gift className="w-3.5 h-3.5" /> Exclusive Member Discount
                      </div>
                      <div>
                        <h4 className="text-xl font-extrabold text-slate-900">
                          Get 50% off for your next 3 months!
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          We&apos;d love to keep you! Continue your Rush Wash Pass for just{" "}
                          <span className="font-bold text-emerald-700">149 SAR/mo</span> (regularly 299 SAR/mo).
                        </p>
                      </div>

                      <div className="bg-white/80 backdrop-blur rounded-xl p-3.5 border border-emerald-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>New Billing Rate:</span>
                        <span className="text-emerald-700 font-extrabold text-sm">149 SAR / mo</span>
                      </div>

                      <button
                        onClick={() => handleAcceptOffer("50% Off Special (3 Months)")}
                        className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5" /> Claim 50% Off & Keep Pass
                      </button>
                    </div>
                  )}

                  {/* Option B: Not Washing Often -> Pause Subscription */}
                  {selectedReason === "Not washing often" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 space-y-4">
                      <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider bg-blue-100/80 px-3 py-1 rounded-full w-fit">
                        <PauseCircle className="w-3.5 h-3.5" /> Flexible Pause Option
                      </div>
                      <div>
                        <h4 className="text-xl font-extrabold text-slate-900">
                          Pause your pass instead of canceling
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Going out of town or busy? Pause your account with 0 SAR charges and retain your locked-in plan rate when you return.
                        </p>
                      </div>

                      {/* Pause Duration Picker */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">
                          Select pause duration:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPauseMonths(m)}
                              className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                                pauseMonths === m
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {m} {m === 1 ? "Month" : "Months"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAcceptOffer(`Subscription Paused for ${pauseMonths} Month(s)`)}
                        className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Clock className="w-5 h-5" /> Pause Pass for {pauseMonths} {pauseMonths === 1 ? "Month" : "Months"}
                      </button>
                    </div>
                  )}

                  {/* Option C: Poor Service -> 1 Month Free + VIP Support */}
                  {selectedReason === "Poor service" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 space-y-4">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider bg-amber-100/80 px-3 py-1 rounded-full w-fit">
                        <HeartHandshake className="w-3.5 h-3.5" /> We Want to Make It Right
                      </div>
                      <div>
                        <h4 className="text-xl font-extrabold text-slate-900">
                          1 Month Free + VIP Priority Concierge
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          We sincerely apologize for falling short. Enjoy your next month 100% FREE (0 SAR), while our management team personally addresses your feedback.
                        </p>
                      </div>

                      <button
                        onClick={() => handleAcceptOffer("1 Month Free + Dedicated VIP Concierge")}
                        className="w-full py-3.5 px-6 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Gift className="w-5 h-5" /> Accept Free Month & VIP Support
                      </button>
                    </div>
                  )}

                  {/* Option D: Other -> Switch to Rush Express */}
                  {selectedReason === "Other" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/80 space-y-4">
                      <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider bg-purple-100/80 px-3 py-1 rounded-full w-fit">
                        <Sparkles className="w-3.5 h-3.5" /> Flexible Custom Options
                      </div>
                      <div>
                        <h4 className="text-xl font-extrabold text-slate-900">
                          Switch to Rush Express (149 SAR/mo)
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Need lighter washes? Switch to our standard unlimited pass anytime without cancellation fees.
                        </p>
                      </div>

                      <button
                        onClick={() => handleAcceptOffer("Switched to Rush Express (149 SAR/mo)")}
                        className="w-full py-3.5 px-6 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Switch to Rush Express (149 SAR/mo)
                      </button>
                    </div>
                  )}

                  {/* Secondary Action: Proceed to Cancel */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("CONFIRM")}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      No thanks, proceed with cancellation
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Benefits Loss Summary & Final Confirmation */}
              {step === "CONFIRM" && (
                <motion.div
                  key="step-confirm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-red-950">
                        You will lose access to member perks on Aug 31, 2026
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        Your account will remain active until the end of your current billing period.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Benefits you&apos;ll be giving up:
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-700 font-semibold">
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">✕</span>
                        Unlimited Washes across all 45+ locations
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">✕</span>
                        Express VIP Lane entry (Zero wait times)
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">✕</span>
                        Free Vacuum & Hot Ceramic Polish finish
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">✕</span>
                        20% Member discount on interior detailing
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={handleFinalConfirm}
                      className="w-full py-3.5 px-6 bg-[#cc142d] hover:bg-[#b00f24] active:bg-[#960a1c] text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-5 h-5" /> Confirm Cancellation
                    </button>

                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Never mind, keep my pass
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Success / Confirmation View */}
              {step === "SUCCESS" && (
                <motion.div
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4 space-y-5"
                >
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900">
                      Cancellation Confirmed
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                      Your subscription has been scheduled for cancellation. You can continue using your pass until <span className="font-bold text-slate-800">August 31, 2026</span>.
                    </p>
                  </div>

                  {selectedReason && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left max-w-xs mx-auto">
                      <span className="font-bold text-slate-800">Feedback Logged:</span> &ldquo;{selectedReason}&rdquo;
                      {feedbackText && <p className="mt-1 italic">&ldquo;{feedbackText}&rdquo;</p>}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      Done & Return to Account
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
