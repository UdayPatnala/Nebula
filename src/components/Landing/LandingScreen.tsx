/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User as FirebaseUser } from "firebase/auth";
import { FolderOpen, Camera, Sparkles, LogIn, Cloud, Compass } from "lucide-react";
import { AppIcon } from "../AppIcon";
import { ThemeToggle } from "../ThemeToggle";

interface LandingScreenProps {
  currentUser: FirebaseUser | null;
  triggerFolderPicker: () => Promise<void>;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  launchDemoConstellation: () => void;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  landingRef: React.RefObject<HTMLDivElement | null>;
  handleMouseMove: (e: React.MouseEvent) => void;
}

export function LandingScreen({
  currentUser,
  triggerFolderPicker,
  handleFileInputChange,
  launchDemoConstellation,
  loginWithGoogle,
  logoutUser,
  landingRef,
  handleMouseMove,
}: LandingScreenProps) {
  const fallbackFolderInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      ref={landingRef}
      onMouseMove={handleMouseMove}
      className="relative flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col justify-center items-center py-16 md:py-24 z-10 animate-fade-in"
    >
      {/* Universal Directory Picker Fallback Input (Pillar 9) */}
      <input
        type="file"
        ref={fallbackFolderInputRef}
        className="hidden"
        /* @ts-ignore */
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileInputChange}
      />

      {/* Top floating header panel */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3 max-w-full">
        {/* Dynamic Theme Switcher Toggle */}
        <ThemeToggle />

        {/* Firebase Auth Landing controls */}
        {currentUser ? (
          <div className="px-3.5 py-1.5 bg-white/80 dark:bg-[#0d1527]/85 border border-slate-200 dark:border-emerald-500/30 text-slate-800 dark:text-emerald-400 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-2 shadow-sm dark:shadow-lg backdrop-blur">
            <Cloud className="w-3.5 h-3.5 text-indigo-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate max-w-[100px] md:max-w-xs">
              {currentUser.displayName || currentUser.email}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={logoutUser}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-rose-50 dark:hover:bg-red-950/65 hover:border-rose-200 dark:hover:border-red-500/40 hover:text-rose-600 dark:hover:text-red-300 transition-colors cursor-pointer text-[10px]"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-transparent dark:border-slate-800 dark:hover:border-indigo-500/30 dark:text-indigo-300 rounded-full text-xs font-mono font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg backdrop-blur cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-white dark:text-indigo-400 shrink-0" />
            <span>Connect Firebase</span>
          </button>
        )}
      </div>

      {/* Constellation Particle Logo Sphere */}
      <div className="relative mb-6 group cursor-pointer select-none">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-15 dark:opacity-35 group-hover:opacity-50 duration-700 transition-opacity" />
        <div className="relative w-28 h-28 bg-[#ffffff]/90 dark:bg-[#0f172a]/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl flex items-center justify-center p-[8px] shadow-lg dark:shadow-2xl transition-transform duration-500 hover:scale-[1.05] hover:rotate-3">
          <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-800/65">
            <AppIcon className="w-16 h-16" />
          </div>
        </div>
      </div>

      <h1 className="font-display font-medium text-5xl md:text-7xl tracking-tight text-center mb-3 text-slate-950 dark:text-white">
        Nebula
      </h1>
      <p className="font-mono text-indigo-650 dark:text-indigo-400 uppercase tracking-[0.25em] text-[10px] md:text-xs font-semibold mb-8 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-ping" />
        Neural Memory Orchestrator
      </p>
      
      <p className="text-slate-600 dark:text-slate-400 max-w-xl text-center text-sm md:text-base mb-12 font-sans font-light leading-relaxed">
        Transform local photo folders into structured, elegant memory timelines. Instantly organize visual assets, group burst shots, search by AI concept classifications, and explore your life through a poetic presentation display.
      </p>

      {/* Core Select Buttons - Premium Museum styled cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full mb-16">
        {/* Primary Option: Folder Ingestion */}
        <div
          onClick={() => {
            if ("showDirectoryPicker" in window) {
              triggerFolderPicker();
            } else {
              fallbackFolderInputRef.current?.click();
            }
          }}
          className="group relative cursor-pointer p-6 rounded-[32px] bg-white/70 dark:bg-[#0f172a]/80 border border-slate-200/90 dark:border-slate-803/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/60 transition-all duration-300 shadow-md dark:shadow-xl flex flex-col items-start hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-indigo-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-400/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
            <FolderOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold font-sans mb-2 text-slate-900 dark:text-white transition-colors">
            Ingest Local Directory
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-light leading-relaxed">
            Scan directories recursively. Select cameras, backup drives, or local folders directly to organize.
          </p>
        </div>

        {/* Secondary Option: Select Multiple Photos */}
        <label className="group relative cursor-pointer p-6 rounded-[32px] bg-white/70 dark:bg-[#0f172a]/80 border border-slate-200/90 dark:border-slate-803/80 hover:border-purple-500/50 dark:hover:border-purple-500/60 transition-all duration-300 shadow-md dark:shadow-xl flex flex-col items-start hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-purple-500/10">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-400/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold font-sans mb-2 text-slate-900 dark:text-white transition-colors">
            Select Multiple Photos
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-light leading-relaxed">
            Directly select specific images, burst ranges, or portrait assets from your explorer to build.
          </p>
        </label>

        {/* Cosmic Demo Constellation */}
        <div
          onClick={launchDemoConstellation}
          className="group relative cursor-pointer p-6 rounded-[32px] bg-white/70 dark:bg-[#0f172a]/80 border border-slate-200/90 dark:border-slate-803/80 hover:border-amber-500/50 dark:hover:border-amber-500/60 transition-all duration-300 shadow-md dark:shadow-xl flex flex-col items-start hover:-translate-y-1 md:col-span-2 lg:col-span-1 hover:shadow-lg dark:hover:shadow-amber-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 flex items-center justify-center text-amber-700 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
            <Compass className="w-5 h-5 text-amber-600 dark:text-amber-500 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <h3 className="text-base font-bold font-sans mb-2 text-slate-900 dark:text-white transition-colors">
            Explore Demo Constellation
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-light leading-relaxed">
            Begin instantly. Loads ready-made high-resolution nature and family portraits with zero configuration.
          </p>
        </div>
      </div>

      {/* Dynamic Floating Photo Grid Showcase - Styled as an art exhibition board */}
      <div className="w-full max-w-5xl mt-4">
        <p className="text-center font-mono text-[9px] text-slate-400 dark:text-slate-500 tracking-[0.25em] uppercase mb-5">
          Curated Exhibition Glimpses
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-[#0f172a]/25 backdrop-blur shadow-sm dark:shadow-none">
          <div className="relative h-44 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop"
              alt="Dynamic Peak"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 dark:opacity-75"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350">
              Nature
            </div>
          </div>
          <div className="relative h-44 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop"
              alt="Neon Alley"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 dark:opacity-75"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350">
              Cityscape
            </div>
          </div>
          <div className="relative h-44 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&auto=format&fit=crop"
              alt="Paris Street"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 dark:opacity-75"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350">
              Food / Travel
            </div>
          </div>
          <div className="relative h-44 rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop"
              alt="Portrait"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 dark:opacity-75"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350">
              Portrait
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
