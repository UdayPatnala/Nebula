/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import { PipelineProgress } from "../../types";

interface ProcessingScreenProps {
  progress: PipelineProgress;
  sourceType: "folder" | "files" | "demo";
}

export function ProcessingScreen({ progress, sourceType }: ProcessingScreenProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center items-center py-20 z-10 animate-fade-in">
      {/* Constellation Core Scanning Ring */}
      <div className="relative w-44 h-44 mb-16 flex items-center justify-center">
        {/* Pulsing visual circles */}
        <div
          className={`absolute inset-0 border border-dashed rounded-full animate-[spin_8s_linear_infinite] ${
            progress.phase === "analyze" ? "border-purple-500/40" : "border-indigo-500/35"
          }`}
        />
        <div
          className={`absolute inset-4 border border-dashed rounded-full animate-[spin_5s_linear_infinite_reverse] ${
            progress.phase === "analyze" ? "border-indigo-500/40" : "border-purple-500/25"
          }`}
        />
        <div className="absolute inset-8 bg-[#0f172a] rounded-full flex items-center justify-center shadow-2xl border border-slate-800 animate-pulse">
          {progress.phase === "analyze" ? (
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
          ) : (
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          )}
        </div>

        {/* Percentage Badge */}
        <div className="absolute -bottom-2 bg-[#0a0f1d] border border-slate-800 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-300">
          {percentage}%
        </div>
      </div>

      <div className="max-w-xl w-full text-center space-y-6">
        <h2 className="text-2xl font-bold font-display tracking-tight text-white uppercase tracking-wider">
          Neural ETL Pipeline Running
        </h2>
        <p className="text-xs font-mono text-indigo-400 tracking-[0.2em] uppercase">
          Phase: {progress.phase.toUpperCase()} (STAGING & PERSISTENCE)
        </p>

        {/* Simulated Live Terminal View */}
        <div className="bg-[#020617] p-6 rounded-[32px] border border-slate-800/80 w-full text-left font-mono text-xs text-slate-400 leading-relaxed shadow-inner overflow-hidden relative">
          <div className="absolute top-2 right-4 flex gap-1">
            <span className="w-2 h-2 bg-red-400/60 rounded-full" />
            <span className="w-2 h-2 bg-yellow-400/60 rounded-full" />
            <span className="w-2 h-2 bg-green-400/60 rounded-full" />
          </div>

          <div className="space-y-2 select-none">
            <p className="text-slate-500">&gt; INITIALIZING PIPELINE INGESTION_MODE</p>
            <p className="text-slate-500">&gt; DETECTED RESOURCE: {sourceType.toUpperCase()}</p>

            {progress.phase === "extract" && (
              <p className="text-indigo-455 animate-pulse">
                &gt; EX_STAGE: Recursively indexing binary streams from device storage...
              </p>
            )}

            {progress.phase === "transform" && (
              <p className="text-purple-400 animate-pulse">
                &gt; TR_STAGE: Extracting modification tags & sorting by Hour timestamp...
              </p>
            )}

            {progress.phase === "analyze" && (
              <>
                <p className="text-yellow-400 animate-pulse">
                  &gt; AI_STAGE: Downsampling visual stream for neural interface compatibility...
                </p>
                <p className="text-slate-300">
                  &gt; AI_STAGE: Running scene interrogation on Gemini endpoints...
                </p>
              </>
            )}

            {progress.phase === "load" && (
              <p className="text-emerald-400">
                &gt; LD_STAGE: Saving visual coordinates into local IndexedDB cache schema...
              </p>
            )}

            {progress.phase === "complete" && (
              <p className="text-emerald-400 font-bold">
                &gt; PIPELINE READY: Timeline maps synchronized successfully.
              </p>
            )}

            <div className="pt-2 border-t border-slate-800 text-slate-500 text-[10px] mt-2 flex justify-between items-center">
              <span>Task: {progress.current} / {progress.total} assets</span>
              <span className="text-indigo-400 animate-pulse max-w-[200px] truncate">
                {progress.currentName || "Waiting for thread..."}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Informational Speed Explainer */}
        <div className="p-4 bg-[#0f172a]/20 rounded-2xl border border-slate-800 flex gap-3 text-left max-w-lg mx-auto">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-[2px]" />
          <div className="space-y-1">
            <p className="text-xs text-slate-350 font-semibold text-slate-300">How is this so fast?</p>
            <p className="text-[11px] text-slate-500 font-light leading-relaxed">
              Nebula compresses images on-the-fly inside microsecond Web Worker canvases and persists analyzed results inside local browser SQLite-style IndexedDB caches. Subsequent scans are instantaneous.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
