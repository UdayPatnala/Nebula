/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { ImageItem, PresentationStyle } from "../types";
import { downsizeImage } from "./imageProcessing";

/**
 * Converts a base64 string into a binary Blob object.
 */
function base64ToBlob(base64Str: string, mimeType = "image/jpeg"): Blob {
  const byteCharacters = atob(base64Str);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Helper to download and retrieve a Blob from a local blob: URL.
 */
async function fetchBlobFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download blob representation from URL: ${url}`);
  }
  return await response.blob();
}

/**
 * Generates a unique 9-character alphanumeric shared gallery ID.
 */
export function generateGalleryId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Uploads all local processed images to Firebase Storage, then registers 
 * the timeline metadata in Cloud Firestore as a persistent Shared Gallery.
 */
export async function createSharedGallery(
  images: ImageItem[],
  selectedStyle: PresentationStyle,
  selectedFiles: File[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<string> {
  const galleryId = generateGalleryId();
  const total = images.length;
  const processedImages: ImageItem[] = [];

  for (let i = 0; i < total; i++) {
    const img = images[i];
    const progressCount = i + 1;
    
    // Update progress state
    if (onProgress) {
      onProgress(
        progressCount,
        total,
        `Preparing visual assets: "${img.name}" (${progressCount}/${total})`
      );
    }

    // 1. If it's already a public HTTP/S URL (e.g. from the Demo Constellation), use as-is
    if (img.url && (img.url.startsWith("http://") || img.url.startsWith("https://"))) {
      processedImages.push({ ...img });
      continue;
    }

    // 2. Otherwise download and downscale, then upload to Firebase Storage
    try {
      let imageBlob: Blob | null = null;

      // Locate corresponding local File object to downscale
      const originalFile = selectedFiles.find(
        (f) => f.name === img.name && f.size === img.size
      );

      if (originalFile) {
        // Downscale raw file to save network bandwidth and Firebase storage quota free-tier space
        try {
          const base64Data = await downsizeImage(originalFile);
          imageBlob = base64ToBlob(base64Data);
        } catch (downscaleErr) {
          console.warn("Real-time downscaling failed, extracting raw blob fallback:", downscaleErr);
        }
      }

      // Fallback: fetch original local blob representation as image data directly
      if (!imageBlob && img.url.startsWith("blob:")) {
        imageBlob = await fetchBlobFromUrl(img.url);
      }

      if (!imageBlob) {
        throw new Error(`Unresolved local item representation for memory entry: ${img.id}`);
      }

      // Upload binary payload to Firebase Storage bucket
      const storagePath = `shared_galleries/${galleryId}/${img.id}.jpg`;
      const storageRef = ref(storage, storagePath);
      
      if (onProgress) {
        onProgress(
          progressCount,
          total,
          `Ingesting stream payload to cloud storage: "${img.name}"...`
        );
      }

      const uploadSnapshot = await uploadBytes(storageRef, imageBlob, {
        contentType: "image/jpeg",
        customMetadata: {
          galleryId,
          imageId: img.id,
          originalName: img.name
        }
      });

      // Resolve permanent public download URL
      const cloudProductUrl = await getDownloadURL(uploadSnapshot.ref);

      processedImages.push({
        ...img,
        url: cloudProductUrl // Swap local blob representation with durable remote cloud link
      });
    } catch (uploadErr) {
      console.error(`Firebase Storage upload failure for item ${img.name || img.id}:`, uploadErr);
      throw new Error(`Failed to upload timeline resource "${img.name}". Please ensure your internet connection is active.`);
    }
  }

  // 3. Store aggregated metadata document securely inside public Firestore shared_galleries node
  if (onProgress) {
    onProgress(total, total, "Structuring persistent space-time metadata coordinates...");
  }

  const galleryDocRef = doc(db, "shared_galleries", galleryId);
  await setDoc(galleryDocRef, {
    id: galleryId,
    style: selectedStyle,
    images: processedImages,
    createdAt: serverTimestamp()
  });

  return galleryId;
}
