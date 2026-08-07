import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { 
  subscribeToInvitedEmails, saveInvitedEmailToCloud, removeInvitedEmailFromCloud 
} from '../utils/cloudSync';

export const ADMIN_EMAIL = 'chiaoyu3213@gmail.com';

export const INITIAL_ALLOWED_EMAILS = [
  'chiaoyu3213@gmail.com',
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [authError, setAuthError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Whitelist state (combines INITIAL_ALLOWED_EMAILS and Firestore cloud invited list)
  const [invitedEmails, setInvitedEmails] = useState(() => {
    const cached = localStorage.getItem('family_invited_emails');
    return cached ? JSON.parse(cached) : INITIAL_ALLOWED_EMAILS;
  });

  const invitedEmailsRef = useRef(invitedEmails);
  useEffect(() => {
    invitedEmailsRef.current = invitedEmails;
  }, [invitedEmails]);

  // Refs to handle race condition between onAuthStateChanged and Firestore whitelist sync
  const firestoreReady = useRef(false);
  const pendingFirebaseUser = useRef(null);

  const validateAndSetUser = (firebaseUser, emailList) => {
    const email = firebaseUser.email?.toLowerCase();
    const allowed = (emailList || INITIAL_ALLOWED_EMAILS).map(e => e.toLowerCase());
    if (!allowed.includes(email)) {
      signOut(auth);
      setUser(null);
      setAccessDenied(true);
    } else {
      setAuthError(null);
      setAccessDenied(false);
      setUser(firebaseUser);
    }
  };

  // Real-time subscribe to Cloud Invited Emails
  useEffect(() => {
    const unsub = subscribeToInvitedEmails((cloudEmails) => {
      const combined = Array.from(new Set([...INITIAL_ALLOWED_EMAILS, ...cloudEmails]));
      setInvitedEmails(combined);
      invitedEmailsRef.current = combined;
      localStorage.setItem('family_invited_emails', JSON.stringify(combined));

      // Now that Firestore is ready, validate any user waiting for whitelist sync
      if (!firestoreReady.current) {
        firestoreReady.current = true;
        if (pendingFirebaseUser.current) {
          validateAndSetUser(pendingFirebaseUser.current, combined);
          pendingFirebaseUser.current = null;
        }
      }
    });
    return unsub;
  }, []);

  // Listen to Auth State change ONLY ONCE to avoid Race Condition tearing down subscriptions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        if (firestoreReady.current) {
          validateAndSetUser(firebaseUser, invitedEmailsRef.current);
        } else {
          pendingFirebaseUser.current = firebaseUser;
          setTimeout(() => {
            if (pendingFirebaseUser.current) {
              firestoreReady.current = true;
              validateAndSetUser(pendingFirebaseUser.current, invitedEmailsRef.current);
              pendingFirebaseUser.current = null;
            }
          }, 3000);
        }
      } else {
        setUser(null);
        pendingFirebaseUser.current = null;
      }
    });
    return unsubscribe;
  }, []);

  // isAdmin: only the designated admin email has full management permissions
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('登入失敗，請再試一次。');
      }
    }
  };

  const logout = () => {
    signOut(auth);
    setAccessToken(null);
  };

  const connectGoogleDrive = async () => {
    return true;
  };

  const addInvitedEmail = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    const updated = Array.from(new Set([...invitedEmails, cleanEmail]));
    setInvitedEmails(updated);
    invitedEmailsRef.current = updated;
    localStorage.setItem('family_invited_emails', JSON.stringify(updated));
    await saveInvitedEmailToCloud(cleanEmail);
  };

  const removeInvitedEmail = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return; // cannot remove admin
    const updated = invitedEmails.filter(e => e.toLowerCase() !== cleanEmail);
    setInvitedEmails(updated);
    invitedEmailsRef.current = updated;
    localStorage.setItem('family_invited_emails', JSON.stringify(updated));
    await removeInvitedEmailFromCloud(cleanEmail);
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAdmin, authError, accessDenied, invitedEmails, accessToken,
      loginWithGoogle, logout, addInvitedEmail, removeInvitedEmail, connectGoogleDrive 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
