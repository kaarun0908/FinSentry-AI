import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  CreditCard, 
  Building2, 
  TrendingUp, 
  Briefcase, 
  Link2, 
  Headphones, 
  Lock, 
  CheckCircle2, 
  Zap
} from "lucide-react";

export default function HomePage() {
  const threatTypes = [
    {
      title: "UPI & Payment Fraud",
      desc: "Fake refund promises, malicious QR codes, and fraudulent collect requests designed to drain accounts.",
      icon: <CreditCard className="w-6 h-6 text-sky-400" />,
      badge: "High Occurrence"
    },
    {
      title: "Bank & KYC Scams",
      desc: "Emergency alerts threatening bank account freeze, PAN card deactivation, or urgent biometric re-KYC.",
      icon: <Building2 className="w-6 h-6 text-indigo-400" />,
      badge: "Coercive Vector"
    },
    {
      title: "Investment & Task Scams",
      desc: "Lucrative promises like 'daily ₹5,000 income', crypto trading schemes, and Telegram video rating tasks.",
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      badge: "Financial Loss"
    },
    {
      title: "Job & Recruitment Fraud",
      desc: "Unsolicited WhatsApp job offers requiring upfront registration fees, security deposits, or typing tasks.",
      icon: <Briefcase className="w-6 h-6 text-amber-400" />,
      badge: "Targeting Youth"
    },
    {
      title: "Phishing & Lookalike URLs",
      desc: "Spoofed banking portals (e.g. sbi-kyc.top) and shortened links crafted to steal login credentials.",
      icon: <Link2 className="w-6 h-6 text-rose-400" />,
      badge: "Zero-Fetch Inspection"
    },
    {
      title: "Customer Support Impersonation",
      desc: "Bogus helpline numbers found via search engines urging victims to install AnyDesk or TeamViewer.",
      icon: <Headphones className="w-6 h-6 text-purple-400" />,
      badge: "Remote Access Traps"
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 pt-10 pb-12 overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold tracking-wide">
          <Zap className="w-3.5 h-3.5" />
          <span>LangGraph-Powered Autonomous Forensic Investigation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Think Before <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
            You Trust.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          FinSentry AI investigates suspicious messages, UPI payment demands, job offers, and web links through a deterministic multi-stage risk engine. Get actionable intelligence — not just a raw binary score.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/analyze"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <span>Analyze a Message</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/how-it-works"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-base border border-slate-700 transition-all"
          >
            <span>Explore Architecture</span>
          </Link>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" /> Never stores passwords or OTPs
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" /> String-only URL parsing (never visited)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Grounded RAG Knowledge Base
          </span>
        </div>
      </section>

      {/* Supported Threat Types Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Supported Financial Threat Vectors
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            FinSentry dissects deceptive tactics across every primary digital transaction channel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threatTypes.map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Structured Risk Assessment vs Binary Classifier */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 space-y-8">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
            Engineering Principles
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Why FinSentry Avoids &quot;Scam / Not Scam&quot; Labels
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Real-world scams exploit ambiguity, social engineering, and trust. A simplistic binary classifier creates a false sense of security or flags harmless messages. FinSentry decomposes risk into deterministic components:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white">1. Transparent Indicators</h4>
            <p className="text-xs text-slate-400">
              Shows exact weights and trigger phrases (e.g. Credential Request +25, Brand Mismatch +25) instead of a black-box answer.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white">2. Honest Uncertainty</h4>
            <p className="text-xs text-slate-400">
              When context is vague or evidence is sparse, the system explicitly reports &quot;Uncertain&quot; with low confidence, urging manual cross-checks.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white">3. Calibrated Protection</h4>
            <p className="text-xs text-slate-400">
              Provides direct emergency helplines (1930) and clear next steps to neutralize risks before money is transferred.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
