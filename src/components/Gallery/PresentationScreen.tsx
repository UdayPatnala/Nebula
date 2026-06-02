/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import {
  Sparkles,
  Layers,
  Users,
  LogOut,
  ArrowLeft,
  Cloud,
  Loader2,
  Check,
  UploadCloud,
  CloudOff,
  LogIn,
  Layout,
  Film,
  Palette,
  Grid,
  Download,
  Calendar,
  MapPin,
  X,
  Camera,
  Share2,
  Copy,
} from "lucide-react";
import { ImageItem, PresentationStyle } from "../../types";
import { AppIcon } from "../AppIcon";
import { ThemeToggle } from "../ThemeToggle";
import { createSharedGallery } from "../../lib/shareUtils";

interface PresentationScreenProps {
  currentUser: FirebaseUser | null;
  images: ImageItem[];
  selectedStyle: PresentationStyle;
  selectedImage: ImageItem | null;
  activeFilterCategory: string;
  activeFilterLocation: string;
  activeFilterDate: string;
  showDuplicates: boolean;
  serverOnline: boolean | null;
  syncStatus: "idle" | "syncing" | "success" | "error";
  isDownloadingZip: boolean;
  mergeDuplicates: boolean;
  selectedFiles: File[];

  setStage: (val: "landing" | "style" | "processing" | "presentation") => void;
  setSelectedStyle: (val: PresentationStyle) => void;
  setSelectedImage: (img: ImageItem | null) => void;
  setFilterCategory: (cat: string) => void;
  setFilterLocation: (loc: string) => void;
  setFilterDate: (date: string) => void;
  setShowDuplicates: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  handleDownloadTimelineZip: (filtered: ImageItem[]) => Promise<void>;
  handleManualSync: () => Promise<void>;
}

export function PresentationScreen({
  currentUser,
  images,
  selectedStyle,
  selectedImage,
  activeFilterCategory,
  activeFilterLocation,
  activeFilterDate,
  showDuplicates,
  serverOnline,
  syncStatus,
  isDownloadingZip,
  mergeDuplicates,
  selectedFiles,

  setStage,
  setSelectedStyle,
  setSelectedImage,
  setFilterCategory,
  setFilterLocation,
  setFilterDate,
  setShowDuplicates,
  handleLogout,
  handleGoogleLogin,
  handleDownloadTimelineZip,
  handleManualSync,
}: PresentationScreenProps) {
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [shareProgress, setShareProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: "",
  });
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleShareTimeline = async () => {
    setShareStatus("loading");
    setCopiedLink(false);
    try {
      const galleryId = await createSharedGallery(images, selectedStyle, selectedFiles, (curr, tot, msg) => {
        setShareProgress({ current: curr, total: tot, message: msg });
      });
      const finalUrl = `${window.location.origin}/gallery/${galleryId}`;
      setSharedUrl(finalUrl);
      setShareStatus("success");
    } catch (err: any) {
      console.error(err);
      setShareProgress({ current: 0, total: 0, message: err.message || "Failed to create shared link." });
      setShareStatus("error");
    }
  };

  // Derive categories list from raw images dynamically
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    images.forEach((img) => list.add(img.category));
    return ["All", ...Array.from(list)];
  }, [images]);

  // Derive final filtered list matching select filters
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const categoryMatch = activeFilterCategory === "All" || img.category === activeFilterCategory;
      const locationMatch = activeFilterLocation === "All" || img.location === activeFilterLocation;
      const dateMatch = activeFilterDate === "All" || img.dateStr === activeFilterDate;
      const duplicateMatch = showDuplicates ? true : !img.isDuplicateOfId;
      return categoryMatch && locationMatch && dateMatch && duplicateMatch;
    });
  }, [images, activeFilterCategory, activeFilterLocation, activeFilterDate, showDuplicates]);

  return (
    <div className="flex-1 w-full flex flex-col lg:flex-row z-10 transition-all duration-1000 ease-out min-h-screen">
      {/* LEFT SIDEBAR NAVIGATION: Premium gallery sidebar */}
      <aside className="hidden lg:flex lg:w-80 bg-slate-50 dark:bg-[#0b111e]/90 border-r border-slate-200/80 dark:border-[#1e293b] flex-col p-6 shrink-0 relative text-left select-none transition-colors duration-300">
        {/* Logo area with brand name and custom AppIcon svg */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-[#1e293b] rounded-xl flex items-center justify-center shadow-sm p-1.5 shrink-0">
            <AppIcon className="w-full h-full text-indigo-650 dark:text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display font-medium tracking-wider text-slate-900 dark:text-white leading-none">Nebula</span>
            <span className="text-[8px] font-mono text-slate-400 dark:text-indigo-455 font-bold uppercase tracking-widest mt-0.5">
              Memory Studio
            </span>
          </div>
        </div>

        {/* Navigation title */}
        <h5 className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-4">
          Memory Categories
        </h5>

        {/* Tag Selection Lists fully matching Sidebar design */}
        <div className="space-y-1 overflow-y-auto max-h-[35vh] pr-1">
          {categoriesList.map((cat) => {
            const count = images.filter(
              (img) => (cat === "All" || img.category === cat) && (showDuplicates ? true : !img.isDuplicateOfId)
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-xl text-left text-xs font-medium transition-all duration-200 flex items-center justify-between w-full cursor-pointer border ${
                  activeFilterCategory === cat
                    ? "bg-indigo-50/50 dark:bg-[#1e1b4b]/40 text-indigo-600 dark:text-indigo-305 border-indigo-200/70 dark:border-indigo-500/10 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeFilterCategory === cat ? "bg-indigo-600 dark:bg-indigo-400 animate-pulse" : "bg-slate-350 dark:bg-slate-600"
                    }`}
                  />
                  {cat}
                </span>
                <span
                  className={`font-mono text-[9px] px-1.5 py-[0.5px] rounded border ${
                    activeFilterCategory === cat
                      ? "bg-indigo-100/50 dark:bg-[#131032] border-indigo-200 dark:border-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                      : "bg-slate-200/50 dark:bg-[#020617] border-slate-300/30 dark:border-[#1e293b] text-slate-500"
                  }`}
                >
                  {count < 10 ? `0${count}` : count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="my-6 border-b border-slate-200 dark:border-[#1e293b]/70" />

        {/* ETL Monitor Status Section */}
        <div className="bg-white dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-200 dark:border-[#1e293b] space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-[9px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500">
            <span>ETL PIPELINE STATUS</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block animate-ping" />
              STABLE
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-300">Synchronized State</p>
            <p className="text-[10.5px] text-slate-500">Local Cache DB: Indexed & Secure</p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/40 rounded-full h-[5px] overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Dynamic visual statistics grids inside sidebar */}
        <div className="grid grid-cols-2 gap-2 text-left my-4">
          <div className="bg-white/50 dark:bg-[#0f172a]/60 border border-slate-200 dark:border-[#1e293b] p-3 rounded-xl shadow-sm dark:shadow-none">
            <p className="text-[8.5px] font-mono uppercase text-slate-450 dark:text-slate-500">Stacks Collapsed</p>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-405 flex items-center gap-1 mt-1 font-mono">
              <Layers className="w-3 h-3 shrink-0" />
              {images.reduce((acc, img) => acc + (img.duplicateIds ? img.duplicateIds.length : 0), 0)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-[#0f172a]/60 border border-slate-200 dark:border-[#1e293b] p-3 rounded-xl shadow-sm dark:shadow-none">
            <p className="text-[8.5px] font-mono uppercase text-slate-450 dark:text-slate-500">Total Actors</p>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-405 flex items-center gap-1 mt-1 font-mono">
              <Users className="w-3 h-3 shrink-0" />
              {images.reduce((acc, img) => acc + (img.peopleCount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Dynamic user profile badge synced to Firebase Auth */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-[#1e293b]/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={
                currentUser?.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                  currentUser?.displayName || "Felix"
                }`
              }
              className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-705 shadow-sm shrink-0 focus-visible:outline-none"
              alt="User Avatar"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate leading-tight">
                {currentUser?.displayName || "Alex Sterling"}
              </p>
              <p className="text-[8px] text-indigo-650 dark:text-indigo-405 font-bold uppercase tracking-wider mt-0.5 whitespace-nowrap">
                {currentUser ? "Firebase Synced" : "Local Database"}
              </p>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-655 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN COLUMN RIGHT */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto w-full">
        {/* Sticky Modern Presentation Header */}
        <header className="sticky top-0 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#1e293b] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-40 text-left">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStage("landing")}
              className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-[#1e293b] shadow-sm transition-all active:scale-95 group flex items-center justify-center gap-2 cursor-pointer"
              title="Exit Gallery"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-xs font-semibold">Exit</span>
            </button>
            <div>
              <h2 className="text-base font-display font-medium leading-tight flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-wider">
                Memory Catalog
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping inline-block" />
              </h2>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                <span>Chronological Sort</span>
                <span>•</span>
                <span>
                  {images.filter((x) => (showDuplicates ? true : !x.isDuplicateOfId)).length}{" "}
                  unique memories
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Synchronization Panel & Theme Toggle Wrapper */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Inline Theme Changer */}
            <ThemeToggle />

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-[#1e293b]/70 rounded-2xl text-xs max-w-full shrink-0">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[10.5px]">
                    <Cloud className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline-block">Backup Active</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    onClick={handleManualSync}
                    disabled={syncStatus === "syncing" || images.length === 0}
                    className="text-slate-700 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-white transition-all font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[10.5px]"
                  >
                    {syncStatus === "syncing" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
                        <span>Syncing...</span>
                      </>
                    ) : syncStatus === "success" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500">Synced</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span>Sync Now</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <CloudOff className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-mono text-[10px] hidden sm:inline-block">
                    No Cloud Backup
                  </span>
                  <button
                    onClick={handleGoogleLogin}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-[#1e1b4b] hover:bg-slate-100 dark:hover:bg-slate-800 border border-indigo-100 dark:border-slate-800 text-indigo-650 dark:text-indigo-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3 h-3 shrink-0" />
                    <span>Connect</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Visual filtering parameters / Style Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter (Mobile Only visible scroll bar, already shown on desktop via sidebar) */}
            <div className="flex lg:hidden items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800 rounded-xl max-w-full overflow-x-auto shrink-0">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeFilterCategory === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Duplicate Burst merge Stack toggler */}
            {mergeDuplicates && (
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  showDuplicates
                    ? "bg-indigo-50/70 border-indigo-200 text-indigo-650 dark:bg-[#1e1b4b]/40 dark:border-indigo-500/40 dark:text-indigo-400"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{showDuplicates ? "Viewing Duplicates" : "Burst Grouped"}</span>
              </button>
            )}

            {/* Style switcher presets */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-[#1e293b] rounded-xl shrink-0 select-none">
              <button
                onClick={() => setSelectedStyle("bento")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  selectedStyle === "bento"
                    ? "bg-white dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-slate-250 dark:border-indigo-400/20 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
                title="Bento Exhibition Grid"
              >
                <Layout className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedStyle("cinematic")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  selectedStyle === "cinematic"
                    ? "bg-white dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-slate-250 dark:border-purple-400/20 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
                title="Cinematic Filmstrip"
              >
                <Film className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedStyle("museum")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  selectedStyle === "museum"
                    ? "bg-white dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-slate-250 dark:border-emerald-400/20 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
                title="Museum Frame Exhibit"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedStyle("grid")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  selectedStyle === "grid"
                    ? "bg-white dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-slate-250 dark:border-amber-400/20 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
                title="Space-Time Sequence"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Download Timeline Package trigger */}
            <button
              id="btn_download_timeline"
              onClick={() => handleDownloadTimelineZip(filteredImages)}
              disabled={isDownloadingZip || filteredImages.length === 0}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 disabled:opacity-40 text-white dark:bg-[#1e1b4b]/45 dark:hover:bg-indigo-900/40 dark:border dark:border-indigo-500/35 dark:text-indigo-300 dark:hover:text-white rounded-xl text-xs font-mono font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:pointer-events-none shadow-sm dark:shadow-md"
              title="Download zipped timeline with metadata"
            >
              {isDownloadingZip ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white dark:text-indigo-400 shrink-0" />
                  <span>Packaging...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white dark:text-indigo-400 shrink-0" />
                  <span>Export ({filteredImages.length})</span>
                </>
              )}
            </button>

            {/* Public Persistent Sharing trigger */}
            <button
              id="btn_share_timeline"
              onClick={handleShareTimeline}
              disabled={shareStatus === "loading" || filteredImages.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white dark:bg-[#064e3b]/45 dark:hover:bg-emerald-900/40 dark:border dark:border-emerald-500/35 dark:text-emerald-300 dark:hover:text-white rounded-xl text-xs font-mono font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:pointer-events-none shadow-sm dark:shadow-md"
              title="Generate a public shareable persistent link"
            >
              {shareStatus === "loading" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white dark:text-emerald-400 shrink-0" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-white dark:text-emerald-400 shrink-0" />
                  <span>Share Timeline</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 transition-all duration-500 max-w-7xl mx-auto w-full z-10">
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
              <div className="relative w-12 h-12 flex items-center justify-center text-slate-400 dark:text-slate-600 animate-bounce">
                <X className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">No assets found</h3>
              <p className="text-slate-500 dark:text-neutral-550 max-w-sm text-xs font-light">
                No memories match your selection criteria. Try adding more categories or turning off duplicate filtration.
              </p>
            </div>
          ) : (
            <>
              {/* 1. BENTO GRID VIEW PRESET */}
              {selectedStyle === "bento" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px] text-left">
                  {filteredImages.map((img, idx) => {
                    const shapes = [
                      "lg:col-span-2 lg:row-span-2",
                      "lg:col-span-1 lg:row-span-1",
                      "lg:col-span-1 lg:row-span-2",
                      "lg:col-span-2 lg:row-span-1",
                      "lg:col-span-1 lg:row-span-1",
                      "lg:col-span-1 lg:row-span-1",
                    ];
                    const bentoClass = shapes[idx % shapes.length];

                    return (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className={`${bentoClass} group relative bg-white dark:bg-[#0f172a] border border-slate-205/85 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 rounded-[32px] overflow-hidden cursor-pointer shadow-md hover:shadow-xl dark:shadow-none transition-all duration-550 hover:scale-[1.015] flex flex-col justify-end p-6`}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-85 dark:opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                        {/* Dynamic visual parameters */}
                        <div className="relative z-10 space-y-2 pointer-events-none">
                          <span className="px-2 py-[2.5px] bg-indigo-500/85 text-white dark:bg-indigo-500/20 dark:border dark:border-indigo-400/30 dark:text-indigo-300 rounded-md font-mono text-[9px] uppercase tracking-wider">
                            {img.category}
                          </span>
                          <h3 className="text-white text-base font-semibold font-display truncate leading-tight mt-1.5">
                            {img.caption}
                          </h3>
                          <div className="flex items-center gap-3 text-slate-300 dark:text-slate-400 font-mono text-[10px]">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {img.location}
                            </span>
                            <span>•</span>
                            <span>{img.time12h}</span>
                          </div>
                        </div>

                        {/* Duplicate counts indicator badges */}
                        {img.duplicateIds && img.duplicateIds.length > 0 && (
                          <div className="absolute top-4 right-4 bg-purple-600/90 dark:bg-purple-900/80 border border-purple-400/30 text-white dark:text-purple-300 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-[6px] shadow-lg">
                            <Layers className="w-3 h-3 shrink-0" />
                            <span>+{img.duplicateIds.length + 1} Burst Stack</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. CINEMATIC SCROLL VIEW PRESET */}
              {selectedStyle === "cinematic" && (
                <div className="space-y-36 py-12 max-w-5xl mx-auto text-left">
                  {filteredImages.map((img, idx) => {
                    const isEven = idx % 2 === 0;

                    return (
                      <div
                        key={img.id}
                        className={`flex flex-col ${
                          isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                        } gap-12 items-center`}
                      >
                        {/* Left picture spotlight */}
                        <div
                          onClick={() => setSelectedImage(img)}
                          className="w-full lg:w-3/5 rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 group cursor-pointer relative shadow-lg dark:shadow-2xl transition-all duration-500 hover:scale-[1.01]"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-auto max-h-[500px] object-cover opacity-95 dark:opacity-60 group-hover:opacity-100 dark:group-hover:opacity-90 group-hover:scale-102 transition-all duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

                          {/* Color highlight bar matching palette */}
                          <div className="absolute bottom-0 left-0 right-0 h-[4.5px] flex">
                            {img.colorPalette.map((col, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex-1 h-full"
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Right descriptions */}
                        <div className="w-full lg:w-2/5 space-y-6">
                          <div className="space-y-2">
                            <span className="px-3 py-1 bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-mono tracking-wider uppercase font-semibold">
                              {img.category}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-slate-900 dark:text-white leading-tight">
                              {img.caption}
                            </h2>
                          </div>

                          {/* Poetic information breakdown */}
                          <p className="text-sm font-sans font-light text-slate-600 dark:text-slate-405 leading-relaxed italic border-l-2 border-slate-350 dark:border-slate-800 pl-4 py-1">
                            "{img.name}" &mdash; Crafted chronologically at {img.time12h}. Set under local environmental coordinates near {img.location}.
                          </p>

                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-white dark:bg-[#0f172a]/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none">
                              <p className="text-[9px] font-mono uppercase text-slate-400 dark:text-slate-500 mb-1 font-bold">
                                Location Spot
                              </p>
                              <p className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                                {img.location}
                              </p>
                            </div>
                            <div className="p-4 bg-white dark:bg-[#0f172a]/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none">
                              <p className="text-[9px] font-mono uppercase text-slate-400 dark:text-slate-500 mb-1 font-bold">
                                Characters
                              </p>
                              <p className="text-xs font-semibold flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                                <Users className="w-3.5 h-3.5 text-purple-500" />
                                {img.peopleCount > 0 ? `${img.peopleCount} detected` : "Landscape"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. EDITORIAL MUSEUM CANVAS SPOTLIGHT PRESET */}
              {selectedStyle === "museum" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 py-8 justify-items-center">
                  {filteredImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:-translate-y-2"
                    >
                      {/* Premium gallery border frame that looks stunning in Light and Dark mode */}
                      <div className="border-[18px] border-slate-900 bg-[#020617] p-2.5 shadow-xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] rounded relative flex items-center justify-center overflow-hidden w-full max-w-sm">
                        <img
                          src={img.url}
                          alt={img.name}
                          loading="lazy"
                          className="w-full h-48 object-cover group-hover:scale-105 transition-all duration-1000 ease-in-out"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-[#020617]/10 group-hover:bg-transparent transition-colors pointer-events-none" />
                      </div>

                      {/* Traditional Museum Label Plaque */}
                      <div className="mt-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 px-6 py-4 text-center rounded-xl max-w-xs space-y-2 shadow-sm dark:shadow-lg">
                        <h4 className="font-display font-medium text-slate-800 dark:text-slate-200 text-sm tracking-tight leading-snug">
                          {img.caption}
                        </h4>
                        <div className="flex justify-center items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                          <span>{img.category}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span>{img.time12h}</span>
                        </div>

                        {/* Visual color codes match */}
                        <div className="flex justify-center gap-1.5 pt-1.5">
                          {img.colorPalette.map((col, ci) => (
                            <span
                              key={ci}
                              className="w-2.5 h-2.5 rounded-full inline-block border border-slate-200 dark:border-[#020617] shadow-sm transform hover:scale-110 transition-transform cursor-default"
                              style={{ backgroundColor: col }}
                              title={col}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. SPACE-TIME CAROUSEL CATALOG */}
              {selectedStyle === "grid" && (
                <div className="space-y-10 max-w-4xl mx-auto text-left">
                  {filteredImages.map((img) => (
                    <div
                      key={img.id}
                      className="group bg-white/75 dark:bg-[#0f172a]/20 border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-8 hover:border-[#1e293b]/30 hover:shadow-md transition-all shadow-sm"
                    >
                      {/* Progressive Chronological hour marker timeline block */}
                      <div className="flex md:flex-col items-center justify-center shrink-0 w-24 gap-1 select-none">
                        <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 leading-none">
                          {img.time12h.split(" ")[0].split(":")[0]}
                        </span>
                        <div className="flex flex-col md:items-center text-center">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            :{img.time12h.split(" ")[0].split(":")[1]}
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-450 dark:text-slate-500">
                            {img.time12h.split(" ")[1]}
                          </span>
                        </div>
                      </div>

                      {/* Gallery photo block */}
                      <div
                        onClick={() => setSelectedImage(img)}
                        className="w-full md:w-56 h-36 rounded-2xl overflow-hidden cursor-pointer shrink-0 border border-slate-200 dark:border-slate-950 shadow relative group"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-90 dark:opacity-75 group-hover:opacity-100 group-hover:scale-102 transition-all duration-700 pointer-events-none animate-fade-in"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Image details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-[2px] bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-400/25 dark:text-indigo-300 rounded-lg text-[9.5px] uppercase font-semibold font-mono">
                            {img.category}
                          </span>
                          <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {img.dateStr}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                          {img.caption}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                          Indexed inside spatial group: <span className="font-semibold text-slate-700 dark:text-slate-300">{img.location}</span>. Duplicate index groups register as {img.duplicateIds ? img.duplicateIds.length + 1 : 1} visual signatures.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* DETAIL DRAWER / FULLSCREEN MULTIMODAL MODAL ON CLICK */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 dark:bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in">
          {/* Close Area */}
          <div className="absolute inset-0" onClick={() => setSelectedImage(null)} />

          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full transition-all shadow focus:outline-none z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-5xl bg-white dark:bg-[#0a0f1d] border border-slate-205 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row z-10 animate-scale-up text-left">
            {/* Visual Render Grid */}
            <div className="relative w-full lg:w-3/5 bg-slate-50 dark:bg-[#020617] flex items-center justify-center min-h-[300px] max-h-[550px] overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-w-full max-h-full object-contain shadow-2xl z-10 p-4"
                referrerPolicy="no-referrer"
              />
              <div
                className="absolute inset-0 filter blur-3xl opacity-10 dark:opacity-20 transform scale-150 pointer-events-none"
                style={{
                  backgroundImage: `url(${selectedImage.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>

            {/* Neural Parameters Workspace */}
            <div className="w-full lg:w-2/5 p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800/85 space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-400/20 dark:text-indigo-400 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold">
                    {selectedImage.category}
                  </span>
                  <h2 className="text-2xl font-display font-medium tracking-tight text-slate-900 dark:text-white mt-1.5">
                    {selectedImage.caption}
                  </h2>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-slate-150 dark:border-slate-800">
                  <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Exhibition Parameters
                  </h4>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Captured Date
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {selectedImage.dateStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Camera className="w-4 h-4 text-slate-400" />
                        Capture Time
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs text-right">
                        {selectedImage.time12h}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Location
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs text-right">{selectedImage.location}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Users className="w-4 h-4 text-slate-400" />
                        Identified Actors
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {selectedImage.peopleCount > 0
                          ? `${selectedImage.peopleCount} detected`
                          : "Landscape Mode"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Palette className="w-4 h-4 text-slate-400" />
                        Palette Swatches
                      </span>
                      <div className="flex gap-1.5">
                        {selectedImage.colorPalette.map((col, idx) => (
                          <span
                            key={idx}
                            className="w-5 h-5 rounded-full inline-block border border-slate-200 dark:border-slate-900 shadow-sm cursor-default hover:scale-115 transition-transform"
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duplicate Stack burst listings */}
              {selectedImage.duplicateIds && selectedImage.duplicateIds.length > 0 && (
                <div className="bg-indigo-50/50 dark:bg-purple-950/20 border border-indigo-100 dark:border-purple-500/15 rounded-2xl p-4 space-y-1.5 text-left">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-purple-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    Burst Analysis Stack ({selectedImage.duplicateIds.length + 1} Occurrences)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    Nebula classified multiple similar captures taken consecutively. We group and collapse redundant shots to emphasize a clean aesthetic timeline memory map.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/70 flex justify-between items-center text-[10.5px] text-slate-400 dark:text-slate-550 font-mono">
                <span className="truncate max-w-[150px]">File: {selectedImage.name}</span>
                <span>Size: {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARING MODAL CONTROLS (Pillar 1) */}
      {shareStatus !== "idle" && (
        <div className="fixed inset-0 z-50 bg-black/80 dark:bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => shareStatus !== "loading" && setShareStatus("idle")} />

          <div className="relative w-full max-w-sm bg-white dark:bg-[#0d1324] border border-slate-205 dark:border-slate-800 rounded-[32px] p-8 shadow-2xl flex flex-col space-y-6 z-10 text-left animate-scale-up">
            {shareStatus !== "loading" && (
              <button
                onClick={() => setShareStatus("idle")}
                className="absolute top-5 right-5 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full transition-all focus:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {shareStatus === "loading" && (
              <div className="text-center py-4 space-y-5">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
                <div className="space-y-2">
                  <h3 className="font-display font-medium text-lg text-slate-900 dark:text-white">
                    Publishing Exhibition...
                  </h3>
                  <p className="text-xs font-sans font-light text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {shareProgress.message}
                  </p>
                </div>

                {shareProgress.total > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-350"
                        style={{ width: `${(shareProgress.current / shareProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Processed {shareProgress.current} of {shareProgress.total} memories
                    </p>
                  </div>
                )}
              </div>
            )}

            {shareStatus === "success" && sharedUrl && (
              <div className="space-y-5 text-center">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-semibold text-xl text-slate-950 dark:text-white">
                    Exhibition Published
                  </h3>
                  <p className="text-xs font-sans font-light text-slate-550 dark:text-slate-400 leading-relaxed">
                    Nebula compiled your persistent timeline. Visitors can view this map, analyze image spots, and browse the full curation without local files.
                  </p>
                </div>

                {/* Copier link slot */}
                <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl items-center">
                  <input
                    type="text"
                    readOnly
                    value={sharedUrl}
                    className="flex-1 bg-transparent text-xs font-semibold text-slate-750 dark:text-slate-300 px-3 outline-none select-all min-w-0"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sharedUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className={`p-2 rounded-xl transition-all font-semibold flex items-center gap-1 cursor-pointer shrink-0 ${
                      copiedLink
                        ? "bg-emerald-555 text-white"
                        : "bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setShareStatus("idle")}
                    className="flex-1 py-2.5 bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-[11px] font-mono font-bold transition-all cursor-pointer"
                  >
                    Close Panel
                  </button>
                  <a
                    href={sharedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-2xl text-[11px] font-mono font-bold transition-all shadow-md block"
                  >
                    Visit Exhibit
                  </a>
                </div>
              </div>
            )}

            {shareStatus === "error" && (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                  <X className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">
                    Publishing Halted
                  </h3>
                  <p className="text-xs font-sans text-rose-500 bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100/30 dark:border-rose-500/10 p-3 rounded-2xl leading-relaxed">
                    {shareProgress.message}
                  </p>
                </div>
                <button
                  onClick={handleShareTimeline}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-2xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Retry Upload
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative mt-auto border-t border-slate-200 dark:border-neutral-900/45 py-8 text-slate-400 dark:text-neutral-600 text-[10.5px] font-mono tracking-wider w-full text-center bg-slate-100/50 dark:bg-neutral-950/20 backdrop-blur z-10 select-none transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} NEBULA &mdash; ALL COGNITIVE INTERMEDIATES SAVED SECURELY IN YOUR BROWSER DATABASE.
          </p>
          <div className="flex gap-5 items-center">
            <span>Server Instance: {serverOnline ? "ACTIVE" : "STANDALONE"}</span>
            <span>•</span>
            <span>Version: 1.2 Premium</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
