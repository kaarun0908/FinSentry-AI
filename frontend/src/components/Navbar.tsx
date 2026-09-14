"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Search, Lock } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Analyze", href: "/analyze" },
    { name: "History", href: "/history" },
    { name: "How It Works", href: "/how-it-works" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090d16]/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                FinSentry<span className="text-sky-400">.AI</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Financial Risk Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Lock className="w-3 h-3" />
              <span>Zero-Credential Zone</span>
            </div>
            <Link
              href="/analyze"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>Analyze Message</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
