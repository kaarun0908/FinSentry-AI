import Link from "next/link";
import { 
  Search, 
  Binary, 
  Calculator, 
  AlertOctagon, 
  ArrowRight, 
  CheckCircle2, 
  Server
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Analyze",
      subtitle: "Contextual Deconstruction & Intent",
      desc: "FinSentry decomposes the input into communication intent, emotional urgency triggers, institutional keywords, and requested actions.",
      details: ["Identifies brand mentions (SBI, HDFC, Amazon, etc.)", "Detects urgency markers ('within 24h', 'immediate block')", "Extracts currency amounts, UPI handles, and phone numbers"],
      icon: <Search className="w-6 h-6 text-sky-400" />
    },
    {
      num: "02",
      title: "Investigate",
      subtitle: "Safe String URL & Domain Forensics",
      desc: "Links are evaluated strictly via string heuristics. FinSentry NEVER fetches or visits suspicious URLs, preventing malicious script execution.",
      details: ["Compares domain to official whitelist (flags lookalikes like hdfc-netbanking.top)", "Identifies shorteners (bit.ly, tinyurl) used to obscure destinations", "Detects punycode (xn--) and suspicious TLDs (.xyz, .top, .rest)"],
      icon: <Binary className="w-6 h-6 text-indigo-400" />
    },
    {
      num: "03",
      title: "Verify",
      subtitle: "Grounded RAG Knowledge Base Retrieval",
      desc: "The context is cross-referenced against FinSentry's specialized financial fraud intelligence base covering 8 major cyber threat taxonomies.",
      details: ["Retrieves corroborated scam modus operandi", "Extracts regulatory guidelines (RBI, NPCI, SEBI)", "Grounds forensic explanations with verified safety patterns"],
      icon: <Server className="w-6 h-6 text-emerald-400" />
    },
    {
      num: "04",
      title: "Assess",
      subtitle: "Deterministic Risk Engine & Confidence Calibration",
      desc: "Unlike standard black-box AI tools, risk scores (0-100) are computed mathematically by a deterministic scoring engine — NOT by an LLM.",
      details: ["Credential demand: +25 pts | Suspicious URL: +20 pts", "Threat / Pressure: +15 pts | Payment demand: +20 pts", "Multi-factor confidence rating derived from signal convergence"],
      icon: <Calculator className="w-6 h-6 text-amber-400" />
    },
    {
      num: "05",
      title: "Recommend",
      subtitle: "Actionable Defense Guidance & Reporting",
      desc: "Delivers concrete, step-by-step protective instructions and immediate reporting channels (helpline 1930) before funds are compromised.",
      details: ["Immediate response protocol (freeze debit card, decline collect request)", "Calibrated language (never makes false claims of 100% certainty)", "National Cyber Crime reporting portal links"],
      icon: <AlertOctagon className="w-6 h-6 text-rose-400" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
          Agentic Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How FinSentry AI Operates
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From the moment you paste content to the final calibrated safety report, FinSentry executes a 5-stage deterministic forensic pipeline.
        </p>
      </div>

      {/* 5-Step Process */}
      <div className="space-y-6">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 hover:border-slate-700 transition-all group"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {s.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-400">{s.num}</span>
                    <h3 className="text-xl font-black text-white">{s.title}</h3>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-400 mt-0.5">{s.subtitle}</h4>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {s.desc}
            </p>

            <div className="pt-2 border-t border-slate-800/60">
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400">
                {s.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Manifesto Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/20 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">
          Our Non-Negotiable Safety Guarantee
        </h3>
        <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          FinSentry was created to protect consumers, not expose them. We never execute or visit links, never ask for credentials, and never claim absolute certainty where risks are nuanced.
        </p>
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
        >
          <span>Try an Investigation</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
