/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useReducer, useEffect, useCallback, useRef } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { ImageItem, PresentationStyle, PipelineProgress } from "../types";
import { getCachedAnalysis, setCachedAnalysis } from "../lib/idb";
import { PRELOADED_CONSTELLATION } from "../data";
import {
  auth,
  syncMemoriesToCloud,
  fetchMemoriesFromCloud,
  loginWithGoogle,
  logoutUser,
} from "../lib/firebase";
import {
  downsizeImage,
  detectDuplicates,
  generateLocalContext,
} from "../lib/imageProcessing";
import { generateTimelineZip, triggerBlobDownload } from "../lib/exportUtils";

// Type-safe File System Access API definitions
export interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  getFile(): Promise<File>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  values(): AsyncIterableIterator<FileSystemHandle>;
}

export interface NebulaState {
  stage: "landing" | "style" | "processing" | "presentation";
  selectedFiles: File[];
  sourceType: "folder" | "files" | "demo";
  images: ImageItem[];
  selectedStyle: PresentationStyle;
  progress: PipelineProgress;
  mergeDuplicates: boolean;
  isDemoPreloading: boolean;
  selectedImage: ImageItem | null;
  activeFilterCategory: string;
  activeFilterLocation: string;
  activeFilterDate: string;
  showDuplicates: boolean;
  serverOnline: boolean | null;
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  isSyncing: boolean;
  syncStatus: "idle" | "syncing" | "success" | "error";
  cloudActive: boolean;
  isDownloadingZip: boolean;
}

type NebulaAction =
  | { type: "SET_STAGE"; payload: "landing" | "style" | "processing" | "presentation" }
  | { type: "SET_SELECTED_FILES"; payload: File[] }
  | { type: "SET_SOURCE_TYPE"; payload: "folder" | "files" | "demo" }
  | { type: "SET_IMAGES"; payload: ImageItem[] }
  | { type: "SET_SELECTED_STYLE"; payload: PresentationStyle }
  | { type: "SET_PROGRESS"; payload: PipelineProgress }
  | { type: "SET_MERGE_DUPLICATES"; payload: boolean }
  | { type: "SET_IS_DEMO_PRELOADING"; payload: boolean }
  | { type: "SET_SELECTED_IMAGE"; payload: ImageItem | null }
  | { type: "SET_FILTER_CATEGORY"; payload: string }
  | { type: "SET_FILTER_LOCATION"; payload: string }
  | { type: "SET_FILTER_DATE"; payload: string }
  | { type: "SET_SHOW_DUPLICATES"; payload: boolean }
  | { type: "SET_SERVER_ONLINE"; payload: boolean | null }
  | { type: "SET_CURRENT_USER"; payload: FirebaseUser | null }
  | { type: "SET_AUTH_LOADING"; payload: boolean }
  | { type: "SET_IS_SYNCING"; payload: boolean }
  | { type: "SET_SYNC_STATUS"; payload: "idle" | "syncing" | "success" | "error" }
  | { type: "SET_CLOUD_ACTIVE"; payload: boolean }
  | { type: "SET_DOWNLOADING_ZIP"; payload: boolean };

const initialState: NebulaState = {
  stage: "landing",
  selectedFiles: [],
  sourceType: "demo",
  images: [],
  selectedStyle: "bento",
  progress: { phase: "idle", total: 0, current: 0, currentName: "" },
  mergeDuplicates: true,
  isDemoPreloading: false,
  selectedImage: null,
  activeFilterCategory: "All",
  activeFilterLocation: "All",
  activeFilterDate: "All",
  showDuplicates: false,
  serverOnline: null,
  currentUser: null,
  authLoading: true,
  isSyncing: false,
  syncStatus: "idle",
  cloudActive: false,
  isDownloadingZip: false,
};

function nebulaReducer(state: NebulaState, action: NebulaAction): NebulaState {
  switch (action.type) {
    case "SET_STAGE":
      return { ...state, stage: action.payload };
    case "SET_SELECTED_FILES":
      return { ...state, selectedFiles: action.payload };
    case "SET_SOURCE_TYPE":
      return { ...state, sourceType: action.payload };
    case "SET_IMAGES":
      return { ...state, images: action.payload };
    case "SET_SELECTED_STYLE":
      return { ...state, selectedStyle: action.payload };
    case "SET_PROGRESS":
      return { ...state, progress: action.payload };
    case "SET_MERGE_DUPLICATES":
      return { ...state, mergeDuplicates: action.payload };
    case "SET_IS_DEMO_PRELOADING":
      return { ...state, isDemoPreloading: action.payload };
    case "SET_SELECTED_IMAGE":
      return { ...state, selectedImage: action.payload };
    case "SET_FILTER_CATEGORY":
      return { ...state, activeFilterCategory: action.payload };
    case "SET_FILTER_LOCATION":
      return { ...state, activeFilterLocation: action.payload };
    case "SET_FILTER_DATE":
      return { ...state, activeFilterDate: action.payload };
    case "SET_SHOW_DUPLICATES":
      return { ...state, showDuplicates: action.payload };
    case "SET_SERVER_ONLINE":
      return { ...state, serverOnline: action.payload };
    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload, cloudActive: !!action.payload };
    case "SET_AUTH_LOADING":
      return { ...state, authLoading: action.payload };
    case "SET_IS_SYNCING":
      return { ...state, isSyncing: action.payload };
    case "SET_SYNC_STATUS":
      return { ...state, syncStatus: action.payload };
    case "SET_CLOUD_ACTIVE":
      return { ...state, cloudActive: action.payload };
    case "SET_DOWNLOADING_ZIP":
      return { ...state, isDownloadingZip: action.payload };
    default:
      return state;
  }
}

export function useNebulaPipeline() {
  const [state, dispatch] = useReducer(nebulaReducer, initialState);

  // Set to track active blob URLs to prevent memory leaks (Pillar 10)
  const activeBlobUrlsRef = useRef<Set<string>>(new Set());

  const cleanupAllBlobs = useCallback(() => {
    activeBlobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
        console.log("Revoked local blob URL representation memory node:", url);
      } catch (err) {
        console.warn("Failed to revoke blob URL representation:", url, err);
      }
    });
    activeBlobUrlsRef.current.clear();
  }, []);

  // Guarantee memory cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllBlobs();
    };
  }, [cleanupAllBlobs]);

  // Synchronize Google Authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: "SET_CURRENT_USER", payload: user });
      dispatch({ type: "SET_AUTH_LOADING", payload: false });
      if (user) {
        try {
          const cloudMemories = await fetchMemoriesFromCloud(user.uid);
          if (cloudMemories.length > 0) {
            dispatch({ type: "SET_IMAGES", payload: cloudMemories });
          }
        } catch (error: unknown) {
          console.warn("Could not load cloud memories:", error instanceof Error ? error.message : String(error));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Check if Gemini Vision Server config is reachable
  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data: { hasKey: boolean }) => {
        dispatch({ type: "SET_SERVER_ONLINE", payload: data.hasKey });
      })
      .catch((err: unknown) => {
        console.warn("Backend configuration key unreachable:", err instanceof Error ? err.message : String(err));
        dispatch({ type: "SET_SERVER_ONLINE", payload: false });
      });
  }, []);

  // Directory recursive scanner
  const scanDirRecursive = useCallback(async (dirHandle: FileSystemDirectoryHandle, fileList: File[]) => {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        if (file.type.startsWith("image/")) {
          fileList.push(file);
        }
      } else if (entry.kind === "directory") {
        const childDirHandle = entry as FileSystemDirectoryHandle;
        await scanDirRecursive(childDirHandle, fileList);
      }
    }
  }, []);

  // Folder selection API
  const handleFolderIngestion = useCallback(async () => {
    if (!("showDirectoryPicker" in window)) {
      alert("Your browser does not support the Directory Picker API. Please upload files directly or use the Demo.");
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
      dispatch({
        type: "SET_PROGRESS",
        payload: { phase: "extract", total: 0, current: 0, currentName: "Scanning Directory..." },
      });
      dispatch({ type: "SET_STAGE", payload: "style" });
      dispatch({ type: "SET_SOURCE_TYPE", payload: "folder" });

      const fileList: File[] = [];
      await scanDirRecursive(dirHandle, fileList);

      if (fileList.length === 0) {
        alert("No image files discovered inside the selected folder path.");
        dispatch({ type: "SET_STAGE", payload: "landing" });
        return;
      }

      dispatch({ type: "SET_SELECTED_FILES", payload: fileList });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Directory Scan Failure:", err);
        alert(`Failed to scan. Error: ${err.message}`);
      }
      dispatch({ type: "SET_STAGE", payload: "landing" });
    }
  }, [scanDirRecursive]);

  // Direct file list selection change
  const handleFileSelectionChange = useCallback((files: File[]) => {
    const items = files.filter((f) => f.type.startsWith("image/"));
    if (items.length === 0) {
      alert("Please choose at least one valid image file.");
      return;
    }
    // Intelligently detect if files upload was via folder fallback directory
    const isFolder = items.some((item) => !!item.webkitRelativePath);
    dispatch({ type: "SET_SOURCE_TYPE", payload: isFolder ? "folder" : "files" });
    dispatch({ type: "SET_SELECTED_FILES", payload: items });
    dispatch({ type: "SET_STAGE", payload: "style" });
  }, []);

  // Demo dynamic ingestion launcher
  const handleLaunchDemoConstellation = useCallback(() => {
    dispatch({ type: "SET_IS_DEMO_PRELOADING", payload: true });
    dispatch({ type: "SET_SOURCE_TYPE", payload: "demo" });
    dispatch({
      type: "SET_PROGRESS",
      payload: { phase: "extract", total: PRELOADED_CONSTELLATION.length, current: 0, currentName: "Summoning Nebula constellation cores..." },
    });
    dispatch({ type: "SET_STAGE", payload: "processing" });

    setTimeout(() => {
      dispatch({
        type: "SET_PROGRESS",
        payload: { phase: "analyze", total: PRELOADED_CONSTELLATION.length, current: 4, currentName: "Synthesizing deep-space visual layers..." },
      });
      setTimeout(() => {
        const sorted = [...PRELOADED_CONSTELLATION].sort((a, b) => a.hour24 - b.hour24);
        dispatch({ type: "SET_IMAGES", payload: sorted });
        dispatch({
          type: "SET_PROGRESS",
          payload: { phase: "complete", total: PRELOADED_CONSTELLATION.length, current: PRELOADED_CONSTELLATION.length, currentName: "Deep-space map complete." },
        });

        // Auto transition safely
        setTimeout(() => {
          dispatch({ type: "SET_STAGE", payload: "presentation" });
          dispatch({ type: "SET_IS_DEMO_PRELOADING", payload: false });
        }, 800);
      }, 1000);
    }, 1200);
  }, []);

// Helper to fetch with exponential backoff on retryable HTTP errors (Pillar 11)
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelayMs = 1200
): Promise<Response> {
  let delay = initialDelayMs;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      // Retry exclusively on 429 Limit Exceeded or transient 5xx Server Errors
      if (attempt < maxRetries && (response.status === 429 || response.status >= 500)) {
        console.warn(`Analysis failed with status ${response.status}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`Analysis dropped due to connection error. Retrying in ${delay}ms...`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("API analysis failed after maximum exponential retry steps.");
}

  // Core Orchestrated Pipeline Run
  const handleRunProcessingChain = useCallback(async (styleChoice: PresentationStyle) => {
    // Release previous local blob URLs before processing a new collection
    cleanupAllBlobs();

    dispatch({ type: "SET_SELECTED_STYLE", payload: styleChoice });
    dispatch({ type: "SET_STAGE", payload: "processing" });
    dispatch({
      type: "SET_PROGRESS",
      payload: { phase: "extract", total: state.selectedFiles.length, current: 0, currentName: "Aligning temporal streams..." },
    });

    const totalFiles = state.selectedFiles.length;
    const results = new Array<ImageItem | null>(totalFiles);

    // Modularized worker processor for a single file block inside pipeline (Pillar 3)
    const processSingleFile = async (file: File, index: number): Promise<ImageItem | null> => {
      try {
        const fileKey = `${file.size}-${file.lastModified}-${file.name}`;
        const blobUrl = URL.createObjectURL(file);
        activeBlobUrlsRef.current.add(blobUrl);

        // Extract metadata values
        const dateObj = new Date(file.lastModified);
        const dateStr = dateObj.toISOString().split("T")[0];

        let hour24 = dateObj.getHours() + dateObj.getMinutes() / 60;
        let hours = dateObj.getHours();
        const minutes = dateObj.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const time12h = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;

        let aiMetadata;

        // 1. Check client-side IndexedDB Cache first
        const cached = await getCachedAnalysis(fileKey);
        if (cached) {
          aiMetadata = {
            category: cached.category,
            timeOfDay: cached.timeOfDay,
            caption: cached.caption,
            peopleCount: cached.peopleCount,
            backgroundLocation: cached.backgroundLocation,
            colorPalette: cached.colorPalette,
          };
        } else {
          // 2. Call local express API with Web Worker downscaling
          if (state.serverOnline) {
            try {
              const base64Data = await downsizeImage(file);
              const response = await fetchWithBackoff("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64: base64Data, mimeType: file.type }),
              });
              if (response.ok) {
                const result = await response.json();
                aiMetadata = result;
                await setCachedAnalysis({
                  fileKey,
                  category: result.category,
                  timeOfDay: result.timeOfDay,
                  caption: result.caption,
                  peopleCount: result.peopleCount,
                  backgroundLocation: result.backgroundLocation,
                  colorPalette: result.colorPalette,
                  timestampStr: dateObj.toISOString(),
                });
              } else {
                throw new Error("Server analysis failed");
              }
            } catch (err: unknown) {
              console.warn("AI service failure, utilizing smart default logic:", err instanceof Error ? err.message : String(err));
              aiMetadata = generateLocalContext(file.name);
            }
          } else {
            // Fallback to fast local regex metadata tags
            aiMetadata = generateLocalContext(file.name);
          }
        }

        return {
          id: `img-${index}-${Date.now()}`,
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
          colorPalette: aiMetadata.colorPalette,
        };
      } catch (err) {
        console.error(`Inability to compile stream values for file ${file.name}:`, err);
        return null;
      }
    };

    // Concurrency pool limiter to process max 3 images in parallel (Pillar 11)
    const MAX_CONCURRENT_YIELDS = 3;
    let completedCount = 0;
    let activeQueueIndex = 0;

    const runQueueWorker = async () => {
      while (activeQueueIndex < totalFiles) {
        const idx = activeQueueIndex++;
        const file = state.selectedFiles[idx];

        dispatch({
          type: "SET_PROGRESS",
          payload: {
            phase: "analyze",
            total: totalFiles,
            current: completedCount + 1,
            currentName: `Orchestrating batch analysis... processed ${completedCount}/${totalFiles}. Scaling: "${file.name}"`,
          },
        });

        const imageItemResult = await processSingleFile(file, idx);
        results[idx] = imageItemResult;

        completedCount++;
        dispatch({
          type: "SET_PROGRESS",
          payload: {
            phase: "analyze",
            total: totalFiles,
            current: completedCount,
            currentName: `Orchestrating batch analysis... processed ${completedCount}/${totalFiles}`,
          },
        });
      }
    };

    // Spawn concurrent executor threads
    const concurrentWorkers = Array.from(
      { length: Math.min(MAX_CONCURRENT_YIELDS, totalFiles) },
      () => runQueueWorker()
    );

    await Promise.all(concurrentWorkers);

    // Keep only valid successfully processed images
    const timelineItems = results.filter((item): item is ImageItem => item !== null);

    // 3. Perform fast duplicate comparison
    dispatch({
      type: "SET_PROGRESS",
      payload: { phase: "analyze", total: totalFiles, current: totalFiles, currentName: "De-duplicating burst sequence..." },
    });

    try {
      const deduplicated = await detectDuplicates(timelineItems, state.mergeDuplicates);
      dispatch({ type: "SET_IMAGES", payload: deduplicated });

      dispatch({
        type: "SET_PROGRESS",
        payload: { phase: "complete", total: totalFiles, current: totalFiles, currentName: "Deduplication & sequence compiled successfully." },
      });

      // Synchronize results to Google Cloud Firestore if authenticated
      if (auth.currentUser) {
        dispatch({ type: "SET_SYNC_STATUS", payload: "syncing" });
        try {
          await syncMemoriesToCloud(auth.currentUser.uid, deduplicated);
          dispatch({ type: "SET_SYNC_STATUS", payload: "success" });
          setTimeout(() => dispatch({ type: "SET_SYNC_STATUS", payload: "idle" }), 3000);
        } catch (syncErr: unknown) {
          console.error("Firestore cloud sync failed:", syncErr);
          dispatch({ type: "SET_SYNC_STATUS", payload: "error" });
          setTimeout(() => dispatch({ type: "SET_SYNC_STATUS", payload: "idle" }), 4000);
        }
      }

      // Smooth display transition
      setTimeout(() => {
        dispatch({ type: "SET_STAGE", payload: "presentation" });
      }, 1200);
    } catch (dedupErr: unknown) {
      console.error("Deduplication phase failure:", dedupErr);
      dispatch({ type: "SET_IMAGES", payload: timelineItems });
      dispatch({ type: "SET_STAGE", payload: "presentation" });
    }
  }, [state.selectedFiles, state.mergeDuplicates, state.serverOnline, cleanupAllBlobs]);

  // Auth logins
  const handleGoogleLogin = useCallback(async () => {
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error("Login failure:", err);
      alert("Authentication failed. Please verify credentials.");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
      cleanupAllBlobs();
      dispatch({ type: "SET_IMAGES", payload: [] });
      dispatch({ type: "SET_STAGE", payload: "landing" });
    } catch (err: unknown) {
      console.error("Logout failure:", err);
    }
  }, [cleanupAllBlobs]);

  // ZIP Generation Downloader
  const handleDownloadTimelineZip = useCallback(async (filteredImages: ImageItem[]) => {
    if (filteredImages.length === 0) return;

    // Direct browser protection to warn user about high memory footprint zip operations (Pillar 11)
    const SAFE_ZIP_YIELD_COUNT = 50;
    const totalSizeEstimate = filteredImages.reduce((sum, img) => sum + (img.size || 0), 0);
    const totalSizeMB = totalSizeEstimate / (1024 * 1024);

    if (filteredImages.length > SAFE_ZIP_YIELD_COUNT || totalSizeMB > 150) {
      const proceed = window.confirm(
        `Warning: This timeline contains ${filteredImages.length} images (approx. ${totalSizeMB.toFixed(1)} MB).\n\n` +
        `Generating large archives inside the browser can expend considerable memory or crash the tab.\n\n` +
        `Do you want to continue with the timeline packaging?`
      );
      if (!proceed) return;
    }

    dispatch({ type: "SET_DOWNLOADING_ZIP", payload: true });

    try {
      const blob = await generateTimelineZip(filteredImages);
      const filename = `Nebula_Timeline_Export_${new Date().toISOString().split("T")[0]}.zip`;
      triggerBlobDownload(blob, filename);
    } catch (zipErr: unknown) {
      console.error("ZIP Generation failed:", zipErr);
      alert("Failed to build timeline archive zip file.");
    } finally {
      dispatch({ type: "SET_DOWNLOADING_ZIP", payload: false });
    }
  }, []);

  // Manual Cloud Sync
  const handleManualSync = useCallback(async () => {
    if (!state.currentUser) return;
    dispatch({ type: "SET_SYNC_STATUS", payload: "syncing" });
    try {
      await syncMemoriesToCloud(state.currentUser.uid, state.images);
      dispatch({ type: "SET_SYNC_STATUS", payload: "success" });
      setTimeout(() => dispatch({ type: "SET_SYNC_STATUS", payload: "idle" }), 3000);
    } catch (err: unknown) {
      console.error("Manual sync failed:", err);
      dispatch({ type: "SET_SYNC_STATUS", payload: "error" });
      setTimeout(() => dispatch({ type: "SET_SYNC_STATUS", payload: "idle" }), 4000);
    }
  }, [state.currentUser, state.images]);

  // Mutators for modal, list toggling, filtering
  const setSelectedImage = useCallback((img: ImageItem | null) => {
    dispatch({ type: "SET_SELECTED_IMAGE", payload: img });
  }, []);

  const setFilterCategory = useCallback((cat: string) => {
    dispatch({ type: "SET_FILTER_CATEGORY", payload: cat });
  }, []);

  const setFilterLocation = useCallback((loc: string) => {
    dispatch({ type: "SET_FILTER_LOCATION", payload: loc });
  }, []);

  const setFilterDate = useCallback((date: string) => {
    dispatch({ type: "SET_FILTER_DATE", payload: date });
  }, []);

  const setShowDuplicates = useCallback((show: boolean) => {
    dispatch({ type: "SET_SHOW_DUPLICATES", payload: show });
  }, []);

  const setMergeDuplicates = useCallback((merge: boolean) => {
    dispatch({ type: "SET_MERGE_DUPLICATES", payload: merge });
  }, []);

  const setStage = useCallback((stageVal: "landing" | "style" | "processing" | "presentation") => {
    dispatch({ type: "SET_STAGE", payload: stageVal });
  }, []);

  const setSelectedStyle = useCallback((style: PresentationStyle) => {
    dispatch({ type: "SET_SELECTED_STYLE", payload: style });
  }, []);

  return {
    ...state,
    setStage,
    setSelectedStyle,
    setSelectedImage,
    setFilterCategory,
    setFilterLocation,
    setFilterDate,
    setShowDuplicates,
    setMergeDuplicates,
    handleFolderIngestion,
    handleFileSelectionChange,
    handleLaunchDemoConstellation,
    handleRunProcessingChain,
    handleGoogleLogin,
    handleLogout,
    handleDownloadTimelineZip,
    handleManualSync,
  };
}
