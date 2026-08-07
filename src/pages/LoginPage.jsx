import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Images, Sparkles, ShieldCheck, ShieldX } from 'lucide-react';

export default function LoginPage() {
  const { loginWithGoogle, authError, accessDenied } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative blobs */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)', pointerEvents: 'none' }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '48px 40px', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
            <Images size={36} color="#fff" />
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          家族雲端相簿
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          這是私密的家族空間，請用 Google 帳號登入
        </p>
        <span className="badge badge-purple" style={{ marginBottom: '36px', display: 'inline-flex' }}>
          <Sparkles size={12} /> Google AI Pro · 雲端加密保護
        </span>

        {/* Access Denied Banner */}
        {accessDenied && (
          <div style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.35)', borderRadius: '14px', padding: '18px 18px', marginBottom: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldX size={20} color="#f43f5e" style={{ flexShrink: 0 }} />
              <strong style={{ color: '#f43f5e', fontSize: '0.95rem' }}>帳號未獲授權</strong>
            </div>
            <p style={{ color: '#fb7185', fontSize: '0.83rem', lineHeight: '1.55', margin: 0 }}>
              您的 Google 帳號<strong>尚未被管理員加入此家族相簿</strong>。<br />
              請聯絡家族管理員，請他們在「邀請成員」功能中新增您的 Gmail 信箱後，再重新登入。
            </p>
          </div>
        )}

        {/* General Error Message */}
        {authError && !accessDenied && (
          <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem', color: '#fb7185', textAlign: 'left' }}>
            ⚠️ {authError}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          onClick={loginWithGoogle}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            background: '#fff',
            color: '#1f2937',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-family)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
        >
          {/* Google Icon */}
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          使用 Google 帳號登入
        </button>

        {/* Privacy note */}
        <div style={{ marginTop: '28px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left' }}>
          <ShieldCheck size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            此網站為私密家族空間。<strong style={{ color: 'var(--text-main)' }}>只有獲授權的 Google 帳號</strong>才能登入瀏覽與上傳照片。
          </p>
        </div>

      </div>
    </div>
  );
}
