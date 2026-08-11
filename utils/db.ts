// Small IndexedDB key-value store used as a safety net for game data.
//
// All primary state lives in localStorage, which browsers may evict (storage
// pressure, "clear site data", etc.). Everything is therefore mirrored here:
// IndexedDB survives most localStorage wipes, and the app offers to restore
// from this mirror when it boots with empty data.

const DB_NAME = 'the-game-db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

export interface GameSnapshot {
  habits: unknown[];
  completions: unknown[];
  profile: unknown;
  quests: unknown[];
  questsLastGenerated: string | null;
  savedAt: string; // ISO date string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = fn(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  await withStore('readwrite', store => store.put(value, key));
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  return withStore<T | undefined>('readonly', store => store.get(key) as IDBRequest<T | undefined>);
}

// --- Game-specific helpers ---

const MIRROR_KEY = 'mirror';
const SNAPSHOTS_KEY = 'snapshots';
const MAX_SNAPSHOTS = 8;

export async function saveMirror(snapshot: GameSnapshot): Promise<void> {
  try {
    await idbSet(MIRROR_KEY, snapshot);
  } catch (err) {
    console.warn('Failed to mirror data to IndexedDB:', err);
  }
}

export async function loadMirror(): Promise<GameSnapshot | undefined> {
  try {
    return await idbGet<GameSnapshot>(MIRROR_KEY);
  } catch (err) {
    console.warn('Failed to read IndexedDB mirror:', err);
    return undefined;
  }
}

export async function addSnapshot(snapshot: GameSnapshot): Promise<void> {
  try {
    const existing = (await idbGet<GameSnapshot[]>(SNAPSHOTS_KEY)) || [];
    const updated = [...existing, snapshot].slice(-MAX_SNAPSHOTS);
    await idbSet(SNAPSHOTS_KEY, updated);
  } catch (err) {
    console.warn('Failed to save snapshot to IndexedDB:', err);
  }
}

export async function getLatestSnapshot(): Promise<GameSnapshot | undefined> {
  try {
    const snapshots = (await idbGet<GameSnapshot[]>(SNAPSHOTS_KEY)) || [];
    return snapshots[snapshots.length - 1];
  } catch (err) {
    console.warn('Failed to read snapshots from IndexedDB:', err);
    return undefined;
  }
}

// Ask the browser not to evict this origin's storage (localStorage + IndexedDB).
// Best effort: some browsers grant silently, some ignore it.
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) {
      const alreadyPersisted = await navigator.storage.persisted();
      if (!alreadyPersisted) {
        const granted = await navigator.storage.persist();
        console.log(granted ? 'Persistent storage granted.' : 'Persistent storage request was denied.');
      }
    }
  } catch (err) {
    console.warn('Persistent storage request failed:', err);
  }
}
