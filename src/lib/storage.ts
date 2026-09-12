// Local storage & Mobile photo gallery integration for Imagine
import { PhotoItem, MatrixTask } from '../types';

const DB_NAME = 'ImagineAppDB';
const STORE_GENERATED = 'generated_images';
const STORE_INPUT_PHOTOS = 'input_photos';
const STORE_SOURCE_PHOTOS = 'source_photos';
const STORE_QUEUE_TASKS = 'queue_tasks';
const STORE_APP_METADATA = 'app_metadata';
const DB_VERSION = 3;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_GENERATED)) {
        db.createObjectStore(STORE_GENERATED);
      }
      if (!db.objectStoreNames.contains(STORE_INPUT_PHOTOS)) {
        db.createObjectStore(STORE_INPUT_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SOURCE_PHOTOS)) {
        db.createObjectStore(STORE_SOURCE_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE_TASKS)) {
        db.createObjectStore(STORE_QUEUE_TASKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_APP_METADATA)) {
        db.createObjectStore(STORE_APP_METADATA);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Silently store generated image blob inside the app */
export async function cacheImageBlob(taskId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_GENERATED, 'readwrite');
    tx.objectStore(STORE_GENERATED).put(blob, taskId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to cache image blob in IndexedDB:', err);
  }
}

/** Retrieve image blob from internal app storage */
export async function getCachedImageBlob(taskId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_GENERATED, 'readonly');
    const request = tx.objectStore(STORE_GENERATED).get(taskId);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Save all uploaded input photos to IndexedDB */
export async function saveInputPhotos(photos: PhotoItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_INPUT_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_INPUT_PHOTOS);

    store.clear();
    for (const photo of photos) {
      store.put({
        id: photo.id,
        name: photo.name,
        size: photo.size,
        blob: photo.file,
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save input photos:', err);
  }
}

/** Load uploaded input photos from IndexedDB */
export async function loadInputPhotos(): Promise<PhotoItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_INPUT_PHOTOS, 'readonly');
    const store = tx.objectStore(STORE_INPUT_PHOTOS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const rawItems = request.result || [];
        const restored: PhotoItem[] = rawItems.map((item: any) => {
          const blob: Blob = item.blob;
          const file = new File([blob], item.name, { type: blob.type || 'image/png' });
          return {
            id: item.id,
            name: item.name,
            size: item.size || blob.size,
            dataUrl: URL.createObjectURL(blob),
            file,
          };
        });
        resolve(restored);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/** Save permanent source photos to IndexedDB */
export async function saveSourcePhotos(photos: PhotoItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SOURCE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_SOURCE_PHOTOS);
    for (const photo of photos) {
      store.put({
        id: photo.id,
        name: photo.name,
        size: photo.size,
        blob: photo.file,
      });
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save source photos:', err);
  }
}

/** Load all permanent source photos as a Map by photoId */
export async function loadAllSourcePhotos(): Promise<Map<string, PhotoItem>> {
  const map = new Map<string, PhotoItem>();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SOURCE_PHOTOS, 'readonly');
    const store = tx.objectStore(STORE_SOURCE_PHOTOS);
    const req = store.getAll();
    return new Promise((resolve) => {
      req.onsuccess = () => {
        for (const item of req.result || []) {
          const blob: Blob = item.blob;
          const file = new File([blob], item.name, { type: blob.type || 'image/png' });
          map.set(item.id, {
            id: item.id,
            name: item.name,
            size: item.size || blob.size,
            dataUrl: URL.createObjectURL(blob),
            file,
          });
        }
        resolve(map);
      };
      req.onerror = () => resolve(map);
    });
  } catch {
    return map;
  }
}

/** Save matrix queue tasks to IndexedDB */
export async function saveQueueTasks(tasks: MatrixTask[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_QUEUE_TASKS, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE_TASKS);

    store.clear();
    for (const task of tasks) {
      store.put({ ...task });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save queue tasks:', err);
  }
}

/** Load matrix queue tasks from IndexedDB, rehydrating resultUrls and photoDataUrls */
export async function loadQueueTasks(): Promise<MatrixTask[]> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_QUEUE_TASKS, STORE_GENERATED, STORE_SOURCE_PHOTOS], 'readonly');
    const taskStore = tx.objectStore(STORE_QUEUE_TASKS);
    const genStore = tx.objectStore(STORE_GENERATED);
    const photoStore = tx.objectStore(STORE_SOURCE_PHOTOS);

    const taskRequest = taskStore.getAll();
    const photoRequest = photoStore.getAll();

    return new Promise((resolve) => {
      taskRequest.onsuccess = async () => {
        const rawTasks: MatrixTask[] = taskRequest.result || [];
        const rawPhotos: any[] = await new Promise((res) => {
          photoRequest.onsuccess = () => res(photoRequest.result || []);
          photoRequest.onerror = () => res([]);
        });

        const photoMap = new Map<string, string>();
        for (const p of rawPhotos) {
          if (p.blob) {
            photoMap.set(p.id, URL.createObjectURL(p.blob));
          }
        }

        const restored: MatrixTask[] = [];

        for (const task of rawTasks) {
          const status = (task.status === 'processing' || task.status === 'requeued')
            ? 'pending'
            : task.status;

          let resultUrl = task.resultUrl;
          if (task.status === 'success') {
            try {
              const blobReq = genStore.get(task.id);
              const blob = await new Promise<Blob | null>((res) => {
                blobReq.onsuccess = () => res(blobReq.result || null);
                blobReq.onerror = () => res(null);
              });
              if (blob) {
                resultUrl = URL.createObjectURL(blob);
              }
            } catch {}
          }

          const photoDataUrl = task.photoDataUrl || photoMap.get(task.photoId);

          restored.push({
            ...task,
            status,
            resultUrl,
            photoDataUrl,
          });
        }

        restored.sort((a, b) => a.index - b.index);
        resolve(restored);
      };

      taskRequest.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/** Save arbitrary app state to IndexedDB / localStorage */
export async function saveAppState(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_APP_METADATA, 'readwrite');
    tx.objectStore(STORE_APP_METADATA).put(value, key);
  } catch {}

  try {
    localStorage.setItem(`imagine_${key}`, JSON.stringify(value));
  } catch {}
}

/** Load arbitrary app state from localStorage or IndexedDB */
export async function getAppState<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const local = localStorage.getItem(`imagine_${key}`);
    if (local !== null) {
      return JSON.parse(local) as T;
    }
  } catch {}

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_APP_METADATA, 'readonly');
    const req = tx.objectStore(STORE_APP_METADATA).get(key);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : defaultValue);
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

/** Clear all stored current session data (photos, tasks, metadata) */
export async function clearCurrentSession(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_INPUT_PHOTOS, STORE_QUEUE_TASKS, STORE_APP_METADATA], 'readwrite');
    tx.objectStore(STORE_INPUT_PHOTOS).clear();
    tx.objectStore(STORE_QUEUE_TASKS).clear();
    tx.objectStore(STORE_APP_METADATA).clear();
  } catch {}

  try {
    localStorage.removeItem('imagine_prompts');
    localStorage.removeItem('imagine_tasks');
    localStorage.removeItem('imagine_settings');
  } catch {}
}

/** Clear all cached generated images in IndexedDB */
export async function clearGeneratedCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_GENERATED, 'readwrite');
    tx.objectStore(STORE_GENERATED).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

/** Direct download to device gallery / files with mobile and Capacitor support */
export async function exportImageToGallery(
  blob: Blob,
  filename: string,
  _title = 'Imagine generation'
): Promise<'downloaded'> {
  // 1. Convert blob to Base64 Data URL for robust mobile & WebView support
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  // 2. If running inside Capacitor native Android/iOS shell
  const cap = typeof window !== 'undefined' && (window as any).Capacitor;
  if (cap && cap.isNativePlatform?.()) {
    if (cap.Plugins?.Filesystem) {
      try {
        const rawBase64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        await cap.Plugins.Filesystem.writeFile({
          path: filename,
          data: rawBase64,
          directory: 'DOCUMENTS',
          recursive: true,
        });
        return 'downloaded';
      } catch (nativeErr) {
        console.warn('Capacitor Filesystem save failed, falling back:', nativeErr);
      }
    }
  }

  // 3. Fallback: Trigger direct anchor download using data URL and synthetic click
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);

  try {
    const clickEvt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);
  } catch {
    a.click();
  }

  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 1000);

  return 'downloaded';
}
