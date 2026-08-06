import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export async function uploadPhotoToFirebaseStorage(file, onProgress) {
  try {
    const fileName = `photos/${Date.now()}_${file.name || 'image.jpg'}`;
    const storageRef = ref(storage, fileName);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (err) {
    console.error('Failed to upload photo to Firebase Storage:', err);
    throw err;
  }
}
