import React, { useState } from 'react';
import {
  Images, Heart, Search, Upload, HardDrive,
  Sparkles, Calendar, MapPin, LogOut, RefreshCw
} from 'lucide-react';

import { INITIAL_FAMILY_MEMBERS, INITIAL_PHOTOS, INITIAL_STORAGE_CONFIG } from './data/familyData';
import UploadModal from './components/UploadModal';
import PhotoDetailModal from './components/PhotoDetailModal';
import StorageConfigModal from './components/StorageConfigModal';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { user, logout } = useAuth();

  // ─── ALL hooks must be at the top level, before any conditional returns ───
  const [members] = useState(INITIAL_FAMILY_MEMBERS);
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [storageConfig, setStorageConfig] = useState(INITIAL_STORAGE_CONFIG);
  const [currentMember, setCurrentMember] = useState(members[3]);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // ─── Auth Guard ────────────────────────────────────────────────────────
  // undefined = still loading Firebase auth state
  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw size={32} color="var(--accent-primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>載入中...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;


  // ─── Photo Handlers ──────────────────────────────────────────────────
  const handleToggleFavorite = (id) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    setSelectedPhoto(prev => prev?.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev);
  };

  const handleToggleLike = (id) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    setSelectedPhoto(prev => prev?.id === id ? { ...prev, likes: prev.likes + 1 } : prev);
  };

  const handleAddComment = (id, comment) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, comments: [...(p.comments || []), comment] } : p));
    setSelectedPhoto(prev => prev?.id === id ? { ...prev, comments: [...(prev.comments || []), comment] } : prev);
  };

  const handleUpload = (newPhoto) => setPhotos(prev => [newPhoto, ...prev]);

  // ─── Filtered photos ──────────────────────────────────────────────────
  const filteredPhotos = photos.filter(p => {
    if (showFavoritesOnly && !p.isFavorite) return false;
    if (memberFilter !== 'ALL' && !p.members?.includes(memberFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = p.title?.toLowerCase().includes(q);
      const inLocation = p.location?.toLowerCase().includes(q);
      const inTags = p.tags?.some(t => t.toLowerCase().includes(q));
      if (!inTitle && !inLocation && !inTags) return false;
    }
    return true;
  });

  const totalFavorites = photos.filter(p => p.isFavorite).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100, padding: '12px 24px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              <Images size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '700', background: 'linear-gradient(90deg, #fff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                家族雲端相簿
              </h1>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                <Sparkles size={11} /> Google AI Pro · {storageConfig.totalGB}GB
              </span>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <Search size={17} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="搜尋照片、地點、標籤..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Storage pill */}
            <div onClick={() => setActiveModal('storage')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <HardDrive size={15} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                {storageConfig.usedGB}GB / {storageConfig.totalGB}GB
              </span>
            </div>

            {/* Member switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '30px', background: 'rgba(99,102,241,0.12)', border: '1px solid var(--border-active)' }}>
              <span style={{ fontSize: '1.1rem' }}>{currentMember.avatar}</span>
              <select value={currentMember.id} onChange={e => setCurrentMember(members.find(m => m.id === e.target.value))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.83rem', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                {members.map(m => <option key={m.id} value={m.id} style={{ background: '#111827' }}>{m.name}</option>)}
              </select>
            </div>

            {/* Upload */}
            <button className="btn btn-primary" onClick={() => setActiveModal('upload')}>
              <Upload size={16} /> 上傳照片
            </button>

            {/* User Avatar & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px 5px 6px', borderRadius: '30px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)' }}>
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700' }}>{user.displayName?.[0] || '?'}</div>
              }
              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName?.split(' ')[0] || user.email}
              </span>
              <button onClick={logout} title="登出" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── FILTER BAR ────────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(9,13,22,0.7)', borderBottom: '1px solid var(--border-subtle)', padding: '10px 24px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', flexWrap: 'wrap' }}>
          
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: '600', whiteSpace: 'nowrap' }}>篩選：</span>

          {/* Favorites toggle */}
          <button onClick={() => setShowFavoritesOnly(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 13px', borderRadius: '20px', border: showFavoritesOnly ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)', background: showFavoritesOnly ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', color: showFavoritesOnly ? 'var(--accent-amber)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Heart size={13} fill={showFavoritesOnly ? 'var(--accent-amber)' : 'none'} /> 精選收藏 {totalFavorites > 0 && `(${totalFavorites})`}
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />

          {/* Member filter */}
          <button onClick={() => setMemberFilter('ALL')} style={{ padding: '5px 12px', borderRadius: '20px', border: memberFilter === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: memberFilter === 'ALL' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: memberFilter === 'ALL' ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
            全部成員
          </button>
          {members.map(m => (
            <button key={m.id} onClick={() => setMemberFilter(m.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', border: memberFilter === m.id ? `1px solid ${m.color}` : '1px solid var(--border-subtle)', background: memberFilter === m.id ? `${m.color}20` : 'rgba(255,255,255,0.04)', color: memberFilter === m.id ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {m.avatar} {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN GALLERY ──────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', padding: '28px 24px', flex: 1 }}>

        {/* Stats bar */}
        {photos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              共 <strong style={{ color: '#fff' }}>{filteredPhotos.length}</strong> 張家族照片
              {searchQuery && ` · 搜尋「${searchQuery}」`}
              {memberFilter !== 'ALL' && ` · ${members.find(m => m.id === memberFilter)?.name}`}
              {showFavoritesOnly && ' · 精選收藏'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {filteredPhotos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '4.5rem' }}>📷</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              {searchQuery || memberFilter !== 'ALL' || showFavoritesOnly ? '沒有符合條件的照片' : '相簿目前是空的'}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
              {searchQuery || memberFilter !== 'ALL' || showFavoritesOnly
                ? '試著清除篩選條件，查看所有照片。'
                : '點擊「上傳照片」，開始建立您的家族雲端記憶！'}
            </p>
            {!searchQuery && memberFilter === 'ALL' && !showFavoritesOnly && (
              <button className="btn btn-primary" onClick={() => setActiveModal('upload')} style={{ marginTop: '8px', padding: '12px 32px', fontSize: '1rem' }}>
                <Upload size={18} /> 上傳第一張家族照片
              </button>
            )}
          </div>
        )}

        {/* Photo Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {filteredPhotos.map(photo => {
            const uploader = members.find(m => m.id === photo.uploader);
            return (
              <div key={photo.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => { setSelectedPhoto(photo); setActiveModal('detail'); }}>

                {/* Image */}
                <div style={{ height: '210px', overflow: 'hidden', position: 'relative', background: '#000' }}>
                  <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'} />

                  {/* Favorite heart badge */}
                  <button onClick={e => { e.stopPropagation(); handleToggleFavorite(photo.id); }}
                    style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Heart size={15} fill={photo.isFavorite ? 'var(--accent-rose)' : 'none'} color={photo.isFavorite ? 'var(--accent-rose)' : '#fff'} />
                  </button>
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>{photo.title}</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {photo.date && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={12} /> {photo.date.split(' ')[0]}</span>}
                    {photo.location && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={12} color="var(--accent-rose)" /> {photo.location}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Member avatars */}
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {photo.members?.slice(0, 5).map(mId => {
                        const m = members.find(x => x.id === mId);
                        return m ? <span key={mId} title={m.name} style={{ fontSize: '1rem' }}>{m.avatar}</span> : null;
                      })}
                    </div>
                    {/* Counts */}
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                      <span onClick={e => { e.stopPropagation(); handleToggleLike(photo.id); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Heart size={13} color="var(--accent-rose)" /> {photo.likes}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        💬 {photo.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', background: 'rgba(9,13,22,0.85)' }}>
        家族雲端相簿 · {storageConfig.provider} · {storageConfig.connectedEmail}
      </footer>

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      {activeModal === 'upload' && (
        <UploadModal members={members} storageConfig={storageConfig} onClose={() => setActiveModal(null)} onUploadComplete={handleUpload} />
      )}
      {activeModal === 'detail' && selectedPhoto && (
        <PhotoDetailModal photo={selectedPhoto} members={members} currentUser={currentMember} onClose={() => setActiveModal(null)}
          onToggleFavorite={handleToggleFavorite} onToggleLike={handleToggleLike} onAddComment={handleAddComment} />
      )}
      {activeModal === 'storage' && (
        <StorageConfigModal storageConfig={storageConfig} onClose={() => setActiveModal(null)} onSaveConfig={setStorageConfig} />
      )}
    </div>
  );
}
