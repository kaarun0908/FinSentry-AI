"use client";

import { CheckCircle2, Loader2, Circle } from "lucide-react";

export interface InvestigationStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "skipped";
  detail?: string;
}

interface Props {
  currentStepIndex: number;
  steps: InvestigationStep[];
}

export default function InvestigationProgress({ currentStepIndex, steps }: Props) {
  return (
    <div className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background glow banner */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping absolute" />
            <div className="w-3 h-3 rounded-full bg-sky-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              FinSentry Agent Investigating
            </h3>
            <p className="text-xs text-slate-400">
              Executing multi-step LangGraph forensic pipeline
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
          Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
        </div>
      </div>

      <div className="space-y-3.5">
        {steps.map((step) => {
          const isDone = step.status === "completed";
          const isRunning = step.status === "running";
          const isSkipped = step.status === "skipped";
          const isPending = step.status === "pending";

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3.5 p-2.5 rounded-xl transition-all ${
                isRunning
                  ? "bg-sky-500/10 border border-sky-500/30 text-white"
                  : isDone
                  ? "text-slate-300"
                  : isSkipped
                  ? "text-slate-500 opacity-60"
                  : "text-slate-500"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isRunning && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
                {isSkipped && <span className="text-xs font-mono text-slate-500">⊘</span>}
                {isPending && <Circle className="w-4 h-4 text-slate-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isRunning ? "text-sky-300" : isDone ? "text-slate-200" : "text-slate-500"}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    {isRunning && <span className="text-sky-400 font-bold">Investigating...</span>}
                    {isDone && <span className="text-emerald-400">Verified</span>}
                    {isSkipped && <span className="text-slate-500">Skipped (No link)</span>}
                    {isPending && <span className="text-slate-600">Queued</span>}
                  </span>
                </div>
                {step.detail && (
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
