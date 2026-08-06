import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// ── 家族成員白名單 ─────────────────────────────────────────────────────
// 只有這裡列出的 Google 帳號 Email 才能登入，請將家族成員的 Gmail 加進來
export const ALLOWED_EMAILS = [
  // 'your-email@gmail.com',       ← 請在此加入家族成員的 Gmail
];
// ─────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 若有白名單設定，檢查是否在名單內
        if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(firebaseUser.email)) {
          signOut(auth);
          setAuthError(`此帳號 (${firebaseUser.email}) 未獲授權加入家族相簿。請聯繫管理員。`);
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
  }, []);

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

  return (
    <AuthContext.Provider value={{ user, authError, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
