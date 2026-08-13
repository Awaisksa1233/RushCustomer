"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  X,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Activity,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code
} from "lucide-react";
import { SubscriptionPlan } from "@/types/plan";

export interface ApplePayLogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warn" | "error";
  message: string;
  details?: any;
}

interface ApplePayDebugWindowProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ApplePayLogEntry[];
  onClearLogs: () => void;
  paymentRequestData?: any;
  selectedPlan: SubscriptionPlan;
  totalDueToday: number;
  currency: string;
  onAddLog: (entry: Omit<ApplePayLogEntry, "id" | "timestamp">) => void;
}

export default function ApplePayDebugWindow({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  paymentRequestData,
  selectedPlan,
  totalDueToday,
  currency,
  onAddLog,
}: ApplePayDebugWindowProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"diagnostics" | "logs" | "payload">("diagnostics");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Diagnostic state
  const [diagnostics, setDiagnostics] = useState<{
    isSecureContext: boolean;
    hasApplePaySession: boolean;
    canMakePayments: boolean | string;
    canMakePaymentsWithActiveCard: boolean | string;
    maxSupportedVersion: number;
    userAgent: string;
    hostname: string;
    protocol: string;
  }>({
    isSecureContext: false,
    hasApplePaySession: false,
    canMakePayments: "Checking...",
    canMakePaymentsWithActiveCard: "Checking...",
    maxSupportedVersion: 0,
    userAgent: "",
    hostname: "",
    protocol: "",
  });

  const runDiagnostics = async () => {
    if (typeof window === "undefined") return;

    const isSecure = window.isSecureContext || window.location.protocol === "https:";
    const ApplePaySession = (window as any).ApplePaySession;
    const hasSession = !!ApplePaySession;

    let canPay: boolean | string = false;
    let canPayActive: boolean | string = "Not checked";
    let maxVer = 0;

    if (hasSession) {
      // Find max supported version (14 down to 1)
      for (let v = 14; v >= 1; v--) {
        try {
          if (ApplePaySession.supportsVersion && ApplePaySession.supportsVersion(v)) {
            maxVer = v;
            break;
          }
        } catch {
          // ignore version check error
        }
      }

      try {
        canPay = ApplePaySession.canMakePayments();
      } catch (err: any) {
        canPay = `Error: ${err.message}`;
      }

      try {
        if (typeof ApplePaySession.canMakePaymentsWithActiveCard === "function") {
          // Merchant identifier used in Apple Pay setup
          canPayActive = await ApplePaySession.canMakePaymentsWithActiveCard("merchant.sa.com.rush11");
        } else {
          canPayActive = "canMakePaymentsWithActiveCard API unavailable";
        }
      } catch (err: any) {
        canPayActive = `Error: ${err.message}`;
      }
    }

    const diagResult = {
      isSecureContext: isSecure,
      hasApplePaySession: hasSession,
      canMakePayments: canPay,
      canMakePaymentsWithActiveCard: canPayActive,
      maxSupportedVersion: maxVer,
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
    };

    setDiagnostics(diagResult);

    onAddLog({
      type: hasSession && canPay ? "success" : "warn",
      message: "Ran Apple Pay Device & Browser Diagnostics",
      details: diagResult,
    });
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const testValidateSessionApi = async () => {
    setIsTestingApi(true);
    onAddLog({
      type: "info",
      message: "Testing /api/applepay/validate-session certificate & agent handshake...",
    });

    try {
      const startTime = Date.now();
      const res = await fetch("/api/applepay/validate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validationUrl: "test",
          isTest: true,
        }),
      });

      const elapsed = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.status === "ok") {
        onAddLog({
          type: "success",
          message: `✔ Backend Certificate & Domain Health Check PASSED (${elapsed}ms)`,
          details: { status: res.status, data },
        });
      } else {
        onAddLog({
          type: "error",
          message: `API Health Check Error (${res.status}): ${data.error || "Unknown error"}`,
          details: { status: res.status, data },
        });
      }
    } catch (err: any) {
      onAddLog({
        type: "error",
        message: `API fetch failed: ${err.message}`,
        details: { error: err.message },
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const copyAllLogs = () => {
    const logText = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${
            l.details ? "\nDetails: " + JSON.stringify(l.details, null, 2) : ""
          }`
      )
      .join("\n\n---\n\n");

    const fullReport = `=== APPLE PAY FRONTEND DEBUG REPORT ===
Time: ${new Date().toISOString()}
Host: ${diagnostics.hostname}
Secure Context: ${diagnostics.isSecureContext}
ApplePaySession: ${diagnostics.hasApplePaySession}
canMakePayments: ${diagnostics.canMakePayments}
canMakePaymentsWithActiveCard: ${diagnostics.canMakePaymentsWithActiveCard}
Max Version: ${diagnostics.maxSupportedVersion}
UA: ${diagnostics.userAgent}

=== LOGS (${logs.length}) ===
${logText || "No logs recorded yet."}`;

    navigator.clipboard.writeText(fullReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Apple Pay On-Page Debug Console
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                    Live Diagnostics
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Inspect device support, session callbacks, and network responses on mobile/Safari
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="bg-slate-900 border-b border-slate-800 p-2 sm:px-5 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab("diagnostics")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "diagnostics"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Diagnostics
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "logs"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Event Logs ({logs.length})
              </button>
              <button
                onClick={() => setActiveTab("payload")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "payload"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Code className="w-3.5 h-3.5" /> Sheet Payload
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runDiagnostics}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Re-Check
              </button>
              <button
                onClick={copyAllLogs}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                {copied ? "Copied!" : "Copy Report"}
              </button>
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 1: DIAGNOSTICS */}
            {activeTab === "diagnostics" && (
              <div className="space-y-4">
                {/* Summary Alert */}
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    diagnostics.hasApplePaySession && diagnostics.canMakePayments === true
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  }`}
                >
                  {diagnostics.hasApplePaySession && diagnostics.canMakePayments === true ? (
                    <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide">
                      {diagnostics.hasApplePaySession && diagnostics.canMakePayments === true
                        ? "Apple Pay JS Supported & Ready"
                        : diagnostics.hasApplePaySession
                        ? "ApplePaySession Object Present, But Payments Disabled"
                        : "ApplePaySession Not Supported on this Device / Browser"}
                    </h4>
                    <p className="text-xs mt-1 text-slate-300 font-medium leading-relaxed">
                      {diagnostics.hasApplePaySession && diagnostics.canMakePayments === true
                        ? "Your browser supports Apple Pay JS. Clicking subscribe will launch the native Apple Pay sheet."
                        : diagnostics.hasApplePaySession
                        ? "ApplePaySession exists in window, but canMakePayments() returned false. Ensure a payment card is added to Wallet."
                        : "Apple Pay JS is only natively supported in Safari on iPhone, iPad, Apple Watch, or Mac. Non-Apple devices use the QR fallback."}
                    </p>
                  </div>
                </div>

                {/* Grid of Diagnostics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      HTTPS / Secure Context
                    </span>
                    <span
                      className={`text-sm font-extrabold flex items-center gap-1.5 ${
                        diagnostics.isSecureContext ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {diagnostics.isSecureContext ? "✓ Secure (HTTPS)" : "✗ Insecure Context (Requires HTTPS)"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ApplePaySession API
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        diagnostics.hasApplePaySession ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {diagnostics.hasApplePaySession ? "✓ Present in window" : "✗ Not defined"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      canMakePayments()
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        diagnostics.canMakePayments === true ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {String(diagnostics.canMakePayments)}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      canMakePaymentsWithActiveCard()
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        diagnostics.canMakePaymentsWithActiveCard === true
                          ? "text-emerald-400"
                          : "text-slate-300"
                      }`}
                    >
                      {String(diagnostics.canMakePaymentsWithActiveCard)}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Highest Supported Version
                    </span>
                    <span className="text-sm font-extrabold text-amber-400 font-mono">
                      {diagnostics.maxSupportedVersion > 0
                        ? `v${diagnostics.maxSupportedVersion} (Using v14 for recurring)`
                        : "None detected"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Host & Protocol
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-bold">
                      {diagnostics.protocol}//{diagnostics.hostname}
                    </span>
                  </div>
                </div>

                {/* API Test Button */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black uppercase text-white">
                        Test Merchant Session Validation API Endpoint
                      </h5>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Sends a test POST to `/api/applepay/validate-session` to verify backend cert loading
                      </p>
                    </div>
                    <button
                      onClick={testValidateSessionApi}
                      disabled={isTestingApi}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isTestingApi ? "Testing..." : "Test Validation API"}
                    </button>
                  </div>
                </div>

                {/* User Agent */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    User-Agent Header
                  </span>
                  <p className="text-[11px] font-mono text-slate-400 break-all">{diagnostics.userAgent}</p>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE EVENT LOGS */}
            {activeTab === "logs" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Console Log Stream ({logs.length} entries)
                  </span>
                  {logs.length > 0 && (
                    <button
                      onClick={onClearLogs}
                      className="text-xs font-extrabold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear Logs
                    </button>
                  )}
                </div>

                {logs.length === 0 ? (
                  <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-2">
                    <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-semibold">
                      No Apple Pay events logged yet. Tap "Subscribe with Apple Pay" to capture session events.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const badgeColors = {
                        info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                        success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                        warn: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                        error: "bg-red-500/20 text-red-300 border-red-500/30",
                      };

                      return (
                        <div
                          key={log.id}
                          className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-xs"
                        >
                          <div
                            onClick={() => log.details && setExpandedLogId(isExpanded ? null : log.id)}
                            className={`p-3 flex items-start justify-between gap-3 ${
                              log.details ? "cursor-pointer hover:bg-slate-900/60" : ""
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-slate-500">{log.timestamp}</span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                    badgeColors[log.type]
                                  }`}
                                >
                                  {log.type}
                                </span>
                              </div>
                              <p className="font-medium text-slate-200">{log.message}</p>
                            </div>

                            {log.details && (
                              <button className="text-slate-500 hover:text-white p-1">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            )}
                          </div>

                          {isExpanded && log.details && (
                            <div className="bg-slate-900/90 p-3 border-t border-slate-800 overflow-x-auto">
                              <pre className="text-[10px] font-mono text-slate-300 leading-relaxed">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAYLOAD INSPECTOR */}
            {activeTab === "payload" && (
              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Current ApplePayPaymentRequest Object
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      Target: ApplePaySession v14
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    This is the exact JSON structure passed to `new ApplePaySession(14, paymentRequest)`:
                  </p>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-x-auto">
                  <pre className="text-[11px] font-mono text-emerald-300 leading-relaxed">
                    {JSON.stringify(paymentRequestData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
