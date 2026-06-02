/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  ArrowLeft,
  SlidersHorizontal,
  Layout,
  Film,
  Palette,
  Sparkles,
} from "lucide-react";
import { PresentationStyle } from "../../types";

interface StyleScreenProps {
  numAssets: number;
  isDemoPreloading: boolean;
  mergeDuplicates: boolean;
  setMergeDuplicates: (val: boolean) => void;
  onBack: () => void;
  onStyleSelect: (style: PresentationStyle) => void;
}

export function StyleScreen({
  numAssets,
  isDemoPreloading,
  mergeDuplicates,
  setMergeDuplicates,
  onBack,
  onStyleSelect,
}: StyleScreenProps) {
  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-6 flex flex-col justify-center py-16 md:py-24 z-10 animate-fade-in">
      <div className="flex items-center gap-4 mb-10 w-full text-left">
        <button
          onClick={onBack}
          className="p-3 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 group cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-455 transition-colors" />
        </button>
        <div>
          <p className="font-mono text-[9px] text-indigo-650 dark:text-indigo-400 tracking-[0.18em] uppercase font-bold">
            Source Connected ({numAssets} {numAssets === 1 ? 'Asset' : 'Assets'})
          </p>
          <h2 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-slate-900 dark:text-white mt-1">
            Choreograph Your Memories
          </h2>
        </div>
      </div>

      {/* Config options prior to load */}
      {!isDemoPreloading && (
        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] max-w-2xl mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl text-left backdrop-blur">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              Optimization Pipeline Engine
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-light">
              Combines geographic, visual, and temporal markers to collapse identical burst shots into pristine image group layers.
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={mergeDuplicates}
              onChange={(e) => setMergeDuplicates(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 bg-slate-50 dark:bg-slate-950 outline-none cursor-pointer"
            />
            <span className="text-xs font-mono tracking-wide text-slate-600 dark:text-slate-300">
              Clean Burst Stacks
            </span>
          </label>
        </div>
      )}

      {/* Display Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {/* Bento Grid Panel */}
        <div
          onClick={() => onStyleSelect("bento")}
          className="group cursor-pointer p-6 rounded-[32px] bg-white/70 dark:bg-[#0f172a]/85 border border-slate-200/90 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/60 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-indigo-500/5"
        >
          <div>
            <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_80%)] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-103 transition-transform overflow-hidden relative">
              <div className="grid grid-cols-3 gap-2 w-full p-4 h-full items-center">
                <div className="bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-200 dark:border-indigo-400/30 rounded-lg h-28 flex items-center justify-center">
                  <Layout className="w-6 h-6 text-indigo-600 dark:text-indigo-455" />
                </div>
                <div className="col-span-2 space-y-2">
                  <div className="bg-purple-100/60 dark:bg-purple-400/10 border border-purple-200/50 dark:border-purple-400/25 rounded-md h-12" />
                  <div className="bg-pink-100/60 dark:bg-pink-400/10 border border-pink-200/50 dark:border-pink-400/25 rounded-md h-14" />
                </div>
              </div>
            </div>
            <h3 className="text-base font-bold font-sans mb-2 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-305 transition-colors">
              Aesthetic Bento
            </h3>
            <p className="text-slate-500 dark:text-slate-450 text-xs font-light leading-relaxed">
              Asymmetric layouts grouped by chronological milestones. Beautiful masonry visual block grid inspired by premium portfolio displays.
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-6 block">
            Select & Open
          </span>
        </div>

        {/* Cinematic Filmstrip Panel */}
        <div
          onClick={() => onStyleSelect("cinematic")}
          className="group cursor-pointer p-6 rounded-[32px] bg-white/70 dark:bg-[#0f172a]/85 border border-slate-200/90 dark:border-slate-800/80 hover:border-purple-500/50 dark:hover:border-purple-500/60 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-purple-500/5"
        >
          <div>
            <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_80%)] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-103 transition-transform overflow-hidden relative">
              <div className="flex flex-col gap-2 w-full p-4 justify-center items-center h-full">
                <div className="w-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-400/30 rounded-xl py-3 px-4 flex items-center gap-3">
                  <Film className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
                  <div className="h-1.5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="w-11/12 bg-slate-100 dark:bg-slate-900/80 h-10 rounded-lg border border-slate-200 dark:border-slate-800/60" />
              </div>
            </div>
            <h3 className="text-base font-bold font-sans mb-2 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-305 transition-colors">
              Cinematic Spotlight
            </h3>
            <p className="text-slate-500 dark:text-slate-450 text-xs font-light leading-relaxed">
              Deep focus narrative scroll with gigantic serif typography, story descriptions, and metadata sidebar information cards.
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mt-6 block">
            Select & Open
          </span>
        </div>

        {/* Minimal Museum Panel */}
        <div
          onClick={() => onStyleSelect("museum")}
          className="group cursor-pointer p-6 rounded-[32px] bg-white/70 dark:bg-[#0f172a]/85 border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/60 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-emerald-500/5"
        >
          <div>
            <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_80%)] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-103 transition-transform overflow-hidden relative">
              <div className="p-4 flex h-full w-full items-center justify-center">
                <div className="border-[14px] border-slate-100 dark:border-slate-800 bg-white dark:bg-[#020617] p-2 shadow-md dark:shadow-2xl flex flex-col items-center rounded-lg">
                  <div className="w-20 h-14 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-250 dark:border-emerald-500/20 rounded flex items-center justify-center">
                    <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="w-8 h-1 bg-slate-200 dark:bg-slate-800 mt-[6px] rounded-full" />
                </div>
              </div>
            </div>
            <h3 className="text-base font-bold font-sans mb-2 text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-305 transition-colors">
              Museum Exhibit
            </h3>
            <p className="text-slate-500 dark:text-slate-450 text-xs font-light leading-relaxed">
              Timeless editorial space framed on wide artboards. Grayscale-to-color hovered canvases with integrated master color palette nodes.
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-6 block">
            Select & Open
          </span>
        </div>

        {/* Space-Time Carousel Panel */}
        <div
          onClick={() => onStyleSelect("grid")}
          className="group cursor-pointer p-6 rounded-[32px] bg-white/70 dark:bg-[#0f172a]/85 border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/60 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-amber-500/5"
        >
          <div>
            <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,transparent_80%)] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-103 transition-transform overflow-hidden relative">
              <div className="p-4 flex h-full w-full gap-2 items-center justify-center">
                <div className="w-12 h-20 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md rotate-[-8deg] shrink-0" />
                <div className="w-16 h-24 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-400/45 rounded-lg flex items-center justify-center z-10 shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div className="w-12 h-20 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md rotate-[8deg] shrink-0" />
              </div>
            </div>
            <h3 className="text-base font-bold font-sans mb-2 text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-305 transition-colors">
              Space-Time Track
            </h3>
            <p className="text-slate-500 dark:text-slate-450 text-xs font-light leading-relaxed">
              Sequential list stacked continuously with elegant, detailed clock hours, custom content indicators, and visual descriptions.
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mt-6 block">
            Select & Open
          </span>
        </div>
      </div>
    </div>
  );
}
