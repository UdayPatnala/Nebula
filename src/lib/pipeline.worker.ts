/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageItem } from "../types";

// Setup event listener inside worker
self.addEventListener("message", async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === "downsize") {
    const { file } = payload as { file: File };
    try {
      const base64 = await downsizeImageInWorker(file);
      self.postMessage({ type: "downsize_success", payload: { base64 } });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: "downsize_error", error: errMsg });
    }
  } else if (type === "detect_duplicates") {
    const { timelineItems, mergeDuplicates } = payload as {
      timelineItems: ImageItem[];
      mergeDuplicates: boolean;
    };
    try {
      const processed = detectDuplicatesInWorker(timelineItems, mergeDuplicates);
      self.postMessage({ type: "detect_duplicates_success", payload: { timelineItems: processed } });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: "detect_duplicates_error", error: errMsg });
    }
  }
});

/**
 * Modern canvas resizing using createImageBitmap and OffscreenCanvas inside worker
 */
async function downsizeImageInWorker(file: File): Promise<string> {
  // createImageBitmap is natively supported inside workers
  const imageBitmap = await createImageBitmap(file);
  const maxDim = 420;
  let w = imageBitmap.width;
  let h = imageBitmap.height;

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

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D context for OffscreenCanvas");
  }

  ctx.drawImage(imageBitmap, 0, 0, w, h);

  // Convert OffscreenCanvas to a jpeg blob
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });

  // Read blob as Data URL / Base64
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("FileReader failed to convert resized image to Data URL"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Fast loop comparison to locate duplicates, identical sizing, or bursts
 */
function detectDuplicatesInWorker(timelineItems: ImageItem[], mergeDuplicates: boolean): ImageItem[] {
  // Sort by Day-time (Hour 24)
  const items = [...timelineItems].sort((a, b) => a.hour24 - b.hour24);

  if (!mergeDuplicates || items.length <= 1) {
    return items;
  }

  const merged: ImageItem[] = [];
  const duplicateGroupMap = new Map<string, string[]>();

  for (let k = 0; k < items.length; k++) {
    const current = items[k];
    let foundMasterIndex = -1;

    for (let m = 0; m < merged.length; m++) {
      const master = merged[m];
      const timeDiff = Math.abs(current.timestamp - master.timestamp);
      const sizeDiffPercent = Math.abs(current.size - master.size) / (master.size || 1);

      // Duplicate threshold: shot within 5 seconds + similar sizes, OR identical file names
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
      items[k] = current;
    } else {
      merged.push(current);
    }
  }

  // Inject child duplicates into master items
  return items.map((img) => {
    if (duplicateGroupMap.has(img.id)) {
      return {
        ...img,
        duplicateIds: duplicateGroupMap.get(img.id)
      };
    }
    return img;
  });
}
