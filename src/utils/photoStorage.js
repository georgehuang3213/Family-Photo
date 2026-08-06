const DB_NAME = 'FamilyPhotoDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPhotosFromDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Return sorted by timestamp descending
        const photos = request.result || [];
        resolve(photos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get photos from IndexedDB:', err);
    return [];
  }
}

export async function savePhotoToDB(photo) {
  try {
    const db = await openDB();
    const photoWithTimestamp = {
      ...photo,
      timestamp: photo.timestamp || Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(photoWithTimestamp);

      request.onsuccess = () => resolve(photoWithTimestamp);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save photo to IndexedDB:', err);
    throw err;
  }
}

export async function deletePhotoFromDB(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete photo from IndexedDB:', err);
  }
}
