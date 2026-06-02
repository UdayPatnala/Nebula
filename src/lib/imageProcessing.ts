/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageItem } from "../types";

// Helper to create the worker instance safely
let pipelineWorker: Worker | null = null;

function getWorker(): Worker {
  if (!pipelineWorker) {
    pipelineWorker = new Worker(
      new URL("./pipeline.worker.ts", import.meta.url),
      { type: "module" }
    );
  }
  return pipelineWorker;
}

/**
 * Offloads canvas-based downsizing to Web Worker.
 * Falls back to main thread Canvas if Web Worker isn't supported or fails.
 */
export async function downsizeImage(file: File): Promise<string> {
  try {
    const worker = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        const { type, payload, error } = e.data;
        if (type === "downsize_success") {
          worker.removeEventListener("message", handler);
          resolve(payload.base64);
        } else if (type === "downsize_error") {
          worker.removeEventListener("message", handler);
          reject(new Error(error));
        }
      };
      worker.addEventListener("message", handler);
      worker.postMessage({ type: "downsize", payload: { file } });
    });
  } catch (workerErr) {
    console.warn("Web Worker downsize failed, falling back to main-thread canvas:", workerErr);
    return downsizeImageMainThread(file);
  }
}

/**
 * Offloads duplicate/burst detection loop to Web Worker.
 * Falls back to main thread loop if Web Worker fails.
 */
export async function detectDuplicates(
  timelineItems: ImageItem[],
  mergeDuplicates: boolean
): Promise<ImageItem[]> {
  try {
    const worker = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        const { type, payload, error } = e.data;
        if (type === "detect_duplicates_success") {
          worker.removeEventListener("message", handler);
          resolve(payload.timelineItems);
        } else if (type === "detect_duplicates_error") {
          worker.removeEventListener("message", handler);
          reject(new Error(error));
        }
      };
      worker.addEventListener("message", handler);
      worker.postMessage({
        type: "detect_duplicates",
        payload: { timelineItems, mergeDuplicates },
      });
    });
  } catch (workerErr) {
    console.warn("Web Worker duplicate detection failed, falling back to main-thread processing:", workerErr);
    return detectDuplicatesMainThread(timelineItems, mergeDuplicates);
  }
}

/**
 * Main-thread fallback for image downsizing
 */
function downsizeImageMainThread(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context available on main thread"));

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
      
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(img.src);
      resolve(base64.split(",")[1]);
    };
    img.onerror = () => reject(new Error("Failed to load image in main-thread downsizing."));
  });
}

/**
 * Main-thread fallback for duplicate / burst group calculation
 */
function detectDuplicatesMainThread(timelineItems: ImageItem[], mergeDuplicates: boolean): ImageItem[] {
  const sorted = [...timelineItems].sort((a, b) => a.hour24 - b.hour24);
  if (!mergeDuplicates || sorted.length <= 1) {
    return sorted;
  }

  const merged: ImageItem[] = [];
  const duplicateGroupMap = new Map<string, string[]>();

  for (let k = 0; k < sorted.length; k++) {
    const current = sorted[k];
    let foundMasterIndex = -1;

    for (let m = 0; m < merged.length; m++) {
      const master = merged[m];
      const timeDiff = Math.abs(current.timestamp - master.timestamp);
      const sizeDiffPercent = Math.abs(current.size - master.size) / (master.size || 1);

      const isTimeBurst = timeDiff <= 5000 && sizeDiffPercent < 0.15;
      const isExactName = current.name === master.name && current.size === master.size;

      if (isTimeBurst || isExactName) {
        foundMasterIndex = m;
        break;
      }
    }

    if (foundMasterIndex !== -1) {
      const master = merged[foundMasterIndex];
      current.isDuplicateOfId = master.id;
      
      if (!duplicateGroupMap.has(master.id)) {
        duplicateGroupMap.set(master.id, []);
      }
      duplicateGroupMap.get(master.id)!.push(current.id);
      sorted[k] = current;
    } else {
      merged.push(current);
    }
  }

  return sorted.map((img) => {
    if (duplicateGroupMap.has(img.id)) {
      return {
        ...img,
        duplicateIds: duplicateGroupMap.get(img.id)
      };
    }
    return img;
  });
}

/**
 * Client-side quick majestic visual context fallback generator
 */
export function generateLocalContext(filename: string) {
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
}

