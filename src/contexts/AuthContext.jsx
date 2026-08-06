import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const ADMIN_EMAIL = 'chiaoyu3213@gmail.com';

// ── 允許登入的家族成員 Email 白名單 ──────────────────────────────────────────
// 只有這裡列出的 Gmail 或由管理者新增的 Email 才能順利登入！
export const INITIAL_ALLOWED_EMAILS = [
  'chiaoyu3213@gmail.com',
  // 您可以在這裡直接新增家族成員的 Gmail，例如：
  // 'family.member1@gmail.com',
  // 'family.member2@gmail.com',
];
// ─────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [authError, setAuthError] = useState(null);

  // Whitelist state (combines INITIAL_ALLOWED_EMAILS and dynamic invited list)
  const [invitedEmails, setInvitedEmails] = useState(() => {
    try {
      const saved = localStorage.getItem('family_invited_emails_v2');
      const customList = saved ? JSON.parse(saved) : [];
      const combined = Array.from(new Set([...INITIAL_ALLOWED_EMAILS, ...customList]));
      return combined;
    } catch {
      return INITIAL_ALLOWED_EMAILS;
    }
  });

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
    if (!cleanEmail || invitedEmails.map(e => e.toLowerCase()).includes(cleanEmail)) return;
    const updated = [...invitedEmails, cleanEmail];
    setInvitedEmails(updated);
    try {
      localStorage.setItem('family_invited_emails_v2', JSON.stringify(updated));
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
      localStorage.setItem('family_invited_emails_v2', JSON.stringify(updated));
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
