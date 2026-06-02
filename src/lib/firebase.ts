/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  serverTimestamp, 
  getDocFromServer
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ImageItem } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

const resolvedFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

// Initialize official Firebase App client
const app = initializeApp(resolvedFirebaseConfig);

const firestoreDatabaseId = (
  import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
  firebaseConfig.firestoreDatabaseId
).trim();

// Use a named Firestore database only when one is explicitly configured.
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Custom verification check to test connection upon app load
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration: firebase client is offline.");
    }
  }
}

// -------------------------------------------------------------
// SECURE SYSTEM OPERATIONS AND DIAGNOSTIC ERROR HANDLERS (Section 3)
// -------------------------------------------------------------

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Policy Intercepted Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// USER COLLECTION SYNCS & LOGINS
// -------------------------------------------------------------

/**
 * Initiates standard popup Google credentials flow.
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Google authentication failed:", error);
    throw error;
  }
}

/**
 * Terminate active visual sessions safely.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Signout error:", error);
    throw error;
  }
}

/**
 * Sync user profile metadata to Firestore users/{userId} safely.
 */
export async function syncUserProfile(user: FirebaseUser): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, "users", user.uid);
    const existingSnap = await getDoc(userRef);
    
    if (!existingSnap.exists()) {
      // Create user document with immutable properties
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Nebula User",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// MEMORY SYNCHRONIZERS Mapping (Durable Cloud Storage)
// -------------------------------------------------------------

/**
 * Push an array of memories directly into Firestore securely.
 */
export async function syncMemoriesToCloud(userId: string, memories: ImageItem[]): Promise<void> {
  for (const item of memories) {
    // Avoid double synchronizing or empty items
    if (!item.id) continue;
    
    const path = `users/${userId}/memories/${item.id}`;
    try {
      const docRef = doc(db, "users", userId, "memories", item.id);
      
      // Map to Firestore schema properties
      await setDoc(docRef, {
        id: item.id,
        fileKey: item.fileKey || `size-${item.size}-${item.timestamp}-${item.name}`,
        name: item.name,
        size: item.size,
        timestamp: item.timestamp,
        dateStr: item.dateStr,
        time12h: item.time12h,
        hour24: item.hour24,
        caption: item.caption,
        category: item.category,
        location: item.location,
        peopleCount: item.peopleCount,
        colorPalette: item.colorPalette,
        syncedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

/**
 * Pull and map all cloud-backed records for this authenticated user.
 */
export async function fetchMemoriesFromCloud(userId: string): Promise<ImageItem[]> {
  const path = `users/${userId}/memories`;
  try {
    const collRef = collection(db, "users", userId, "memories");
    const snapshot = await getDocs(query(collRef));
    
    const list: ImageItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: data.id,
        url: "", // Represent as cloud-stored offline placeholder (will handle blob attachment fallback dynamically)
        name: data.name,
        size: data.size,
        timestamp: data.timestamp,
        dateStr: data.dateStr,
        time12h: data.time12h,
        hour24: data.hour24,
        caption: data.caption,
        category: data.category,
        location: data.location,
        peopleCount: data.peopleCount,
        colorPalette: data.colorPalette
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Discard a memory record from user storage.
 */
export async function deleteMemoryFromCloud(userId: string, memoryId: string): Promise<void> {
  const path = `users/${userId}/memories/${memoryId}`;
  try {
    const docRef = doc(db, "users", userId, "memories", memoryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
