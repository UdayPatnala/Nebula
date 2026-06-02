/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ImageItem, PresentationStyle } from "../../types";
import {
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  Users,
  Camera,
  X,
  Compass,
  ArrowLeft,
  Layout,
  Film,
  Palette,
  Grid,
  Loader2,
  CalendarClock
} from "lucide-react";
import { AppIcon } from "../AppIcon";
import { ThemeToggle } from "../ThemeToggle";

interface SharedGalleryProps {
  sharedId: string | null;
}

export function SharedGallery({ sharedId }: SharedGalleryProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  
  // Gallery data loaded from firestore
  const [galleryData, setGalleryData] = useState<{
    id: string;
    style: PresentationStyle;
    images: ImageItem[];
    createdAt: any;
  } | null>(null);

  // Layout & modal selectors matching PresentationScreen exactly
  const [selectedStyle, setSelectedStyle] = useState<PresentationStyle>("bento");
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [activeFilterCategory, setFilterCategory] = useState<string>("All");

  // Fetch public document upon mount
  useEffect(() => {
    if (!sharedId) {
      setErrorStr("No shared catalog ID provided.");
      setLoading(false);
      return;
    }

    async function loadSharedTimeline() {
      try {
        const docRef = doc(db, "shared_galleries", sharedId!);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as {
            id: string;
            style: PresentationStyle;
            images: ImageItem[];
            createdAt: any;
          };
          setGalleryData(data);
          setSelectedStyle(data.style || "bento");
        } else {
          setErrorStr("The requested memory exhibition does not exist or has been removed.");
        }
      } catch (err: unknown) {
        console.error("Failed to load shared gallery:", err);
        setErrorStr("Could not retrieve shared timeline from cloud database. Please verify your connection.");
      } finally {
        setLoading(false);
      }
    }

    loadSharedTimeline();
  }, [sharedId]);

  // Derive categories list dynamically
  const categoriesList = useMemo(() => {
    if (!galleryData) return ["All"];
    const list = new Set<string>();
    galleryData.images.forEach((img) => list.add(img.category));
    return ["All", ...Array.from(list)];
  }, [galleryData]);

  // Filter images list dynamically
  const filteredImages = useMemo(() => {
    if (!galleryData) return [];
    return galleryData.images.filter((img) => {
      const categoryMatch = activeFilterCategory === "All" || img.category === activeFilterCategory;
      const duplicateMatch = !img.isDuplicateOfId; // Don't show raw bursts in public shared links
      return categoryMatch && duplicateMatch;
    });
  }, [galleryData, activeFilterCategory]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] space-y-5 select-none relative z-10">
        <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <div className="text-center space-y-1.5">
          <p className="font-display font-medium text-lg text-slate-800 dark:text-white">
            Aligning shared galactic memories...
          </p>
          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Structuring chronological visual coordinates
          </p>
        </div>
      </div>
    );
  }

  if (errorStr || !galleryData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-6 space-y-6 select-none relative z-10">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center shadow">
          <X className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-2xl text-slate-900 dark:text-white">
            Exhibition Unavailable
          </h3>
          <p className="text-sm font-sans font-light text-slate-500 dark:text-slate-400 leading-relaxed">
            {errorStr || "Failed to retrieve this memory timeline map."}
          </p>
        </div>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-md"
        >
          Create your own timeline
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col lg:flex-row z-10 transition-all duration-1000 ease-out min-h-screen">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex lg:w-80 bg-slate-50 dark:bg-[#0b111e]/90 border-r border-slate-200/80 dark:border-[#1e293b] flex-col p-6 shrink-0 relative text-left select-none transition-colors duration-300">
        {/* Logo area */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-[#1e293b] rounded-xl flex items-center justify-center shadow-sm p-1.5 shrink-0">
            <AppIcon className="w-full h-full text-indigo-650 dark:text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display font-medium tracking-wider text-slate-900 dark:text-white leading-none">Nebula</span>
            <span className="text-[8px] font-mono text-slate-400 dark:text-indigo-455 font-bold uppercase tracking-widest mt-0.5">
              Shared Exhibit
            </span>
          </div>
        </div>

        {/* Categories title */}
        <h5 className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-4">
          Exhibition Categories
        </h5>

        {/* Categories Selector */}
        <div className="space-y-1 overflow-y-auto max-h-[35vh] pr-1">
          {categoriesList.map((cat) => {
            const count = galleryData.images.filter(
              (img) => (cat === "All" || img.category === cat) && !img.isDuplicateOfId
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
                <span className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono rounded text-slate-500 dark:text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Create Your Own timeline Promo card at the bottom of left rail */}
        <div className="mt-auto bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-[#1e1b4b]/30 dark:to-transparent border border-indigo-100/70 dark:border-indigo-500/15 p-5 rounded-[24px] space-y-4">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-indigo-500 shrink-0" />
            <h4 className="font-display font-medium text-xs text-slate-800 dark:text-indigo-300">
              Curate Your Own Timeline
            </h4>
          </div>
          <p className="text-[11px] font-sans font-light text-slate-500 dark:text-slate-400 leading-relaxed text-left">
            Have private family photos, travel folders, or portraits? Download Nebula and transform files into immersive sequences instantly.
          </p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-720 text-white rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Start curating</span>
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE DISPLAY */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="px-6 md:px-10 py-5 border-b border-slate-200/75 dark:border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none z-10 transition-colors duration-300">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" />
                Shared Memory Exhibit
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <CalendarClock className="w-3.5 h-3.5 text-slate-450" />
              Shared code ID: {sharedId}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <ThemeToggle />

            {/* Mobile Home Button */}
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="px-4 py-2 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-450 shrink-0" />
              <span>Create Timeline</span>
            </button>

            {/* Style Switcher presets */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-[#1e293b] rounded-xl shrink-0">
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
          </div>
        </header>

        {/* Exhibition Content Grid */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full z-10">
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
              <div className="relative w-12 h-12 flex items-center justify-center text-slate-400 dark:text-slate-600 animate-bounce">
                <X className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">Empty timeline</h3>
              <p className="text-slate-550 max-w-sm text-xs font-light">
                No memories match your selection criteria.
              </p>
            </div>
          ) : (
            <>
              {/* BENTO EXHIBITION VIEW */}
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
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CINEMATIC VIEW */}
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

                          {/* Swatches */}
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

                        <div className="w-full lg:w-2/5 space-y-6">
                          <div className="space-y-2">
                            <span className="px-3 py-1 bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-mono tracking-wider uppercase font-semibold">
                              {img.category}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-slate-900 dark:text-white leading-tight">
                              {img.caption}
                            </h2>
                          </div>

                          <p className="text-sm font-sans font-light text-slate-600 dark:text-slate-405 leading-relaxed italic border-l-2 border-slate-350 dark:border-slate-800 pl-4 py-1">
                            "{img.name}" &mdash; Crafted chronologically at {img.time12h}. Set in {img.location}.
                          </p>

                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 bg-white dark:bg-[#0f172a]/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                              <p className="text-[9px] font-mono uppercase text-slate-450 dark:text-slate-500 mb-1 font-bold">
                                Location Spot
                              </p>
                              <p className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                                {img.location}
                              </p>
                            </div>
                            <div className="p-4 bg-white dark:bg-[#0f172a]/40 border border-slate-200 dark:border-slate-800 rounded-2xl opacity-100">
                              <p className="text-[9px] font-mono uppercase text-slate-450 dark:text-slate-500 mb-1 font-bold">
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

              {/* MUSEUM EXHIBIT */}
              {selectedStyle === "museum" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 py-8 justify-items-center">
                  {filteredImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:-translate-y-2"
                    >
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

                      <div className="mt-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 px-6 py-4 text-center rounded-xl max-w-xs space-y-2 shadow-sm dark:shadow-md">
                        <h4 className="font-display font-medium text-slate-800 dark:text-slate-200 text-sm tracking-tight leading-snug">
                          {img.caption}
                        </h4>
                        <div className="flex justify-center items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                          <span>{img.category}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span>{img.time12h}</span>
                        </div>

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

              {/* SPACE-TIME SEQUENCES */}
              {selectedStyle === "grid" && (
                <div className="space-y-10 max-w-4xl mx-auto text-left">
                  {filteredImages.map((img) => (
                    <div
                      key={img.id}
                      className="group bg-white/75 dark:bg-[#0f172a]/20 border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-8 hover:border-[#1e293b]/30 hover:shadow-md transition-all shadow-sm animate-fade-in"
                    >
                      <div className="flex md:flex-col items-center justify-center shrink-0 w-24 gap-1 select-none">
                        <span className="text-2xl font-black font-mono text-indigo-650 dark:text-indigo-400 leading-none">
                          {img.time12h.split(" ")[0].split(":")[0]}
                        </span>
                        <div className="flex flex-col md:items-center text-center">
                          <span className="text-xs font-semibold text-slate-750 dark:text-slate-300">
                            :{img.time12h.split(" ")[0].split(":")[1]}
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-450 dark:text-slate-500">
                            {img.time12h.split(" ")[1]}
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => setSelectedImage(img)}
                        className="w-full md:w-56 h-36 rounded-2xl overflow-hidden cursor-pointer shrink-0 border border-slate-200 dark:border-slate-950 shadow relative"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-90 dark:opacity-75 group-hover:opacity-100 group-hover:scale-102 transition-all duration-700 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-[2px] bg-indigo-50 border border-indigo-100 text-indigo-755 dark:bg-indigo-500/10 dark:border-indigo-400/25 dark:text-indigo-300 rounded-lg text-[9.5px] uppercase font-semibold font-mono">
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
                        <p className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed font-light">
                          Indexed inside spatial group: <span className="font-semibold text-slate-700 dark:text-slate-305">{img.location}</span>.
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

      {/* MULTIMODAL MODAL ON CLICK */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/85 dark:bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="absolute inset-0 animate-fade-in" onClick={() => setSelectedImage(null)} />

          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full shadow cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-5xl bg-white dark:bg-[#0a0f1d] border border-slate-205 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row z-10 text-left">
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

            <div className="w-full lg:w-2/5 p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800/85 space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-705 dark:bg-indigo-500/10 dark:border-indigo-400/20 dark:text-indigo-400 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold">
                    {selectedImage.category}
                  </span>
                  <h2 className="text-2xl font-display font-medium tracking-tight text-slate-900 dark:text-white mt-1.5">
                    {selectedImage.caption}
                  </h2>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-slate-150 dark:border-slate-805">
                  <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Exhibition Parameters
                  </h4>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Captured Date
                      </span>
                      <span className="font-mono font-bold text-slate-750 dark:text-slate-300 text-xs">
                        {selectedImage.dateStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Camera className="w-4 h-4 text-slate-400" />
                        Capture Time
                      </span>
                      <span className="font-mono font-bold text-slate-750 dark:text-slate-300 text-xs text-right">
                        {selectedImage.time12h}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Location
                      </span>
                      <span className="font-semibold text-slate-750 dark:text-slate-300 text-xs text-right">
                        {selectedImage.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs">
                        <Users className="w-4 h-4 text-slate-400" />
                        Identified Actors
                      </span>
                      <span className="font-mono font-bold text-slate-750 dark:text-slate-300 text-xs text-right">
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
                            className="w-5 h-5 rounded-full inline-block border border-slate-200 dark:border-slate-900 shadow-sm transform hover:scale-110 transition-transform"
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/70 flex justify-between items-center text-[10.5px] text-slate-400 dark:text-slate-550 font-mono">
                <span className="truncate max-w-[150px]">File: {selectedImage.name}</span>
                <span>Size: {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative mt-auto border-t border-slate-200 dark:border-neutral-900/45 py-8 text-slate-400 dark:text-neutral-600 text-[10.5px] font-mono tracking-wider w-full text-center bg-slate-100/50 dark:bg-neutral-950/20 backdrop-blur z-10- select-none transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} NEBULA &mdash; SHARED CHRONICLED PORTRAIT MAP PERSISTING ON SECURE CLOUD STORAGE.
          </p>
          <div className="flex gap-5 items-center">
            <span>Powered by Gemini & Firebase</span>
            <span>•</span>
            <span>Version: 1.2 Premium</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
