import Link from "next/link";
import { Lock, ExternalLink, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#070a12] text-slate-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strict Safety Guarantee Card */}
        <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/20 shadow-inner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  FinSentry Non-Negotiable Safety Promise
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  FinSentry AI will never ask for your passwords, OTPs, PINs, card CVVs, or full banking credentials.
                  All links are analyzed through string heuristics and never fetched or executed.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 whitespace-nowrap">
              <ShieldCheck className="w-4 h-4" />
              <span>Safe Investigation Sandbox</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">FinSentry AI</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 max-w-md leading-relaxed">
              Think Before You Trust. FinSentry AI conducts automated, multi-step forensic risk evaluations on suspicious SMS, WhatsApp, UPI payment requests, job offers, and phishing URLs to protect individuals and businesses against digital fraud.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Navigation</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-sky-400 transition-colors">Home</Link></li>
              <li><Link href="/analyze" className="hover:text-sky-400 transition-colors">Analyze Threat</Link></li>
              <li><Link href="/history" className="hover:text-sky-400 transition-colors">Saved History</Link></li>
              <li><Link href="/how-it-works" className="hover:text-sky-400 transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Emergency Helplines</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://cybercrime.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-300 hover:text-sky-400 transition-colors"
                >
                  <span>National Cyber Crime Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="text-amber-400 font-semibold">
                Financial Fraud Helpline: 1930
              </li>
              <li>
                <span className="text-slate-500">Golden Hour window: Report within 2 hours</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} FinSentry AI. Built for public cyber resilience.</p>
          <p className="italic">Calibrated probabilistic assessment — always cross-verify independently.</p>
        </div>
      </div>
    </footer>
  );
}
