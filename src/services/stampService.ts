import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { SavedAsset } from '../types';

const LOCAL_STORAGE_KEY = 'stampsign_local_assets_v1';

// Helpers for guest local storage
function getLocalAssets(): SavedAsset[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalAssets(assets: SavedAsset[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(assets));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

/**
 * Subscribe to saved assets. If signed in, listens in real-time to Firestore.
 * If not signed in, reads from localStorage.
 */
export function subscribeToSavedAssets(
  userId: string | null,
  onUpdate: (assets: SavedAsset[]) => void
): Unsubscribe {
  if (!userId) {
    // Guest mode: load from localStorage
    onUpdate(getLocalAssets());
    const storageHandler = () => onUpdate(getLocalAssets());
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }

  const collectionPath = `users/${userId}/saved_assets`;
  const q = collection(db, collectionPath);

  return onSnapshot(
    q,
    (snapshot) => {
      const assets: SavedAsset[] = [];
      snapshot.forEach((docSnap) => {
        assets.push(docSnap.data() as SavedAsset);
      });
      // Sort newest first
      assets.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      onUpdate(assets);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

/**
 * Save a new signature or stamp to Cloud/Local
 */
export async function createSavedAsset(
  asset: Omit<SavedAsset, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<SavedAsset> {
  const userId = auth.currentUser?.uid;
  const now = new Date().toISOString();
  const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const newAsset: SavedAsset = {
    ...asset,
    id,
    userId: userId || 'local_guest',
    createdAt: now,
    updatedAt: now,
  };

  if (userId) {
    const docPath = `users/${userId}/saved_assets/${id}`;
    try {
      await setDoc(doc(db, `users/${userId}/saved_assets`, id), newAsset);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  } else {
    const list = getLocalAssets();
    list.unshift(newAsset);
    saveLocalAssets(list);
  }

  return newAsset;
}

/**
 * Update remembered position, size, and rotation for a saved asset
 */
export async function updateAssetPlacementPreferences(
  assetId: string,
  preferences: {
    relativeX?: number;
    relativeY?: number;
    relativeWidth?: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;
    blendMode?: SavedAsset['blendMode'];
  }
): Promise<void> {
  const userId = auth.currentUser?.uid;
  const now = new Date().toISOString();

  if (userId) {
    const docPath = `users/${userId}/saved_assets/${assetId}`;
    try {
      await updateDoc(doc(db, `users/${userId}/saved_assets`, assetId), {
        ...preferences,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  } else {
    const list = getLocalAssets();
    const idx = list.findIndex((a) => a.id === assetId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...preferences, updatedAt: now };
      saveLocalAssets(list);
    }
  }
}

/**
 * Delete a saved signature or stamp
 */
export async function deleteSavedAsset(assetId: string): Promise<void> {
  const userId = auth.currentUser?.uid;

  if (userId) {
    const docPath = `users/${userId}/saved_assets/${assetId}`;
    try {
      await deleteDoc(doc(db, `users/${userId}/saved_assets`, assetId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  } else {
    const list = getLocalAssets().filter((a) => a.id !== assetId);
    saveLocalAssets(list);
  }
}

/**
 * Migrate local assets to cloud when user logs in
 */
export async function migrateLocalAssetsToCloud(userId: string): Promise<void> {
  const localList = getLocalAssets();
  if (localList.length === 0) return;

  for (const asset of localList) {
    const cloudAsset: SavedAsset = {
      ...asset,
      userId,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, `users/${userId}/saved_assets`, asset.id), cloudAsset);
    } catch (e) {
      console.warn('Migration item skipped', e);
    }
  }

  // Clear local storage after successful migration
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}
