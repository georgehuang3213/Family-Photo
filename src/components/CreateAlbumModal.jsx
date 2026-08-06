import React, { useState } from 'react';
import { X, FolderPlus, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = ['家族慶典', '旅遊度假', '溫馨聚會', '節日紀念', '成長歷程', '日常紀錄'];
const EMOJIS = ['🎂', '🏖️', '⛺', '🧧', '🎄', '🚗', '✈️', '👶', '🎓', '📸', '🏠', '🎉'];

export default function CreateAlbumModal({ onClose, onCreateAlbum }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📸');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAlbum = {
      id: `alb-${Date.now()}`,
      title: `${selectedEmoji} ${title.trim()}`,
      category,
      description: description.trim(),
      location: location.trim() || '未定地點',
      date: new Date().toISOString().split('T')[0],
      coverImage: null,
      photoCount: 0
    };

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    onCreateAlbum(newAlbum);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '90vw', maxWidth: '520px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderPlus size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>建立新家族相簿</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>整理分類屬於家族的共同回憶</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Emoji Icon picker */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              相簿圖示 Emoji：
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  style={{
                    fontSize: '1.4rem',
                    padding: '8px',
                    borderRadius: '10px',
                    border: selectedEmoji === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: selectedEmoji === emoji ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer'
                  }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Album Title */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
              相簿名稱：
            </label>
            <input 
              type="text" 
              placeholder="例如：2026 沖繩家族之旅、爺爺80大壽" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '14px' }}
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
              分類類別：
            </label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '14px', appearance: 'auto' }}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} style={{ background: '#111827', color: '#fff' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location & Description */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
              地點（選填）：
            </label>
            <input 
              type="text" 
              placeholder="例如：日本沖繩、台北市" 
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
              相簿簡介（選填）：
            </label>
            <textarea 
              placeholder="簡短紀錄這本相簿的故事..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '14px', height: '70px', paddingTop: '10px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> 建立相簿
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
