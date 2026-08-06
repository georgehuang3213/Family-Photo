import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('gdrive_access_token') || null);
  const [authError, setAuthError] = useState(null);

  // Whitelist state (combines INITIAL_ALLOWED_EMAILS and Firestore cloud invited list)
  const [invitedEmails, setInvitedEmails] = useState(INITIAL_ALLOWED_EMAILS);

  // Real-time subscribe to Cloud Invited Emails
  useEffect(() => {
    const unsub = subscribeToInvitedEmails((cloudEmails) => {
      const combined = Array.from(new Set([...INITIAL_ALLOWED_EMAILS, ...cloudEmails]));
      setInvitedEmails(combined);
    });
    return unsub;
  }, []);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = firebaseUser.email?.toLowerCase();
        
        // Strict Whitelist Check
        const isAllowed = userEmail === ADMIN_EMAIL.toLowerCase() || 
          invitedEmails.some(e => e.toLowerCase() === userEmail);

        if (!isAllowed) {
          signOut(auth);
          setAuthError(`⛔ 存取被拒：此 Google 帳號 (${firebaseUser.email}) 未獲授權。請聯繫管理者 (${ADMIN_EMAIL}) 將您的 Email 加入家族白名單。`);
          setUser(null);
          return;
        }
        setAuthError(null);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [invitedEmails]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        sessionStorage.setItem('gdrive_access_token', credential.accessToken);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('登入失敗，請再試一次。');
      }
    }
  };

  const logout = () => {
    sessionStorage.removeItem('gdrive_access_token');
    setAccessToken(null);
    signOut(auth);
  };

  const addInvitedEmail = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    const updated = Array.from(new Set([...invitedEmails, cleanEmail]));
    setInvitedEmails(updated);
    await saveInvitedEmailToCloud(cleanEmail);
  };

  const removeInvitedEmail = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return; // cannot remove admin
    const updated = invitedEmails.filter(e => e.toLowerCase() !== cleanEmail);
    setInvitedEmails(updated);
    await removeInvitedEmailFromCloud(cleanEmail);
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAdmin, accessToken, authError, invitedEmails, 
      loginWithGoogle, logout, addInvitedEmail, removeInvitedEmail 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
