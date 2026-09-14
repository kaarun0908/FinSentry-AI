"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bookmark, 
  History, 
  ArrowRight, 
  Search, 
  Clock
} from "lucide-react";
import RiskResultCard, { AnalysisResultData } from "@/components/RiskResultCard";

interface HistoryRecord {
  analysis_id: string;
  input_type: string;
  source: string;
  risk_level: string;
  risk_score: number;
  category: string;
  confidence: string;
  summary: string;
  created_at: string;
  is_saved: boolean;
}

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResultData | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = async (analysis_id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/analysis/${analysis_id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAnalysis(data.result);
      }
    } catch (err) {
      console.error("Failed to fetch analysis detail", err);
    }
  };

  const filteredItems = historyItems.filter((item) => {
    if (filterLevel === "ALL") return true;
    return item.risk_level === filterLevel;
  });

  const getBadgeClass = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "LOW":
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-sky-400" />
            <span>Saved Investigation Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Privacy-first saved forensics dossier archive.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterLevel === lvl
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-mono">
          Loading investigation archive...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Saved Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Analyses are opt-in and not logged automatically to protect user privacy. Run an investigation and click &quot;Save Report&quot;.
            </p>
          </div>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Analyze a Threat Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.analysis_id}
              onClick={() => handleSelectRecord(item.analysis_id)}
              className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer hover:scale-[1.01] space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getBadgeClass(item.risk_level)}`}>
                    {item.risk_level} ({item.risk_score}/100)
                  </span>
                  <span className="text-[11px] text-slate-400">{item.category}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {item.summary}
              </p>

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/60">
                <span>Source: {item.source}</span>
                <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                  View Full Dossier <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Selected Analysis Modal / View */}
      {selectedAnalysis && (
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Full Investigation Dossier</h2>
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800"
            >
              Close Dossier
            </button>
          </div>
          <RiskResultCard result={selectedAnalysis} isSavedInitial={true} />
        </div>
      )}
    </div>
  );
}
