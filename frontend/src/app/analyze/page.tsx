"use client";

import { useState } from "react";
import { 
  Search, 
  Sparkles, 
  RotateCcw, 
  Globe, 
  MessageSquare, 
  AlertCircle
} from "lucide-react";
import InvestigationProgress, { InvestigationStep } from "@/components/InvestigationProgress";
import RiskResultCard, { AnalysisResultData } from "@/components/RiskResultCard";

const SAMPLE_SCENARIOS = [
  {
    name: "Urgent Bank KYC Scam (CRITICAL)",
    type: "message",
    source: "SMS",
    context: "Received from an unknown 10-digit number claiming to be SBI support",
    text: "URGENT: Your SBI bank account has been BLOCKED due to pending KYC verification. Update immediately within 24 hours at http://sbi-kyc-verify.top/login or your account will be permanently suspended. Share the OTP received to reactivate."
  },
  {
    name: "Genuine Bank Alert (LOW)",
    type: "message",
    source: "SMS",
    context: "Received after a UPI payment from my friend",
    text: "Dear Customer, your A/C ending 4921 has been credited with INR 1,500.00 on 14-Sep-26 via UPI reference 628192019482. Available balance is INR 24,180.50. Never share your OTP or PIN with anyone."
  },
  {
    name: "Part-time Job Fee Trap (HIGH)",
    type: "message",
    source: "WhatsApp",
    context: "Unsolicited WhatsApp message from international number",
    text: "Hello dear! You are selected for Amazon part time remote review job. Guaranteed daily income Rs 5,000. Transfer Rs 1,000 registration fee to claim your VIP login credentials immediately."
  },
  {
    name: "Spoofed Phishing Domain (HIGH)",
    type: "url",
    source: "Email",
    context: "Email with link to update NetBanking profile",
    text: "http://hdfc-netbanking-verify.top/login.php"
  },
  {
    name: "Ambiguous Payment Request (MEDIUM)",
    type: "message",
    source: "WhatsApp",
    context: "Received from a number not in my contact list",
    text: "Kindly transfer the pending processing fee today so we can proceed with your file."
  }
];

const DEFAULT_STEPS: InvestigationStep[] = [
  { id: "input_analysis", label: "Analyzing message context & intent", status: "pending" },
  { id: "entity_extraction", label: "Extracting financial entities, brands & handles", status: "pending" },
  { id: "fraud_indicators", label: "Scanning deterministic pattern rules & indicators", status: "pending" },
  { id: "classification", label: "Evaluating scam taxonomy classification", status: "pending" },
  { id: "url_analysis", label: "Safely inspecting URL strings & brand lookalikes", status: "pending" },
  { id: "evidence_retrieval", label: "Querying verified fraud intelligence knowledge base", status: "pending" },
  { id: "risk_engine", label: "Calculating deterministic risk score (0-100)", status: "pending" },
  { id: "confidence_engine", label: "Assessing multi-factor confidence rating", status: "pending" },
  { id: "recommendations", label: "Synthesizing tailored actionable safety guidance", status: "pending" },
  { id: "response_generator", label: "Compiling structured forensic dossier", status: "pending" }
];

export default function AnalyzePage() {
  const [inputType, setInputType] = useState<"message" | "url">("message");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("SMS");
  const [context, setContext] = useState("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<InvestigationStep[]>(DEFAULT_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sources = ["SMS", "WhatsApp", "Email", "UPI", "Website", "Phone", "Other"];

  const handleApplySample = (sample: typeof SAMPLE_SCENARIOS[0]) => {
    setInputType(sample.type as "message" | "url");
    setSource(sample.source);
    setContext(sample.context);
    setContent(sample.text);
    setResult(null);
    setErrorMsg(null);
  };

  const handleReset = () => {
    setContent("");
    setContext("");
    setResult(null);
    setErrorMsg(null);
    setIsAnalyzing(false);
    setSteps(DEFAULT_STEPS);
  };

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setErrorMsg("Please enter suspicious message content or a URL to analyze.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setResult(null);

    // Reset steps
    const newSteps: InvestigationStep[] = DEFAULT_STEPS.map((s) => ({ ...s, status: "pending" }));
    setSteps(newSteps);

    try {
      // Animate progress steps smoothly
      const totalSteps = newSteps.length;
      const stepInterval = 280; // ms per simulated step increment

      for (let i = 0; i < totalSteps - 1; i++) {
        setCurrentStepIndex(i);
        setSteps((prev) =>
          prev.map((step, idx) => {
            if (idx < i) return { ...step, status: "completed" };
            if (idx === i) return { ...step, status: "running" };
            return { ...step, status: "pending" };
          })
        );
        await new Promise((r) => setTimeout(r, stepInterval));
      }

      // Final step: invoke backend API (works on localhost & live deployed URL)
      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_type: inputType,
          content: content.trim(),
          source: source,
          context: context.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Investigation failed (HTTP ${response.status})`);
      }

      const data = await response.json();

      // Mark all steps completed
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === "url_analysis" && !data.result.url_analysis) {
            return { ...s, status: "skipped" };
          }
          return { ...s, status: "completed" };
        })
      );
      setCurrentStepIndex(totalSteps);
      setResult(data.result);
    } catch (err: unknown) {
      console.error(err);
      const errorText = err instanceof Error ? err.message : "Failed to reach FinSentry backend. Please ensure the backend is running on port 8000.";
      setErrorMsg(errorText);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Page Title & Intro */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Investigate a Threat
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Paste any suspicious communication or domain. Our LangGraph agent will dissect it safely.
        </p>
      </div>

      {/* Strict Privacy & Safety Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-amber-300">Safety Notice:</span>
          <p className="text-amber-200/90">
            Never paste active OTPs, passwords, ATM PINs, card CVVs, or full credit/debit card numbers.
            FinSentry AI will never request or retain sensitive personal authorization secrets.
          </p>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Quick Test Scenarios:
          </span>
          <span className="text-[11px] text-slate-500">Click any preset to auto-fill</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_SCENARIOS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleApplySample(sample)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 hover:text-sky-300 text-slate-300 transition-all active:scale-95"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Input Form */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Toggle: Message vs URL */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setInputType("message")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                inputType === "message"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Suspicious Message / Offer</span>
            </button>

            <button
              onClick={() => setInputType("url")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                inputType === "url"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Bare URL / Link</span>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Input</span>
          </button>
        </div>

        {/* Source Radio/Chip Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Communication Channel / Source
          </label>
          <div className="flex flex-wrap gap-2">
            {sources.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSource(src)}
                className={`text-xs px-3.5 py-1.5 rounded-lg border transition-all ${
                  source === src
                    ? "bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>

        {/* Content Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            {inputType === "message" ? "Suspicious Message Content" : "Suspicious Link / Domain"}
          </label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              inputType === "message"
                ? "Paste the exact message text here (SMS, WhatsApp text, email body, UPI collect notice, or job offer)..."
                : "Enter or paste the full URL (e.g. http://sbi-kyc-update.top/login)..."
            }
            className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-sky-500 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-mono"
          />
        </div>

        {/* Optional Context Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Optional Context (Where did this come from? How did you encounter it?)
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Received via WhatsApp from an unlisted number after posting an ad on OLX..."
            className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit CTA */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !content.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Search className="w-4 h-4" />
          <span>{isAnalyzing ? "Investigating Forensic Signals..." : "Analyze with FinSentry Agent"}</span>
        </button>
      </div>

      {/* Step-by-Step Investigation Loading State */}
      {isAnalyzing && (
        <InvestigationProgress 
          currentStepIndex={currentStepIndex}
          steps={steps}
        />
      )}

      {/* Structured Result Display */}
      {result && !isAnalyzing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">Investigation Complete</span>
            <span>ID: {result.analysis_id}</span>
          </div>
          <RiskResultCard result={result} />
        </div>
      )}
    </div>
  );
}
