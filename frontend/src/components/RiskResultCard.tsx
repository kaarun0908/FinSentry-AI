"use client";

import { useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Link2, 
  Bookmark, 
  Copy, 
  Check, 
  Info
} from "lucide-react";

export interface IndicatorItem {
  id: string;
  name: string;
  description: string;
  weight: number;
  category: string;
  detected_pattern?: string;
}

export interface UrlAnalysisResult {
  url: string;
  domain: string;
  registered_domain: string;
  tld: string;
  is_ip: boolean;
  is_shortener: boolean;
  is_suspicious_tld: boolean;
  punycode_detected: boolean;
  brand_mismatch_flag: boolean;
  spoofed_brand?: string;
  risk_signals: string[];
  safety_verdict: string;
}

export interface EvidenceItem {
  title: string;
  category: string;
  indicators: string[];
  guidance: string[];
  relevance_score: number;
}

export interface RecommendationItem {
  priority: string;
  action: string;
  rationale: string;
}

export interface AnalysisResultData {
  analysis_id: string;
  input_type: string;
  source: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  risk_score: number;
  category: string;
  secondary_categories: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH" | string;
  confidence_score: number;
  summary: string;
  indicators: IndicatorItem[];
  evidence: EvidenceItem[];
  recommendations: RecommendationItem[];
  url_analysis?: UrlAnalysisResult | null;
  created_at: string;
}

interface Props {
  result: AnalysisResultData;
  onSaveToggle?: (saved: boolean) => void;
  isSavedInitial?: boolean;
}

export default function RiskResultCard({ result, onSaveToggle, isSavedInitial = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [saveLoading, setSaveLoading] = useState(false);

  const getRiskBadgeConfig = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          barColor: "bg-rose-500",
          badgeBg: "bg-rose-500 text-white",
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          glow: "shadow-rose-500/20"
        };
      case "HIGH":
        return {
          bg: "bg-orange-500/10 border-orange-500/30 text-orange-400",
          barColor: "bg-orange-500",
          badgeBg: "bg-orange-500 text-white",
          icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
          glow: "shadow-orange-500/20"
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          barColor: "bg-amber-500",
          badgeBg: "bg-amber-500 text-slate-900",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          glow: "shadow-amber-500/20"
        };
      case "LOW":
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          barColor: "bg-emerald-500",
          badgeBg: "bg-emerald-500 text-slate-900",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          glow: "shadow-emerald-500/20"
        };
    }
  };

  const badgeConfig = getRiskBadgeConfig(result.risk_level);

  const handleCopy = () => {
    const text = `FinSentry AI Forensic Assessment:
Risk Level: ${result.risk_level} (Score: ${result.risk_score}/100)
Category: ${result.category}
Confidence: ${result.confidence}
Summary: ${result.summary}
Recommendations:
${result.recommendations.map((r, i) => `${i + 1}. ${r.action}`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToggle = async () => {
    try {
      setSaveLoading(true);
      const res = await fetch(`/api/v1/history/save/${result.analysis_id}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.is_saved);
        if (onSaveToggle) onSaveToggle(data.is_saved);
      }
    } catch (e) {
      console.error("Failed to toggle save", e);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with Risk Level, Category & Action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border ${badgeConfig.bg} shadow-lg ${badgeConfig.glow}`}>
            {badgeConfig.icon}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeConfig.badgeBg}`}>
                {result.risk_level} RISK
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                Source: {result.source || "Input"}
              </span>
              {result.category === "Uncertain" && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30">
                  Unverified / Ambiguous
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">
              {result.category}
            </h2>
          </div>
        </div>

        {/* Action buttons: Save & Copy */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isSaved
                ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-sky-400 text-sky-400" : ""}`} />
            <span>{isSaved ? "Saved in History" : "Save Report"}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Dossier"}</span>
          </button>
        </div>
      </div>

      {/* Dual Meters: Deterministic Risk Score & Multi-Factor Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Score Card */}
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Deterministic Risk Score</span>
              <span className="group relative cursor-pointer text-slate-500 hover:text-slate-300">
                <Info className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-2xl font-black text-white">{result.risk_score}<span className="text-xs text-slate-500 font-normal"> / 100</span></span>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${badgeConfig.barColor}`}
              style={{ width: `${Math.max(4, result.risk_score)}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 LOW (Safe)</span>
            <span>26 MEDIUM</span>
            <span>51 HIGH</span>
            <span>76 CRITICAL</span>
          </div>
        </div>

        {/* Confidence Card */}
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Forensic Confidence</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold">{result.confidence}</span>
            </div>
            <span className="text-2xl font-black text-white">{Math.round((result.confidence_score || 0.5) * 100)}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-sky-500 transition-all duration-700"
              style={{ width: `${Math.round((result.confidence_score || 0.5) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Computed from multi-signal indicator convergence & verified knowledge base match.
          </p>
        </div>
      </div>

      {/* Calibrated Forensic Narrative */}
      <div className="p-5 rounded-2xl bg-sky-950/20 border border-sky-500/20 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          Forensic Summary & Reasoning
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed">
          {result.summary}
        </p>
      </div>

      {/* Why Suspicious? Detected Fraud Indicators Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
          <span>Detected Threat Indicators ({result.indicators.length})</span>
          <span className="text-xs font-normal text-slate-400">Deterministic Weighted Signals</span>
        </h3>

        {result.indicators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.indicators.map((ind) => (
              <div 
                key={ind.id} 
                className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{ind.name}</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    +{ind.weight} pts
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{ind.description}</p>
                {ind.detected_pattern && (
                  <div className="text-[11px] font-mono text-sky-400/90 pt-1">
                    Matched pattern: <span className="underline decoration-dotted">{ind.detected_pattern}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No explicit malicious keywords or high-severity threat vectors were detected.</span>
          </div>
        )}
      </div>

      {/* Safe URL Forensic Inspection (if URL present) */}
      {result.url_analysis && (
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Safe String URL Forensics
              </h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              result.url_analysis.safety_verdict === "HIGH_RISK"
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                : result.url_analysis.safety_verdict === "SUSPICIOUS"
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            }`}>
              {result.url_analysis.safety_verdict}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Registered Domain</span>
              <span className="font-mono text-slate-200 font-medium truncate block">{result.url_analysis.registered_domain || "N/A"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Top-Level Domain (TLD)</span>
              <span className="font-mono text-slate-200 font-medium">.{result.url_analysis.tld || "unknown"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">URL Shortener</span>
              <span className={result.url_analysis.is_shortener ? "text-amber-400 font-bold" : "text-slate-400"}>
                {result.url_analysis.is_shortener ? "DETECTED" : "None"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Brand Spoofing</span>
              <span className={result.url_analysis.brand_mismatch_flag ? "text-rose-400 font-bold" : "text-slate-400"}>
                {result.url_analysis.brand_mismatch_flag ? `FLAGGED (${result.url_analysis.spoofed_brand})` : "None"}
              </span>
            </div>
          </div>

          {result.url_analysis.risk_signals.length > 0 && (
            <div className="pt-2 space-y-1">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">Identified URL Traps:</span>
              <ul className="space-y-1">
                {result.url_analysis.risk_signals.map((sig, i) => (
                  <li key={i} className="text-xs text-rose-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Supporting Evidence retrieved from Knowledge Base */}
      {result.evidence && result.evidence.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Corroborating Fraud Intelligence (RAG Grounded)
          </h3>
          <div className="space-y-2.5">
            {result.evidence.map((ev, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300">{ev.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Relevance: {Math.round(ev.relevance_score * 100)}%
                  </span>
                </div>
                {ev.guidance && ev.guidance.length > 0 && (
                  <ul className="space-y-1 text-xs text-slate-400">
                    {ev.guidance.slice(0, 2).map((g, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-sky-500 mt-0.5">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Recommended Protective Actions
        </h3>
        <div className="space-y-2.5">
          {result.recommendations.map((rec, i) => (
            <div 
              key={i} 
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5"
            >
              <div className="mt-0.5">
                {rec.priority === "IMMEDIATE" ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">{rec.action}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                    rec.priority === "IMMEDIATE" 
                      ? "bg-rose-500/20 text-rose-400" 
                      : rec.priority === "HIGH" 
                      ? "bg-orange-500/20 text-orange-400" 
                      : "bg-sky-500/20 text-sky-400"
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{rec.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
