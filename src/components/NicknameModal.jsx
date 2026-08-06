import React, { useState } from 'react';
import { User, Check, Sparkles, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';

const EMOJI_OPTIONS = ['👨', '👩', '👵', '👴', '🧑‍💻', '👧', '👦', '🧔', '👩‍🦱', '👑', '🌟', '✨'];
const COLOR_OPTIONS = ['#6366f1', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f43f5e'];

export default function NicknameModal({ googleUser, defaultName, onSave }) {
  const [nickname, setNickname] = useState(defaultName || googleUser?.displayName || '');
  const [selectedEmoji, setSelectedEmoji] = useState('🧑‍💻');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    const newMember = {
      id: googleUser?.uid || `mem-${Date.now()}`,
      name: nickname.trim(),
      role: '家族成員',
      avatar: selectedEmoji,
      color: selectedColor,
      email: googleUser?.email || ''
    };

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    onSave(newMember);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '90vw', maxWidth: '480px', padding: '32px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-glow)' }}>
            <span style={{ fontSize: '2rem' }}>{selectedEmoji}</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>設定您的家族暱稱</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            這是您第一次登入，請設定大家認識您的暱稱與頭像
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Nickname input */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              家族暱稱 (稱呼)：
            </label>
            <input 
              type="text" 
              placeholder="例如：爸爸、媽媽、小明、chiao..." 
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '14px', fontSize: '1rem', fontWeight: '600' }}
              required
              autoFocus
            />
          </div>

          {/* Emoji Avatar Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              選擇頭像 Emoji：
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  style={{
                    fontSize: '1.5rem',
                    padding: '8px',
                    borderRadius: '12px',
                    border: selectedEmoji === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: selectedEmoji === emoji ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              專屬代表色：
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: selectedColor === c ? '3px solid #fff' : 'none',
                    cursor: 'pointer',
                    boxShadow: selectedColor === c ? `0 0 12px ${c}` : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}>
            <Check size={18} /> 完成設定，進入家族相簿
          </button>

        </form>

      </div>
    </div>
  );
}
