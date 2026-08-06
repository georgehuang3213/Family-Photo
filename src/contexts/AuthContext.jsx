import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const ADMIN_EMAIL = 'chiaoyu3213@gmail.com';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [authError, setAuthError] = useState(null);

  // Whitelist state stored in localStorage
  const [invitedEmails, setInvitedEmails] = useState(() => {
    try {
      const saved = localStorage.getItem('family_invited_emails_v1');
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes(ADMIN_EMAIL)) list.push(ADMIN_EMAIL);
      return list;
    } catch {
      return [ADMIN_EMAIL];
    }
  });

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = firebaseUser.email?.toLowerCase();
        
        // Admin is always allowed; other users must be in invited list
        const isAllowed = userEmail === ADMIN_EMAIL.toLowerCase() || 
          invitedEmails.some(e => e.toLowerCase() === userEmail);

        if (!isAllowed) {
          signOut(auth);
          setAuthError(`此帳號 (${firebaseUser.email}) 尚未獲得管理者 (${ADMIN_EMAIL}) 邀請。請聯繫管理者新增您的 Email！`);
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
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('登入失敗，請再試一次。');
      }
    }
  };

  const logout = () => signOut(auth);

  const addInvitedEmail = (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || invitedEmails.includes(cleanEmail)) return;
    const updated = [...invitedEmails, cleanEmail];
    setInvitedEmails(updated);
    try {
      localStorage.setItem('family_invited_emails_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const removeInvitedEmail = (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return; // cannot remove admin
    const updated = invitedEmails.filter(e => e.toLowerCase() !== cleanEmail);
    setInvitedEmails(updated);
    try {
      localStorage.setItem('family_invited_emails_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAdmin, authError, invitedEmails, 
      loginWithGoogle, logout, addInvitedEmail, removeInvitedEmail 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
