import { 
  collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── PHOTOS CLOUD SYNC ───────────────────────────────────────────────────
export function subscribeToPhotos(onPhotosUpdate) {
  try {
    const q = query(collection(db, 'photos'));
    return onSnapshot(q, (snapshot) => {
      const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by timestamp or date descending
      photos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onPhotosUpdate(photos);
    }, (err) => {
      console.warn('Firestore photos sync fallback:', err);
    });
  } catch (err) {
    console.error('Failed to subscribe to photos:', err);
    return () => {};
  }
}

export async function savePhotoToCloud(photo) {
  try {
    const photoData = {
      ...photo,
      timestamp: photo.timestamp || Date.now()
    };
    await setDoc(doc(db, 'photos', photo.id), photoData);
    return photoData;
  } catch (err) {
    console.error('Failed to save photo to cloud:', err);
    throw err;
  }
}

export async function deletePhotoFromCloud(id) {
  try {
    await deleteDoc(doc(db, 'photos', id));
  } catch (err) {
    console.error('Failed to delete photo from cloud:', err);
  }
}

// ─── ALBUMS CLOUD SYNC ───────────────────────────────────────────────────
export function subscribeToAlbums(onAlbumsUpdate) {
  try {
    const q = query(collection(db, 'albums'));
    return onSnapshot(q, (snapshot) => {
      const albums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onAlbumsUpdate(albums);
    }, (err) => {
      console.warn('Firestore albums sync fallback:', err);
    });
  } catch (err) {
    console.error('Failed to subscribe to albums:', err);
    return () => {};
  }
}

export async function saveAlbumToCloud(album) {
  try {
    await setDoc(doc(db, 'albums', album.id), album);
  } catch (err) {
    console.error('Failed to save album to cloud:', err);
  }
}

// ─── MEMBERS CLOUD SYNC ──────────────────────────────────────────────────
export function subscribeToMembers(onMembersUpdate) {
  try {
    const q = query(collection(db, 'members'));
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onMembersUpdate(members);
    }, (err) => {
      console.warn('Firestore members sync fallback:', err);
    });
  } catch (err) {
    console.error('Failed to subscribe to members:', err);
    return () => {};
  }
}

export async function saveMemberToCloud(member) {
  try {
    await setDoc(doc(db, 'members', member.id), member);
  } catch (err) {
    console.error('Failed to save member to cloud:', err);
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
