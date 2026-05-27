/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = "NebulaMemoryDB";
const STORE_NAME = "image_cache";
const DB_VERSION = 1;

export interface CachedAnalysis {
  fileKey: string; // "size-lastModified-name"
  category: string;
  timeOfDay: string;
  caption: string;
  peopleCount: number;
  backgroundLocation: string;
  colorPalette: string[];
  timestampStr: string;
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "fileKey" });
      }
    };
  });
}

export async function getCachedAnalysis(fileKey: string): Promise<CachedAnalysis | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileKey);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn("IndexedDB get failure, proceeding without cache:", err);
    return null;
  }
}

export async function setCachedAnalysis(analysis: CachedAnalysis): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(analysis);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("IndexedDB put failure:", err);
  }
}

export async function clearCacheDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("IndexedDB clear failure:", err);
  }
}
