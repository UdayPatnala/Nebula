/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from "jszip";
import { ImageItem } from "../types";

/**
 * Packages a list of images (and their metadata) into a download-ready JSZip Blob.
 */
export async function generateTimelineZip(filteredImages: ImageItem[]): Promise<Blob> {
  const zip = new JSZip();

  // Create folder for images inside the ZIP to keep it highly organized
  const imagesFolder = zip.folder("images");

  // Fetch all filtered images in parallel and package them as binary logs
  await Promise.all(
    filteredImages.map(async (img, idx) => {
      if (!img.url) return;

      try {
        const res = await fetch(img.url);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const blob = await res.blob();

        // Generate a clean indexed filename to prevent duplicates and keep chronological order
        const filename = `${idx + 1}_${img.name || `image_${img.id}.jpg`}`;
        if (imagesFolder) {
          imagesFolder.file(filename, blob);
        } else {
          zip.file(filename, blob);
        }
      } catch (fetchErr) {
        console.error(`Error downloading image ${img.name || img.id} for ZIP:`, fetchErr);
      }
    })
  );

  // Map and sort matching metadata structures
  const sortedMetadata = filteredImages.map((img, idx) => ({
    index: idx + 1,
    id: img.id,
    filenameInZip: `${idx + 1}_${img.name || `image_${img.id}.jpg`}`,
    originalName: img.name,
    category: img.category,
    location: img.location,
    caption: img.caption,
    peopleCount: img.peopleCount,
    colorPalette: img.colorPalette,
    dateStr: img.dateStr,
    time12h: img.time12h,
    hour24: img.hour24,
    size: img.size,
    timestamp: img.timestamp,
    isDuplicateOfId: img.isDuplicateOfId || null,
    duplicateIds: img.duplicateIds || [],
  }));

  // Append human-readable formatted system JSON telemetry
  zip.file(
    "metadata.json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalImages: filteredImages.length,
        timeline: sortedMetadata,
      },
      null,
      2
    )
  );

  // Compile output buffer
  return await zip.generateAsync({ type: "blob" });
}

/**
 * Triggers a browser-compliant binary blob download for zip modules
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const dlUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = dlUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release URL representation memory safely
  URL.revokeObjectURL(dlUrl);
}
