import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SavedAsset } from '../types';

const LOCAL_STORAGE_KEY = 'stampsign_org_shared_assets_v2';
const LOCAL_STORAGE_EVENT = 'stampsign_local_storage_changed';

function notifyLocalChange() {
  window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
}

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
    notifyLocalChange();
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

/**
 * Subscribe to Organization Shared Cloud Assets in real-time.
 * Automatically synchronizes with Cloud Firestore without requiring any user login!
 */
export function subscribeToSavedAssets(
  _userId: string | null,
  onUpdate: (assets: SavedAsset[]) => void
): Unsubscribe {
  const collectionPath = 'shared_assets';
  const q = collection(db, collectionPath);

  try {
    const unsub = onSnapshot(
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

        // Update local cache as backup
        if (assets.length > 0) {
          saveLocalAssets(assets);
        }

        onUpdate(assets);
      },
      (error) => {
        console.warn('Firestore real-time subscription error, using local cache:', error);
        // Fallback to local storage if Firestore connection encounters issues
        onUpdate(getLocalAssets());
      }
    );

    return unsub;
  } catch (err) {
    console.warn('Could not initialize Firestore onSnapshot, falling back to local storage:', err);
    onUpdate(getLocalAssets());
    const handler = () => onUpdate(getLocalAssets());
    window.addEventListener(LOCAL_STORAGE_EVENT, handler);
    return () => window.removeEventListener(LOCAL_STORAGE_EVENT, handler);
  }
}

/**
 * Save a new signature or stamp directly to Organization Cloud Firestore
 */
export async function createSavedAsset(
  asset: Omit<SavedAsset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedAsset> {
  const now = new Date().toISOString();
  const id = `org_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const newAsset: SavedAsset = {
    ...asset,
    id,
    department: asset.department || 'ส่วนกลางองค์กร',
    createdAt: now,
    updatedAt: now,
  };

  // Always update local cache immediately for zero latency
  const currentLocal = getLocalAssets();
  currentLocal.unshift(newAsset);
  saveLocalAssets(currentLocal);

  // Sync to Cloud Firestore
  try {
    await setDoc(doc(db, 'shared_assets', id), newAsset);
  } catch (error) {
    console.error('Failed to sync new asset to Cloud Firestore:', error);
  }

  return newAsset;
}

/**
 * Update remembered position, size, and rotation for a shared asset in Cloud Firestore
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
  const now = new Date().toISOString();

  // Update local cache immediately
  const list = getLocalAssets();
  const idx = list.findIndex((a) => a.id === assetId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...preferences, updatedAt: now };
    saveLocalAssets(list);
  }

  // Update Cloud Firestore
  try {
    await updateDoc(doc(db, 'shared_assets', assetId), {
      ...preferences,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Failed to update asset in Cloud Firestore:', error);
  }
}

/**
 * Delete a saved signature or stamp from Organization Cloud Firestore
 */
export async function deleteSavedAsset(assetId: string): Promise<void> {
  // Update local cache
  const list = getLocalAssets().filter((a) => a.id !== assetId);
  saveLocalAssets(list);

  // Delete from Cloud Firestore
  try {
    await deleteDoc(doc(db, 'shared_assets', assetId));
  } catch (error) {
    console.error('Failed to delete asset from Cloud Firestore:', error);
  }
}
