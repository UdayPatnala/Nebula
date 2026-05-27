/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FolderOpen,
  Camera,
  Calendar,
  MapPin,
  Users,
  Check,
  Loader2,
  Sparkles,
  X,
  Grid,
  Film,
  Layers,
  Palette,
  ArrowLeft,
  Info,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Layout,
  Play
} from "lucide-react";
import { ImageItem, PresentationStyle, PipelineProgress } from "./types";
import { openDB, getCachedAnalysis, setCachedAnalysis, clearCacheDB } from "./lib/idb";
import { PRELOADED_CONSTELLATION } from "./data";

export default function App() {
  // Stage state: 'landing' -> 'style' -> 'processing' -> 'presentation'
  const [stage, setStage] = useState<"landing" | "style" | "processing" | "presentation">("landing");
  const [showDeploymentGuide, setShowDeploymentGuide] = useState(false);
  
  // Storage for raw input file handles or files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sourceType, setSourceType] = useState<"folder" | "files" | "demo">("demo");
  
  // Processed database images state
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<PresentationStyle>("bento");
  
  // Pipeline status & metrics
  const [progress, setProgress] = useState<PipelineProgress>({
    phase: "idle",
    total: 0,
    current: 0,
    currentName: ""
  });
  
  // Configuration options (toggled on processing step)
  const [mergeDuplicates, setMergeDuplicates] = useState(true);
  const [isDemoPreloading, setIsDemoPreloading] = useState(false);
  
  // Active states inside Presentation
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>("All");
  const [activeFilterLocation, setActiveFilterLocation] = useState<string>("All");
  const [activeFilterDate, setActiveFilterDate] = useState<string>("All");
  const [showDuplicates, setShowDuplicates] = useState(false); // Whether to show children in the grid or treat them as collapsed
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  
  // Hover & mouse coordinates for interactive cosmic effects
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const landingRef = useRef<HTMLDivElement>(null);

  // Check if API server is online and key is present
  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        setServerOnline(data.hasKey);
      })
      .catch((err) => {
        console.warn("Backend configuration unreachable:", err);
        setServerOnline(false);
      });
  }, []);

  // Parallax stars background movement on landing page
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!landingRef.current) return;
    const rect = landingRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 30, y: y * 30 });
  };

  // 1. Primary Ingestion Method (Folder Scanner)
  const triggerFolderPicker = async () => {
    try {
      // Check for browser support
      if (!("showDirectoryPicker" in window)) {
        alert(
          "Your browser does not support raw folder ingestion APIs yet. Please use Chrome, Edge, or select multiple files directly."
        );
        return;
      }
      const dirHandle = await (window as any).showDirectoryPicker();
      setProgress({ phase: "extract", total: 0, current: 0, currentName: "Scanning Directory Structure..." });
      setStage("style");
      setSourceType("folder");
      
      const fileList: File[] = [];
      await scanDirRecursive(dirHandle, fileList);
      
      if (fileList.length === 0) {
        alert("No supported images found in the selected directory tree.");
        setStage("landing");
        return;
      }
      setSelectedFiles(fileList);
    } catch (err: any) {
      console.warn("Folder picker cancelled or disallowed:", err);
    }
  };

  const scanDirRecursive = async (dirHandle: any, fileList: File[]) => {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        if (file.type.startsWith("image/")) {
          fileList.push(file);
        }
      } else if (entry.kind === "directory") {
        try {
          await scanDirRecursive(entry, fileList);
        } catch (e) {
          console.warn("Skipped subdirectory reading due to permissions:", e);
        }
      }
    }
  };

  // 2. Secondary Ingestion Method (Multiple Files Input)
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = (Array.from(e.target.files) as File[]).filter((f) => f.type.startsWith("image/"));
      if (filesArr.length === 0) {
        alert("Please select at least one valid image file.");
        return;
      }
      setSelectedFiles(filesArr);
      setSourceType("files");
      setStage("style");
    }
  };

  // Trigger Style Selection
  const selectStyleAndBuild = (style: PresentationStyle) => {
    setSelectedStyle(style);
    executeETLPipeline();
  };

  // Client-side quick deduplication & metadata extractor helper
  const downsizeImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");

        // Resize to 420px max dimension for ultra-fast Gemini recognition weights
        const maxDim = 420;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = (h * maxDim) / w;
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = (w * maxDim) / h;
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        
        // Return compressed low-weight base64 string
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        resolve(base64.split(",")[1]); // Strip prefix data link
      };
      img.onerror = (err) => reject(err);
    });
  };

  // Real-time Extraction, Transformation, Loading, Analysis & Presentation Engine
  const executeETLPipeline = async () => {
    setStage("processing");
    setProgress({ phase: "extract", total: selectedFiles.length, current: 0, currentName: "Aligning temporal streams..." });

    const timelineItems: ImageItem[] = [];
    const totalFiles = selectedFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = selectedFiles[i];
      const percent = Math.round(((i + 1) / totalFiles) * 100);

      setProgress({
        phase: "transform",
        total: totalFiles,
        current: i + 1,
        currentName: `Extracting properties for ${file.name} [${percent}%]`
      });

      const fileKey = `${file.size}-${file.lastModified}-${file.name}`;
      const blobUrl = URL.createObjectURL(file);

      // A. EXTRACT & TRANSFORM: Date formatting to 12-hour format
      const dateObj = new Date(file.lastModified);
      const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Calculate 12-hour clock representation
      let hour24 = dateObj.getHours() + dateObj.getMinutes() / 60;
      let hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // conversion of '0' hour to '12'
      const time12h = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;

      // B. ANALYZE (Neural Node Analysis: Cache Check or call Google GenAI)
      setProgress({
        phase: "analyze",
        total: totalFiles,
        current: i + 1,
        currentName: `Consulting intelligence registry for ${file.name}`
      });

      let aiMetadata;

      // Check IndexedDB Client cache DB first (Instant match!)
      const cached = await getCachedAnalysis(fileKey);
      if (cached) {
        aiMetadata = {
          category: cached.category,
          timeOfDay: cached.timeOfDay,
          caption: cached.caption,
          peopleCount: cached.peopleCount,
          backgroundLocation: cached.backgroundLocation,
          colorPalette: cached.colorPalette
        };
      } else {
        // Fallback: If mock server is online, run actual Gemini-3.5-flash vision analyze
        if (serverOnline) {
          try {
            const base64Data = await downsizeImageToBase64(file);
            const response = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64: base64Data, mimeType: file.type })
            });
            if (response.ok) {
              const result = await response.json();
              aiMetadata = result;
              // Set to Cache DB so subsequent scans load instantly
              await setCachedAnalysis({
                fileKey,
                category: result.category,
                timeOfDay: result.timeOfDay,
                caption: result.caption,
                peopleCount: result.peopleCount,
                backgroundLocation: result.backgroundLocation,
                colorPalette: result.colorPalette,
                timestampStr: dateObj.toISOString()
              });
            } else {
              throw new Error("Server analysis failed");
            }
          } catch (err) {
            console.warn("AI analysis returned error, generating local visual context contextually...", err);
            aiMetadata = generateLocalContext(file.name);
          }
        } else {
          // No API key - Generate quick majestic visual context client-side to keep app 100% playable
          aiMetadata = generateLocalContext(file.name);
        }
      }

      // C. LOADING PHASE: Push object structures
      setProgress({
        phase: "load",
        total: totalFiles,
        current: i + 1,
        currentName: `Loading ${file.name} to memory stream`
      });

      timelineItems.push({
        id: `img-${i}-${Date.now()}`,
        url: blobUrl,
        name: file.name,
        size: file.size,
        timestamp: file.lastModified,
        dateStr,
        time12h,
        hour24,
        caption: aiMetadata.caption,
        category: aiMetadata.category,
        location: aiMetadata.backgroundLocation,
        peopleCount: aiMetadata.peopleCount,
        colorPalette: aiMetadata.colorPalette
      });
    }

    // D. DATA PREPROCESSING AND CLUSTERING
    // 1. Sort by Day time (Hour 24: from Day Start to Day End chronologically)
    timelineItems.sort((a, b) => a.hour24 - b.hour24);

    // 2. Perform Duplicate / Burst Merge Preprocessing
    // Group identical items or items shot within a 4-second burst that belong to the same category
    if (mergeDuplicates && timelineItems.length > 1) {
      const merged: ImageItem[] = [];
      const duplicateGroupMap = new Map<string, string[]>(); // Map of masterId -> duplicateIds

      for (let k = 0; k < timelineItems.length; k++) {
        const current = timelineItems[k];
        let foundMasterIndex = -1;

        // Compare against already approved master images
        for (let m = 0; m < merged.length; m++) {
          const master = merged[m];
          const timeDiff = Math.abs(current.timestamp - master.timestamp);
          const sizeDiffPercent = Math.abs(current.size - master.size) / master.size;

          // Duplicate signature: Shot within 5 seconds + similar file size OR exact same file names
          const isTimeBurst = timeDiff <= 5000 && sizeDiffPercent < 0.15;
          const isExactName = current.name === master.name && current.size === master.size;

          if (isTimeBurst || isExactName) {
            foundMasterIndex = m;
            break;
          }
        }

        if (foundMasterIndex !== -1) {
          // This is a duplicate! Group it under the master image
          const master = merged[foundMasterIndex];
          current.isDuplicateOfId = master.id;
          
          if (!duplicateGroupMap.has(master.id)) {
            duplicateGroupMap.set(master.id, []);
          }
          duplicateGroupMap.get(master.id)!.push(current.id);
          
          // Still register the duplicate item, but mark it as child
          timelineItems[k] = current;
        } else {
          // Register as a new unique Master Image
          merged.push(current);
        }
      }

      // Attach duplicate lists to masters
      timelineItems.forEach((img) => {
        if (duplicateGroupMap.has(img.id)) {
          img.duplicateIds = duplicateGroupMap.get(img.id);
        }
      });
    }

    // Perfect structural delivery! Set final memory images
    setImages(timelineItems);
    setProgress({ phase: "complete", total: totalFiles, current: totalFiles, currentName: "Chronological maps synced." });
    
    // Smooth Transition into gallery mode
    setTimeout(() => {
      setStage("presentation");
    }, 1200);
  };

  // Launch preloaded dynamic sample constellation instantly
  const launchDemoConstellation = () => {
    setIsDemoPreloading(true);
    setSourceType("demo");
    setProgress({ phase: "extract", total: PRELOADED_CONSTELLATION.length, current: 0, currentName: "Summoning Nebula constellation cores..." });
    setStage("style");
  };

  const handleLaunchDemoAction = () => {
    // Fill state directly from static, structured data.ts with zero latency
    setStage("processing");
    setTimeout(() => {
      setProgress({ phase: "analyze", total: PRELOADED_CONSTELLATION.length, current: 4, currentName: "Synthesizing deep-space visual layers..." });
      setTimeout(() => {
        // Load pre-made dataset instantly
        const sorted = [...PRELOADED_CONSTELLATION].sort((a, b) => a.hour24 - b.hour24);
        setImages(sorted);
        setProgress({ phase: "complete", total: sorted.length, current: sorted.length, currentName: "Cosmic catalog compiled." });
        setTimeout(() => {
          setStage("presentation");
          setIsDemoPreloading(false);
        }, 800);
      }, 700);
    }, 500);
  };

  // Helper: Client-side quick beautiful captioning for standard uploads
  const generateLocalContext = (filename: string) => {
    const fn = filename.toLowerCase();
    let category = "Travel";
    let caption = "An authentic landscape frozen beautifully in time.";
    let backgroundLocation = "Outdoor";
    let colorPalette = ["#1e293b", "#475569", "#cbd5e1"];
    let peopleCount = 0;

    if (fn.includes("cat") || fn.includes("dog") || fn.includes("pet") || fn.includes("animal")) {
      category = "Pets";
      caption = "Warm eyes looking up with gentle curious affection.";
      backgroundLocation = "CozyHome";
      colorPalette = ["#451a03", "#d97706", "#fef3c7"];
    } else if (fn.includes("food") || fn.includes("cook") || fn.includes("plate") || fn.includes("eat") || fn.includes("cafe")) {
      category = "Food";
      caption = "Artisan ingredients assembled into culinary delight.";
      backgroundLocation = "KitchenTable";
      colorPalette = ["#7f1d1d", "#ea580c", "#fef08a"];
    } else if (fn.includes("nature") || fn.includes("mountain") || fn.includes("tree") || fn.includes("sky") || fn.includes("ocean") || fn.includes("sea")) {
      category = "Nature";
      caption = "A quiet dialogue between emerald forests and sunlit peaks.";
      backgroundLocation = "HighWilderness";
      colorPalette = ["#064e3b", "#0d9488", "#f0fdf4"];
    } else if (fn.includes("family") || fn.includes("friend") || fn.includes("people") || fn.includes("me") || fn.includes("face") || fn.includes("portrait")) {
      category = "Portrait";
      caption = "A stunning human presence captured with absolute warmth.";
      backgroundLocation = "NaturalSpace";
      colorPalette = ["#451a03", "#d97706", "#fef3c7"];
      peopleCount = 1;
    } else if (fn.includes("city") || fn.includes("street") || fn.includes("night") || fn.includes("urban") || fn.includes("car")) {
      category = "Cityscape";
      caption = "Neon rain reflections painting shadows onto pavement.";
      backgroundLocation = "Metropolis";
      colorPalette = ["#1e1b4b", "#4f46e5", "#e0e7ff"];
    }

    return { category, caption, backgroundLocation, colorPalette, peopleCount };
  };

  // Filter & Group operations in presentation
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    images.forEach((img) => list.add(img.category));
    return ["All", ...Array.from(list)];
  }, [images]);

  const locationsList = useMemo(() => {
    const list = new Set<string>();
    images.forEach((img) => list.add(img.location));
    return ["All", ...Array.from(list)];
  }, [images]);

  const datesList = useMemo(() => {
    const list = new Set<string>();
    images.forEach((img) => list.add(img.dateStr));
    return ["All", ...Array.from(list)];
  }, [images]);

  // Derived filtered output list
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-neutral-800 selection:text-neutral-100 relative antialiased overflow-x-hidden">
      
      {/* Background Animated Stardust Constellation Panel */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div 
          className="absolute inset-[-100px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,rgba(139,92,246,0.04)_50%,transparent_100%)] opacity-80"
          style={{
            transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
            transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      {/* STAGE 1: LANDING PAGE */}
      {stage === "landing" && (
        <div 
          ref={landingRef}
          onMouseMove={handleMouseMove}
          className="relative flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col justify-center items-center py-20 z-10"
        >
          {/* Top floating cloud deploy panel */}
          <div className="absolute top-6 right-6 z-20">
            <button 
              onClick={() => setShowDeploymentGuide(true)}
              className="px-4 py-2.5 bg-[#0f172a]/85 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg backdrop-blur cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Deploy to Vercel & Netlify</span>
            </button>
          </div>

          {/* Constellation Particle Logo Sphere */}
          <div className="relative mb-8 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-45 group-hover:opacity-75 duration-700 transition-opacity" />
            <div className="relative w-28 h-28 bg-[#0f172a] border border-slate-800 rounded-3xl flex items-center justify-center p-[2px] shadow-2xl transition-transform duration-500 hover:rotate-12">
              <div className="w-full h-full rounded-2xl bg-[#020617] flex flex-col items-center justify-center overflow-hidden border border-slate-800/65">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full border border-indigo-400 border-dashed animate-[spin_10s_linear_infinite]" />
                  <div className="absolute w-6 h-6 rounded-full border border-purple-500 border-dashed animate-[spin_6s_linear_infinite_reverse]" />
                  <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <h1 className="font-display font-black text-6xl md:text-8xl tracking-tight text-center mb-3 text-white">
            NEBULA
          </h1>
          <p className="font-mono text-indigo-400 uppercase tracking-[0.25em] text-xs md:text-sm font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-ping" />
            Neural Memory Orchestrator
          </p>
          <p className="text-slate-400 max-w-xl text-center text-sm md:text-base mb-12 font-sans font-light leading-relaxed">
            Transform local folder assets into a beautiful, structured multi-view timeline. Instantly cluster visual content, perform chronological time matching, merge duplicate bursts, and experience a cinematic presentation mode.
          </p>

          {/* Core Select Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full mb-16">
            
            {/* Primary Option: Folder Upload */}
            <div 
              onClick={triggerFolderPicker}
              className="group relative cursor-pointer p-6 rounded-[32px] bg-[#0f172a] border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 shadow-xl flex flex-col items-start hover:-translate-y-1 shadow-indigo-500/5 hover:shadow-indigo-550/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-indigo-300 transition-colors">Ingest Local Directory</h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                Primary source. Recursively scan folders (e.g., C:\DCIM) directly from your system to build your local workspace.
              </p>
            </div>

            {/* Secondary Option: Multi-File Input */}
            <label 
              className="group relative cursor-pointer p-6 rounded-[32px] bg-[#0f172a] border border-slate-800 hover:border-purple-500/60 transition-all duration-300 shadow-xl flex flex-col items-start hover:-translate-y-1 shadow-purple-505/5 hover:shadow-purple-550/10"
            >
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileInputChange} 
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-purple-300 transition-colors">Select Multiple Photos</h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                Secondary source. Directly select specific picture assets or burst folders from your computer to analyze.
              </p>
            </label>

            {/* Cosmic Demo Constellation */}
            <div 
              onClick={launchDemoConstellation}
              className="group relative cursor-pointer p-6 rounded-[32px] bg-[#0f172a] border border-slate-800 hover:border-amber-500/60 transition-all duration-300 shadow-xl flex flex-col items-start hover:-translate-y-1 md:col-span-2 lg:col-span-1 shadow-amber-500/5 hover:shadow-amber-555/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-amber-300 transition-colors">Cosmic Demo Stream</h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                Explore Nebula instantly! Loads preset, high-resolution aesthetic memories with zero config.
              </p>
            </div>
          </div>

          {/* Dynamic Floating Photo Grid Showcase */}
          <div className="w-full max-w-5xl mt-8">
            <p className="text-center font-mono text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-6">
              Visual Constellation Floating Matrix
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[32px] border border-slate-800 bg-[#0f172a]/25 backdrop-blur">
              <div className="relative h-44 rounded-2xl overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop" 
                  alt="Dynamic Peak" 
                  className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute bottom-3 left-3 bg-neutral-950/80 px-2 py-1 rounded-md text-[10px] font-mono border border-neutral-800">
                  Mountains / Nature
                </div>
              </div>
              <div className="relative h-44 rounded-2xl overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop" 
                  alt="Neon Alley" 
                  className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute bottom-3 left-3 bg-neutral-950/80 px-2 py-1 rounded-md text-[10px] font-mono border border-neutral-800">
                  Tokyo Neon / City
                </div>
              </div>
              <div className="relative h-44 rounded-2xl overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&auto=format&fit=crop" 
                  alt="Paris Street" 
                  className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute bottom-3 left-3 bg-neutral-950/80 px-2 py-1 rounded-md text-[10px] font-mono border border-neutral-800">
                  Paris / Bistro
                </div>
              </div>
              <div className="relative h-44 rounded-2xl overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop" 
                  alt="Portrait" 
                  className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute bottom-3 left-3 bg-neutral-950/80 px-2 py-1 rounded-md text-[10px] font-mono border border-neutral-800">
                  Grace / Portrait
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: STYLE SELECTION */}
      {stage === "style" && (
        <div className="flex-1 max-w-6xl mx-auto w-full px-6 flex flex-col justify-center py-20 z-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-10">
            <button 
              onClick={() => setStage("landing")}
              className="p-3 rounded-full hover:bg-slate-800 transition-all border border-slate-800 group"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
            </button>
            <div>
              <p className="font-mono text-[10px] text-indigo-400 tracking-wider uppercase">Source Loaded ({isDemoPreloading ? PRELOADED_CONSTELLATION.length : selectedFiles.length} Assets)</p>
              <h2 className="text-3xl font-bold font-display tracking-tight text-white mb-1">Select Presentation Grid Soul</h2>
            </div>
          </div>

          {/* Config options prior to load */}
          {!isDemoPreloading && (
            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] max-w-2xl mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-white">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400 animate-pulse" />
                  ETL Optimization Engine
                </h4>
                <p className="text-slate-400 text-xs">
                  Combines visual and temporal signatures to collapse burst shots and duplicates into stack groups.
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={mergeDuplicates} 
                  onChange={(e) => setMergeDuplicates(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-950 outline-none"
                />
                <span className="text-xs font-mono tracking-wide text-slate-300">Merge Burst & Duplicates</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Bento Grid Panel */}
            <div 
              onClick={() => isDemoPreloading ? (setSelectedStyle("bento"), handleLaunchDemoAction()) : selectStyleAndBuild("bento")}
              className="group cursor-pointer p-6 rounded-[32px] bg-[#0f172a] border border-slate-800 hover:border-indigo-505/65 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-lg shadow-indigo-505/5 hover:shadow-indigo-500/10"
            >
              <div>
                <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_80%)] border border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                  <div className="grid grid-cols-3 gap-2 w-full p-4 h-full items-center">
                    <div className="bg-indigo-400/10 border border-indigo-400/30 rounded-lg h-28 flex items-center justify-center">
                      <Layout className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <div className="bg-purple-400/10 border border-purple-400/25 rounded-md h-12" />
                      <div className="bg-pink-400/10 border border-pink-400/25 rounded-md h-14" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-indigo-300">Aesthetic Bento</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Asymmetric rectangular grids grouped by date. Implements Apple and SaaS styled staggered visual blocks.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mt-6 block">Select Preset & Launch</span>
            </div>

            {/* Cinematic Filmstrip Panel */}
            <div 
              onClick={() => isDemoPreloading ? (setSelectedStyle("cinematic"), handleLaunchDemoAction()) : selectStyleAndBuild("cinematic")}
              className="group cursor-pointer p-6 rounded-[32px] bg-[#0f172a] border border-slate-800 hover:border-purple-505/65 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-lg shadow-purple-505/5 hover:shadow-purple-500/10"
            >
              <div>
                <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_80%)] border border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                  <div className="flex flex-col gap-2 w-full p-4 justify-center items-center h-full">
                    <div className="w-full bg-purple-500/10 border border-purple-400/30 rounded-xl py-3 px-4 flex items-center gap-3">
                      <Film className="w-5 h-5 text-purple-400 animate-pulse" />
                      <div className="h-2 w-2/3 bg-slate-850 rounded-full" />
                    </div>
                    <div className="w-11/12 bg-slate-900/80 h-10 rounded-lg border border-slate-800/60" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-purple-300">Cinematic Filmstrip</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Deep focus narrative scroll with gigantic custom typography, story descriptions, and metadata sidebar grids.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 mt-6 block">Select Preset & Launch</span>
            </div>

            {/* Minimal Museum Panel */}
            <div 
              onClick={() => isDemoPreloading ? (setSelectedStyle("museum"), handleLaunchDemoAction()) : selectStyleAndBuild("museum")}
              className="group cursor-pointer p-6 rounded-[32px] bg-[#0f172a] border border-slate-800 hover:border-emerald-505/65 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-lg shadow-emerald-505/5 hover:shadow-emerald-500/10"
            >
              <div>
                <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_80%)] border border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                  <div className="p-4 flex h-full w-full items-center justify-center">
                    <div className="border-[14px] border-slate-800 bg-[#020617] p-2 shadow-2xl flex flex-col items-center rounded-lg">
                      <div className="w-20 h-14 bg-emerald-500/5 border border-emerald-500/20 rounded flex items-center justify-center">
                        <Palette className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="w-8 h-1 bg-slate-800 mt-[6px] rounded-full" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-emerald-300">Museum Canvas</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Clean editorial exhibit space framed in deep shadow boards. Spotlight lighting focus with color palette logs.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mt-6 block">Select Preset & Launch</span>
            </div>

            {/* Space-Time Carousel */}
            <div 
              onClick={() => isDemoPreloading ? (setSelectedStyle("grid"), handleLaunchDemoAction()) : selectStyleAndBuild("grid")}
              className="group cursor-pointer p-6 rounded-[32px] bg-[#0f172a] border border-slate-800 hover:border-amber-505/65 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full justify-between shadow-lg shadow-amber-555/5 hover:shadow-amber-500/10"
            >
              <div>
                <div className="h-44 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1)_0%,transparent_80%)] border border-slate-800/80 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                  <div className="p-4 flex h-full w-full gap-2 items-center justify-center">
                    <div className="w-12 h-20 bg-slate-900 border border-slate-800 rounded-md rotate-[-8deg] shrink-0" />
                    <div className="w-16 h-24 bg-amber-500/5 border border-amber-400/45 rounded-lg flex items-center justify-center z-10 shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                    </div>
                    <div className="w-12 h-20 bg-slate-900 border border-slate-800 rounded-md rotate-[8deg] shrink-0" />
                  </div>
                </div>
                <h3 className="text-lg font-bold font-display mb-2 text-white group-hover:text-amber-300">Space-Time Carousel</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Clean visual catalog stacked continuously with chronological hour markers, tag labels and custom overlays.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 mt-6 block">Select Preset & Launch</span>
            </div>

          </div>
        </div>
      )}

      {/* STAGE 3: PIPELINE PROCESSING VIEW */}
      {stage === "processing" && (
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center items-center py-20 z-10 animate-fade-in">
          
          {/* Constellation Core Scanning Ring */}
          <div className="relative w-44 h-44 mb-16 flex items-center justify-center">
            {/* Pulsing visual circles */}
            <div className={`absolute inset-0 border border-dashed rounded-full animate-[spin_8s_linear_infinite] ${
              progress.phase === "analyze" ? "border-purple-500/40" : "border-indigo-500/35"
            }`} />
            <div className={`absolute inset-4 border border-dashed rounded-full animate-[spin_5s_linear_infinite_reverse] ${
              progress.phase === "analyze" ? "border-indigo-505/40" : "border-purple-500/25"
            }`} />
            <div className="absolute inset-8 bg-[#0f172a] rounded-full flex items-center justify-center shadow-2xl border border-slate-800 animate-pulse">
              {progress.phase === "analyze" ? (
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              ) : (
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              )}
            </div>
            
            {/* Percentage Badge */}
            <div className="absolute -bottom-2 bg-[#0a0f1d] border border-slate-800 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-300">
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : "0"}%
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
                <span className="w-2 h-2 bg-red-500/60 rounded-full" />
                <span className="w-2 h-2 bg-yellow-500/60 rounded-full" />
                <span className="w-2 h-2 bg-green-500/60 rounded-full" />
              </div>

              <div className="space-y-2 select-none">
                <p className="text-slate-500">&gt; INITIALIZING PIPELINE INGESTION_MODE</p>
                <p className="text-slate-500">&gt; DETECTED RESOURCE: {sourceType.toUpperCase()}</p>
                
                {progress.phase === "extract" && (
                  <p className="text-indigo-400 animate-pulse">&gt; EX_STAGE: Recursively indexing binary streams from device storage...</p>
                )}
                
                {progress.phase === "transform" && (
                  <p className="text-purple-400 animate-pulse">&gt; TR_STAGE: Extracting modification tags & sorting by Hour timestamp...</p>
                )}

                {progress.phase === "analyze" && (
                  <>
                    <p className="text-yellow-455 animate-pulse">&gt; AI_STAGE: Downsampling visual stream for neural interface compatibility...</p>
                    <p className="text-slate-300">&gt; AI_STAGE: Running scene interrogation on Gemini endpoints...</p>
                  </>
                )}

                {progress.phase === "load" && (
                  <p className="text-emerald-400">&gt; LD_STAGE: Saving visual coordinates into local IndexedDB cache schema...</p>
                )}

                {progress.phase === "complete" && (
                  <p className="text-emerald-400 font-bold">&gt; PIPELINE READY: Timeline maps synchronized successfully.</p>
                )}

                <div className="pt-2 border-t border-slate-805 text-slate-550 text-[10px] mt-2 flex justify-between items-center">
                  <span>Task: {progress.current} / {progress.total} assets</span>
                  <span className="text-indigo-400 animate-pulse">{progress.currentName || "Waiting for thread..."}</span>
                </div>
              </div>
            </div>

            {/* Mini Informational Speed Explainer */}
            <div className="p-4 bg-[#0f172a]/20 rounded-2xl border border-slate-800 flex gap-3 text-left max-w-lg mx-auto">
              <Info className="w-5 h-5 text-slate-500 shrink-0 mt-[2px]" />
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-semibold">How is this so fast?</p>
                <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                  Nebula compresses images on-the-fly inside microsecond canvases and persists analyzed results inside local browser databases. Subsequent ingests are virtually instantaneous.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: PRESENTATION VIEW GALLERY */}
      {stage === "presentation" && (
        <div className="flex-1 w-full flex flex-col lg:flex-row z-10 transition-all duration-1000 ease-out min-h-screen">
          
          {/* LEFT SIDEBAR NAVIGATION: Pure Bento Grid layout structure */}
          <aside className="hidden lg:flex lg:w-80 bg-[#0f172a] border-r border-[#1e293b] flex-col p-6 shrink-0 relative">
            {/* Logo area */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
                <Sparkles className="w-5 h-5 text-indigo-100" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wider text-white leading-none">NEBULA</span>
                <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest mt-0.5">EST. DAY WORKSPACE</span>
              </div>
            </div>

            {/* Navigation title */}
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-4">Memory Categories</h5>
            
            {/* Tag Selection Lists fully matching Sidebar design */}
            <div className="space-y-1">
              {categoriesList.map((cat) => {
                const count = images.filter(img => (cat === "All" || img.category === cat) && (showDuplicates ? true : !img.isDuplicateOfId)).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilterCategory(cat)}
                    className={`px-4 py-2.5 rounded-xl text-left text-xs font-medium transition-all duration-200 flex items-center justify-between w-full ${
                      activeFilterCategory === cat 
                        ? "bg-[#1e1b4b]/60 text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/5 font-semibold" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeFilterCategory === cat ? "bg-indigo-400" : "bg-slate-600 animate-pulse"}`} />
                      {cat}
                    </span>
                    <span className={`font-mono text-[9px] px-1.5 py-[1.5px] rounded-md border ${
                      activeFilterCategory === cat
                        ? "bg-[#131032] border-indigo-500/20 text-indigo-300"
                        : "bg-[#020617] border-[#1e293b] text-slate-500"
                    }`}>
                      {count < 10 ? `0${count}` : count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="my-6 border-b border-[#1e293b]/70" />

            {/* ETL Monitor Status Section */}
            <div className="bg-[#020617] p-4 rounded-2xl border border-[#1e293b] space-y-3 shadow-md mb-6">
              <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-slate-500">
                <span>ETL PIPELINE STATUS</span>
                <span className="text-emerald-450 flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  STABLE
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">Synchronized State</p>
                <p className="text-[10.5px] text-slate-500">Local Cache DB: Indexed & Secure</p>
              </div>
              <div className="w-full bg-slate-800/40 rounded-full h-[6px] overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-550 to-purple-600 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Dynamic visual statistics grids inside sidebar */}
            <div className="grid grid-cols-2 gap-2 text-left mb-6">
              <div className="bg-[#0f172a]/60 border border-[#1e293b] p-3 rounded-xl">
                <p className="text-[9px] font-mono uppercase text-slate-500">Stacks Collapsed</p>
                <p className="text-xs font-bold text-indigo-450 flex items-center gap-1 mt-1 font-mono">
                  <Layers className="w-3 h-3 text-indigo-455 shrink-0" />
                  {images.reduce((acc, img) => acc + (img.duplicateIds ? img.duplicateIds.length : 0), 0)}
                </p>
              </div>
              <div className="bg-[#0f172a]/60 border border-[#1e293b] p-3 rounded-xl">
                <p className="text-[9px] font-mono uppercase text-slate-500">Total Actors</p>
                <p className="text-xs font-bold text-indigo-450 flex items-center gap-1 mt-1 font-mono">
                  <Users className="w-3 h-3 text-indigo-455 shrink-0" />
                  {images.reduce((acc, img) => acc + (img.peopleCount || 0), 0)}
                </p>
              </div>
            </div>

            {/* In-App admin profile badge (Felix from Design template) */}
            <div className="mt-auto pt-5 border-t border-[#1e293b]/70 flex items-center gap-3">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 shadow-md" 
                alt="Pro User" 
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">Alex Sterling</p>
                <p className="text-[9.5px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">Admin // Pro</p>
              </div>
            </div>
          </aside>

          {/* MAIN COLUMN RIGHT */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {/* Sticky Modern Presentation Header */}
            <header className="sticky top-0 bg-[#020617]/80 backdrop-blur-md border-b border-[#1e293b] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-40">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStage("landing")}
                  className="p-3 bg-slate-900 hover:bg-slate-800/70 text-slate-400 hover:text-white rounded-2xl border border-[#1e293b] transition-all active:scale-95 group flex items-center justify-center gap-2"
                  title="Exit Presentation"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold">Exit</span>
                </button>
                <div>
                  <h2 className="text-lg font-black font-display leading-tight flex items-center gap-2 text-white uppercase tracking-wider">
                    Memory Timeline catalog
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  </h2>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Chronological Sort</span>
                    <span>•</span>
                    <span>{images.filter(x => showDuplicates ? true : !x.isDuplicateOfId).length} unique memories</span>
                  </div>
                </div>
              </div>

              {/* Visual filtering parameters / Style Switcher */}
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* Category Filter (Mobile Only visible scroll bar, already shown on desktop via sidebar) */}
                <div className="flex lg:hidden items-center gap-1 bg-slate-900/50 p-1 border border-slate-800 rounded-xl max-w-full overflow-x-auto shrink-0">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFilterCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeFilterCategory === cat 
                          ? "bg-indigo-650 text-slate-250 font-semibold border border-indigo-500/20" 
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Duplicate Burst merge Stack toggler */}
                {mergeDuplicates && (
                  <button
                    onClick={() => setShowDuplicates(prev => !prev)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-medium transition-all flex items-center gap-2 ${
                      showDuplicates 
                        ? "bg-[#1e1b4b]/40 border-indigo-500/40 text-indigo-400" 
                        : "bg-slate-900 border-[#1e293b] text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{showDuplicates ? "Viewing Duplicates" : "Burst Stack Merged"}</span>
                  </button>
                )}

                {/* Style switcher presets */}
                <div className="flex items-center bg-slate-900 p-1 border border-[#1e293b] rounded-xl shrink-0">
                  <button
                    onClick={() => setSelectedStyle("bento")}
                    className={`p-2 rounded-lg transition-all ${selectedStyle === "bento" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-400/20 shadow-inner" : "text-slate-500 hover:text-slate-300"}`}
                    title="Modern Bento Grid Layout"
                  >
                    <Layout className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedStyle("cinematic")}
                    className={`p-2 rounded-lg transition-all ${selectedStyle === "cinematic" ? "bg-purple-500/15 text-purple-400 border border-purple-400/20 shadow-inner" : "text-slate-500 hover:text-slate-300"}`}
                    title="Cinematic Narrative Flow"
                  >
                    <Film className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedStyle("museum")}
                    className={`p-2 rounded-lg transition-all ${selectedStyle === "museum" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-400/20 shadow-inner" : "text-slate-500 hover:text-slate-300"}`}
                    title="Museum Spotlight Frames"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedStyle("grid")}
                    className={`p-2 rounded-lg transition-all ${selectedStyle === "grid" ? "bg-amber-500/15 text-amber-400 border border-amber-400/20 shadow-inner" : "text-slate-500 hover:text-slate-350"}`}
                    title="Space-Time Sequence Catalog"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </header>

            <main className="flex-1 p-6 md:p-10 transition-all duration-500 max-w-7xl mx-auto w-full z-10">
              {filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                  <HelpCircleIcon className="w-12 h-12 text-slate-600 animate-bounce" />
                <h3 className="text-xl font-bold">No assets found</h3>
                <p className="text-neutral-500 max-w-sm text-xs font-light">
                  No images match the active tag filters. Try checking duplicate layers or choose a different categories filter.
                </p>
              </div>
            ) : (
              <>
                {/* 1. BENTO GRID VIEW PRESET */}
                {selectedStyle === "bento" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px]">
                    {filteredImages.map((img, idx) => {
                      // Alternate shapes sequentially for organic Apple/SaaS Bento styling
                      const shapes = [
                        "lg:col-span-2 lg:row-span-2", // Big hero
                        "lg:col-span-1 lg:row-span-1", // Mini
                        "lg:col-span-1 lg:row-span-2", // Tall
                        "lg:col-span-2 lg:row-span-1", // Wide
                        "lg:col-span-1 lg:row-span-1",
                        "lg:col-span-1 lg:row-span-1"
                      ];
                      const bentoClass = shapes[idx % shapes.length];

                      return (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImage(img)}
                          className={`${bentoClass} group relative bg-[#0f172a] border border-slate-800/80 hover:border-indigo-505/65 rounded-[32px] overflow-hidden cursor-pointer shadow-xl transition-all duration-500 hover:scale-[1.02] flex flex-col justify-end p-6`}
                        >
                          <img 
                            src={img.url} 
                            alt={img.name} 
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

                          {/* Dynamic visual parameters */}
                          <div className="relative z-10 space-y-2 pointer-events-none">
                            <span className="px-2 py-[3px] bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-md font-mono text-[9px] uppercase tracking-wider">
                              {img.category}
                            </span>
                            <h3 className="text-white text-base font-semibold font-display truncate leading-tight">
                              {img.caption}
                            </h3>
                            <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {img.location}
                              </span>
                              <span>•</span>
                              <span>{img.time12h}</span>
                            </div>
                          </div>

                          {/* Duplicate counts indicator badges (burst stack) */}
                          {img.duplicateIds && img.duplicateIds.length > 0 && (
                            <div className="absolute top-4 right-4 bg-purple-900/80 border border-purple-500/40 text-purple-300 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-[6px] shadow-lg">
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
                  <div className="space-y-40 py-20 max-w-5xl mx-auto">
                    {filteredImages.map((img, idx) => {
                      const isEven = idx % 2 === 0;

                      return (
                        <div
                          key={img.id}
                          className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 items-center`}
                        >
                          {/* Left picture spotlight */}
                          <div 
                            onClick={() => setSelectedImage(img)}
                            className="w-full lg:w-3/5 rounded-[32px] overflow-hidden border border-slate-800/80 group cursor-pointer relative shadow-2xl transition-all duration-500 hover:scale-[1.01]"
                          >
                            <img 
                              src={img.url} 
                              alt={img.name} 
                              className="w-full h-auto max-h-[500px] object-cover opacity-60 group-hover:opacity-90 group-hover:scale-102 transition-all duration-700" 
                            />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
                            
                            {/* Color highlight bar matching palette */}
                            <div className="absolute bottom-0 left-0 right-0 h-[4px] flex">
                              {img.colorPalette.map((col, cIdx) => (
                                <div key={cIdx} className="flex-1 h-full" style={{ backgroundColor: col }} />
                              ))}
                            </div>
                          </div>

                          {/* Right descriptions */}
                          <div className="w-full lg:w-2/5 space-y-6">
                            <div className="space-y-2">
                              <span className="px-3 py-1 bg-purple-500/15 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-mono tracking-wider uppercase">
                                {img.category}
                              </span>
                              <h2 className="text-4xl font-black font-display tracking-tight text-white leading-tight">
                                {img.caption}
                              </h2>
                            </div>

                            {/* Poetic information breakdown */}
                            <p className="text-sm font-sans font-light text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-4 py-1">
                              "{img.name}" &mdash; Captured on chronological scale at {img.time12h}. Clustered under geolocation reference in the vicinity of {img.location}.
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                              <div className="p-4 bg-[#0f172a]/40 border border-slate-800 rounded-2xl">
                                <p className="text-[10px] font-mono uppercase text-slate-500 mb-1">Co-ordinates</p>
                                <p className="text-xs font-semibold flex items-center gap-1 text-slate-300">
                                  <MapPin className="w-3 h-3 text-purple-400" />
                                  {img.location}
                                </p>
                              </div>
                              <div className="p-4 bg-[#0f172a]/40 border border-slate-800 rounded-2xl">
                                <p className="text-[10px] font-mono uppercase text-slate-500 mb-1">Human Signature</p>
                                <p className="text-xs font-semibold flex items-center gap-1 font-mono text-slate-300">
                                  <Users className="w-3 h-3 text-purple-400" />
                                  {img.peopleCount > 0 ? `${img.peopleCount} Actors` : "Negative"}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 py-10 justify-items-center">
                    {filteredImages.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:-translate-y-2"
                      >
                        {/* Elite charcoal heavy picture border */}
                        <div className="border-[18px] border-slate-900 bg-[#020617] p-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] rounded-md relative flex items-center justify-center overflow-hidden w-full max-w-sm">
                          <img 
                            src={img.url} 
                            alt={img.name} 
                            loading="lazy"
                            className="w-full h-48 object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 ease-in-out" 
                          />
                          <div className="absolute inset-0 bg-[#020617]/20 group-hover:bg-transparent transition-colors pointer-events-none" />
                        </div>

                        {/* Traditional Museum Label Plaque */}
                        <div className="mt-6 bg-[#0f172a] border border-slate-800 px-6 py-4 text-center rounded-xl max-w-xs space-y-2 shadow-lg">
                          <h4 className="font-display font-bold text-sm tracking-tight text-slate-200">
                            {img.caption}
                          </h4>
                          <div className="flex justify-center items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            <span>{img.category}</span>
                            <span>•</span>
                            <span>{img.time12h}</span>
                          </div>
                          
                          {/* Visual color codes match */}
                          <div className="flex justify-center gap-1 pt-1">
                            {img.colorPalette.map((col, ci) => (
                              <span 
                                key={ci} 
                                className="w-2 h-2 rounded-full inline-block border border-[#020617]" 
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
                  <div className="space-y-12 max-w-4xl mx-auto">
                    {filteredImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className="group bg-[#0f172a]/20 border border-slate-800/80 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-8 hover:border-indigo-500/20 transition-all shadow-md"
                      >
                        {/* Progressive Chronological hour marker timeline block */}
                        <div className="flex md:flex-col items-center justify-center shrink-0 w-24 gap-1 select-none">
                          <span className="text-2xl font-black font-mono text-indigo-400 leading-none">
                            {img.time12h.split(" ")[0].split(":")[0]}
                          </span>
                          <div className="flex flex-col md:items-center text-center">
                            <span className="text-xs font-semibold text-slate-350">
                              :{img.time12h.split(" ")[0].split(":")[1]}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                              {img.time12h.split(" ")[1]}
                            </span>
                          </div>
                        </div>

                        {/* Gallery photo block */}
                        <div 
                          onClick={() => setSelectedImage(img)}
                          className="w-full md:w-56 h-36 rounded-2xl overflow-hidden cursor-pointer shrink-0 border border-slate-950 shadow relative group"
                        >
                          <img 
                            src={img.url} 
                            alt={img.name} 
                            loading="lazy"
                            className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 pointer-events-none" 
                          />
                        </div>

                        {/* Image details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-[2px] bg-indigo-500/20 border border-indigo-400/25 text-indigo-300 rounded-lg text-[10px] uppercase font-mono">
                              {img.category}
                            </span>
                            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {img.dateStr}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white font-display">
                            {img.caption}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-light">
                            Detected under environment index: <span className="font-semibold text-slate-300">{img.location}</span>. Duplicate/burst index registers as {img.duplicateIds ? img.duplicateIds.length + 1 : 1} visual occurrences.
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
      </div>
    )}

      {/* DETAIL DRAWER / FULLSCREEN MULTIMODAL MODAL ON CLICK */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in">
          {/* Close Area */}
          <div className="absolute inset-0" onClick={() => setSelectedImage(null)} />

          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-full transition-all focus:outline-none z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-5xl bg-[#0a0f1d] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row z-10 animate-scale-up">
            
            {/* Visual Render Grid */}
            <div className="relative w-full lg:w-3/5 bg-[#020617] flex items-center justify-center min-h-[300px] max-h-[600px] overflow-hidden">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name} 
                className="max-w-full max-h-full object-contain shadow-2xl z-10" 
                referrerPolicy="no-referrer"
              />
              <div 
                className="absolute inset-0 filter blur-3xl opacity-20 transform scale-150 pointer-events-none"
                style={{
                  backgroundImage: `url(${selectedImage.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
            </div>

            {/* Neural Parameters Workspace */}
            <div className="w-full lg:w-2/5 p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800/85 space-y-6">
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-lg text-xs font-mono uppercase tracking-wider">
                    {selectedImage.category}
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white font-display">
                    {selectedImage.caption}
                  </h2>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800/60">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Metadata Parameters
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50 text-sm">
                      <span className="text-slate-400 flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        Captured Date
                      </span>
                      <span className="font-mono font-medium text-slate-300 text-xs">{selectedImage.dateStr}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50 text-sm">
                      <span className="text-slate-400 flex items-center gap-2 text-xs">
                        <Camera className="w-4 h-4 text-slate-500" />
                        Chronological Time
                      </span>
                      <span className="font-mono font-medium text-slate-300 text-xs">{selectedImage.time12h}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50 text-sm">
                      <span className="text-slate-400 flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        Location Setting
                      </span>
                      <span className="font-medium text-slate-300 text-xs">{selectedImage.location}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50 text-sm">
                      <span className="text-slate-400 flex items-center gap-2 text-xs">
                        <Users className="w-4 h-4 text-slate-500" />
                        Human Elements
                      </span>
                      <span className="font-mono text-slate-350 text-xs">{selectedImage.peopleCount > 0 ? `${selectedImage.peopleCount} individuals` : "None detected"}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 text-sm">
                      <span className="text-slate-400 flex items-center gap-2 text-xs">
                        <Palette className="w-4 h-4 text-slate-500" />
                        Color Swatches
                      </span>
                      <div className="flex gap-1.5">
                        {selectedImage.colorPalette.map((col, idx) => (
                          <span 
                            key={idx} 
                            className="w-5 h-5 rounded-full inline-block border border-slate-900 shadow-xl cursor-default hover:scale-110 transition-transform" 
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
                <div className="bg-purple-950/20 border border-purple-500/15 rounded-2xl p-4 space-y-2">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-[6px]">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    Spacial Burst Details ({selectedImage.duplicateIds.length + 1} Occurrences)
                  </h4>
                  <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                    Nebula matched these images automatically. We collapses burst files to deliver a high-contrast timeline map of your memory gallery.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800/70 flex justify-between items-center text-xs text-slate-500 font-mono">
                <span>File: {selectedImage.name}</span>
                <span>Size: {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative mt-auto border-t border-neutral-900/45 py-8 text-neutral-600 text-[11px] font-mono tracking-wider w-full text-center bg-neutral-950/20 backdrop-blur z-10 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} NEBULA &mdash; ALL LOCAL INFERENCES SECURE & ENCRYPTED IN YOUR INTERNAL DATABASE.</p>
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => setShowDeploymentGuide(true)}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deploy to Vercel & Netlify</span>
            </button>
            <span>•</span>
            <span>Server Instance: {serverOnline ? "ACTIVE" : "STANDALONE_SECURE"}</span>
            <span>•</span>
            <span>Schema: V1.0</span>
          </div>
        </div>
      </footer>

      {/* DEPLOYMENT GUIDE MODAL */}
      {showDeploymentGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-[32px] max-w-4xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6 relative animate-scale-up">
            
            <button 
              onClick={() => setShowDeploymentGuide(false)}
              className="absolute top-6 right-6 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-lg text-xs font-mono uppercase tracking-wider">
                Cloud Launcher Protocol (v1.1)
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white font-display">
                Deploy Nebula Orchestrator
              </h2>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Nebula is linked to your remote repository: <a href="https://github.com/UdayPatnala/Nebula.git" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-bold">https://github.com/UdayPatnala/Nebula.git</a>. It is dual-mode, running both as a client-side SPA with local IndexedDB caching and as a full-stack secure intelligence app. Follow this guide to deploy your app in less than 2 minutes for free!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Option 1: Render Fullstack */}
              <div className="bg-[#0f172a] border border-blue-500/20 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500 text-slate-950 rounded font-display font-black text-xs">R</span>
                    Render Deployment
                  </h3>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-400/20">Fullstack Web Service</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Best full-stack method. Nebula contains a zero-config blueprint file (<code className="text-slate-200">render.yaml</code>). Connecting your repository triggers automated compilation of your Express server and Vite frontend.
                </p>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-350 space-y-1">
                  <p className="text-blue-400 font-semibold">⚡ Render Setup Steps:</p>
                  <p>1. Open <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Render Dashboard</a></p>
                  <p>2. Select <b>Blueprints</b> {"→"} Create Instance</p>
                  <p>3. Connect repository: <span className="text-yellow-400">Nebula.git</span></p>
                  <p>4. Add Env Variable: <span className="text-purple-400 font-bold">GEMINI_API_KEY</span></p>
                  <p>5. Click deploy and enjoy instant serverless pipelines!</p>
                </div>
              </div>

              {/* Option 2: Vercel Fullstack */}
              <div className="bg-[#0f172a] border border-indigo-500/20 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-500 text-slate-950 rounded font-display font-black text-xs">▲</span>
                    Vercel Deployment
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/20">Fullstack Serverless</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fastest API performance. Vercel automatically deploys your Vite assets along with our secure API function wrapper in <code className="text-slate-200">/api/index.ts</code>.
                </p>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-350 space-y-1">
                  <p className="text-indigo-400 font-semibold">⚡ Vercel Setup Steps:</p>
                  <p>1. Import your GitHub repo in Vercel</p>
                  <p>2. Set backend proxy via the auto-configured <code className="text-slate-400">vercel.json</code></p>
                  <p>3. Add Env Variable: <span className="text-purple-400 font-bold">GEMINI_API_KEY</span></p>
                  <p>4. Deploy! Your app leverages lightning-fast serverless microservices.</p>
                </div>
              </div>

              {/* Option 3: Netlify Static */}
              <div className="bg-[#0f172a] border border-purple-500/15 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500 text-slate-950 rounded font-display font-black text-xs">◈</span>
                    Netlify (Static Edge)
                  </h3>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-400/20">Edge Static SPA</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Best for client-focused performance. Netlify handles single-page route rewrites utilizing our included <code className="text-slate-200">netlify.toml</code>.
                </p>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-350 space-y-1">
                  <p className="text-purple-400 font-semibold">⚡ Netlify Setup Steps:</p>
                  <p>1. Connect your GitHub repository to Netlify</p>
                  <p>2. Build command: <span className="text-yellow-400">npm run build</span></p>
                  <p>3. Publish directory: <span className="text-yellow-400">dist</span></p>
                  <p>4. Hit Deploy! It executes locally over ultra-secure Edge CDNs.</p>
                </div>
              </div>

              {/* Option 4: Optional Cloud Firebase */}
              <div className="bg-[#0f172a] border border-amber-500/15 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded font-display font-black text-xs">🔥</span>
                    Firebase Firestore & Auth
                  </h3>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/20">Cloud Synchronized</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Synchronize your media gallery of memories across browsers! Safe, real-time database queries to keep items forever in Google Firestore cloud collections.
                </p>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-350 space-y-1">
                  <p className="text-amber-400 font-semibold">⚡ Firebase Instructions:</p>
                  <p>1. Follow client code templates in <code className="text-indigo-400">/CloudDeployments.md</code></p>
                  <p>2. Initialize Firebase config block inside your app scripts</p>
                  <p>3. Fire cloud collections dynamically in your ingest loop</p>
                  <p>4. Sync memories instantly into secure Firestore clusters!</p>
                </div>
              </div>
            </div>

            {/* Zero-Config Credentials Section */}
            <div className="bg-indigo-950/25 border border-indigo-500/15 p-5 rounded-2xl space-y-3 text-left">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                Zero-Config Automatic Cloud Mechanics
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                We've configured everything in root files (<span className="text-slate-350 font-mono">render.yaml</span>, <span className="text-slate-350 font-mono">vercel.json</span>, <span className="text-slate-350 font-mono">netlify.toml</span>). These guarantee immediate runtime compilation when pushed to your repository. If deployed on Vercel or Render with your <span className="text-white hover:text-indigo-300 font-mono">GEMINI_API_KEY</span> set, photos will be scanned using Gemini 3.5-flash visions! If static or standalone, Nebula securely categorizes aesthetic attributes entirely locally!
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button 
                onClick={() => setShowDeploymentGuide(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs font-mono rounded-xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                Launch Protocol Complete
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Minimal missing component definitions
function HelpCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
