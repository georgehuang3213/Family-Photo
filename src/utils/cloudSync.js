import { 
  collection, doc, setDoc, onSnapshot, deleteDoc, query, writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { deleteFromR2 } from './r2Storage';

// ─── PHOTOS CLOUD SYNC ───────────────────────────────────────────────────
export function subscribeToPhotos(onPhotosUpdate, onError) {
  try {
    const photosRef = collection(db, 'photos');
    
    // Real-time snapshot listener handles both initial load and updates
    const q = query(photosRef);
    return onSnapshot(q, (snapshot) => {
      const photos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      photos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onPhotosUpdate(photos);
    }, (err) => {
      console.warn('Firestore photos snapshot error:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error('Failed to subscribe to photos:', err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function savePhotoToCloud(photo) {
  try {
    const photoData = {
      ...photo,
      timestamp: photo.timestamp || Date.now()
    };
    const cleanData = JSON.parse(JSON.stringify(photoData));
    await setDoc(doc(db, 'photos', photo.id), cleanData);
    return cleanData;
  } catch (err) {
    console.error('Failed to save photo to cloud:', err);
    throw err;
  }
}

export async function savePhotosToCloud(photos) {
  if (!Array.isArray(photos) || photos.length === 0) return [];
  try {
    const batch = writeBatch(db);
    const cleanedList = photos.map(photo => {
      const photoData = {
        ...photo,
        timestamp: photo.timestamp || Date.now()
      };
      const cleanData = JSON.parse(JSON.stringify(photoData));
      const photoRef = doc(db, 'photos', photo.id);
      batch.set(photoRef, cleanData);
      return cleanData;
    });

    await batch.commit();
    return cleanedList;
  } catch (err) {
    console.error('Failed to batch save photos to cloud:', err);
    throw err;
  }
}

export async function deletePhotoFromCloud(photoOrId) {
  try {
    const id = typeof photoOrId === 'string' ? photoOrId : photoOrId?.id;
    const r2Key = typeof photoOrId === 'object' ? photoOrId?.r2Key : null;

    if (!id) return;

    // 1. Delete document from Firestore
    await deleteDoc(doc(db, 'photos', id));

    // 2. Delete physical object from Cloudflare R2 if key exists
    if (r2Key) {
      await deleteFromR2(r2Key).catch(err => console.warn('R2 physical file deletion warning:', err));
    }
  } catch (err) {
    console.error('Failed to delete photo from cloud:', err);
  }
}

// ─── ALBUMS CLOUD SYNC ───────────────────────────────────────────────────
export function subscribeToAlbums(onAlbumsUpdate, onError) {
  try {
    const albumsRef = collection(db, 'albums');
    
    const q = query(albumsRef);
    return onSnapshot(q, (snapshot) => {
      const albums = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onAlbumsUpdate(albums);
    }, (err) => {
      console.warn('Firestore albums snapshot error:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error('Failed to subscribe to albums:', err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function saveAlbumToCloud(album) {
  try {
    const cleanData = JSON.parse(JSON.stringify(album));
    await setDoc(doc(db, 'albums', album.id), cleanData);
    return cleanData;
  } catch (err) {
    console.error('Failed to save album to cloud:', err);
    throw err;
  }
}

export async function deleteAlbumFromCloud(id) {
  try {
    await deleteDoc(doc(db, 'albums', id));
  } catch (err) {
    console.error('Failed to delete album from cloud:', err);
    throw err;
  }
}

// ─── MEMBERS CLOUD SYNC ──────────────────────────────────────────────────
export function subscribeToMembers(onMembersUpdate, onError) {
  try {
    const membersRef = collection(db, 'members');

    const q = query(membersRef);
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onMembersUpdate(members);
    }, (err) => {
      console.warn('Firestore members snapshot error:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error('Failed to subscribe to members:', err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function saveMemberToCloud(member) {
  try {
    const cleanData = JSON.parse(JSON.stringify(member));
    await setDoc(doc(db, 'members', member.id), cleanData);
    return cleanData;
  } catch (err) {
    console.error('Failed to save member to cloud:', err);
    throw err;
  }
}

// ─── INVITED EMAILS WHITELIST CLOUD SYNC ─────────────────────────────────
export function subscribeToInvitedEmails(onEmailsUpdate) {
  try {
    const q = query(collection(db, 'invitedEmails'));
    return onSnapshot(q, (snapshot) => {
      const emails = snapshot.docs.map(doc => doc.id);
      onEmailsUpdate(emails);
    }, (err) => {
      console.warn('Firestore invitedEmails sync fallback:', err);
    });
  } catch (err) {
    console.error('Failed to subscribe to invitedEmails:', err);
    return () => {};
  }
}

export async function saveInvitedEmailToCloud(email) {
  try {
    const clean = email.trim().toLowerCase();
    await setDoc(doc(db, 'invitedEmails', clean), { email: clean, addedAt: Date.now() });
  } catch (err) {
    console.error('Failed to save invited email to cloud:', err);
  }
}

export async function removeInvitedEmailFromCloud(email) {
  try {
    const clean = email.trim().toLowerCase();
    await deleteDoc(doc(db, 'invitedEmails', clean));
  } catch (err) {
    console.error('Failed to remove invited email from cloud:', err);
  }
}
