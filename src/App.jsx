import React, { useState, useEffect } from 'react';
import {
  Images, Heart, Search, Upload, HardDrive,
  Sparkles, Calendar, MapPin, LogOut, RefreshCw, Edit3, UserCheck,
  FolderPlus, Folder, Trash2, Cloud
} from 'lucide-react';

import { INITIAL_STORAGE_CONFIG } from './data/familyData';
import UploadModal from './components/UploadModal';
import PhotoDetailModal from './components/PhotoDetailModal';
import StorageConfigModal from './components/StorageConfigModal';
import NicknameModal from './components/NicknameModal';
import InviteModal from './components/InviteModal';
import CreateAlbumModal from './components/CreateAlbumModal';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import { getAllPhotosFromDB, savePhotoToDB, deletePhotoFromDB } from './utils/photoStorage';
import {
  subscribeToPhotos, savePhotoToCloud, deletePhotoFromCloud,
  subscribeToAlbums, saveAlbumToCloud,
  subscribeToMembers, saveMemberToCloud
} from './utils/cloudSync';

export default function App() {
  const { user, isAdmin, logout } = useAuth();

  const [members, setMembers] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [storageConfig, setStorageConfig] = useState(INITIAL_STORAGE_CONFIG);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'albums'

  const [activeModal, setActiveModal] = useState(null); // null | 'upload' | 'detail' | 'storage' | 'nickname' | 'invite' | 'createAlbum'
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Real-time Cloud Sync Subscriptions
  useEffect(() => {
    // Photos real-time cloud sync
    const unsubPhotos = subscribeToPhotos((cloudPhotos) => {
      if (cloudPhotos && cloudPhotos.length > 0) {
        setPhotos(cloudPhotos);
      }
    });

    // Albums real-time cloud sync
    const unsubAlbums = subscribeToAlbums((cloudAlbums) => {
      if (cloudAlbums && cloudAlbums.length > 0) {
        setAlbums(cloudAlbums);
      }
    });

    // Members real-time cloud sync
    const unsubMembers = subscribeToMembers((cloudMembers) => {
      if (cloudMembers && cloudMembers.length > 0) {
        setMembers(cloudMembers);
      }
    });

    // Fallback: Local IndexedDB for offline cache
    async function loadLocalFallback() {
      const localPhotos = await getAllPhotosFromDB();
      if (localPhotos && localPhotos.length > 0) {
        setPhotos(prev => prev.length === 0 ? localPhotos : prev);
      }
    }
    loadLocalFallback();

    return () => {
      unsubPhotos();
      unsubAlbums();
      unsubMembers();
    };
  }, []);

  // Find logged-in user's family member profile
  const currentMember = user ? members.find(m => m.id === user.uid || m.email === user.email) : null;

  // Auto-prompt NicknameModal if logged in for the first time without a nickname
  useEffect(() => {
    if (user && !currentMember) {
      setActiveModal('nickname');
    }
  }, [user, currentMember]);

  // Save or update member profile
  const handleSaveNickname = async (newMember) => {
    setMembers(prev => {
      const exists = prev.some(m => m.id === newMember.id || m.email === newMember.email);
      return exists
        ? prev.map(m => (m.id === newMember.id || m.email === newMember.email) ? newMember : m)
        : [...prev, newMember];
    });
    setActiveModal(null);
    await saveMemberToCloud(newMember);
  };

  // Create new Album
  const handleCreateAlbum = async (newAlbum) => {
    setAlbums(prev => [newAlbum, ...prev]);
    await saveAlbumToCloud(newAlbum);
  };

  // Delete Photo
  const handleDeletePhoto = async (id) => {
    try {
      await deletePhotoFromDB(id);
      await deletePhotoFromCloud(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
      if (selectedPhoto?.id === id) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  // ─── Auth Guard ────────────────────────────────────────────────────────
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
  const handleToggleFavorite = async (id) => {
    setPhotos(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
      const target = updated.find(p => p.id === id);
      if (target) {
        savePhotoToDB(target);
        savePhotoToCloud(target);
      }
      return updated;
    });
    setSelectedPhoto(prev => prev?.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev);
  };

  const handleToggleLike = async (id) => {
    setPhotos(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p);
      const target = updated.find(p => p.id === id);
      if (target) {
        savePhotoToDB(target);
        savePhotoToCloud(target);
      }
      return updated;
    });
    setSelectedPhoto(prev => prev?.id === id ? { ...prev, likes: prev.likes + 1 } : prev);
  };

  const handleAddComment = async (id, comment) => {
    setPhotos(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, comments: [...(p.comments || []), comment] } : p);
      const target = updated.find(p => p.id === id);
      if (target) {
        savePhotoToDB(target);
        savePhotoToCloud(target);
      }
      return updated;
    });
    setSelectedPhoto(prev => prev?.id === id ? { ...prev, comments: [...(prev.comments || []), comment] } : prev);
  };

  const handleUpload = async (newPhoto) => {
    try {
      await savePhotoToDB(newPhoto);
      await savePhotoToCloud(newPhoto);
      setPhotos(prev => [newPhoto, ...prev]);
    } catch (err) {
      console.error('Failed to save uploaded photo:', err);
      setPhotos(prev => [newPhoto, ...prev]);
    }
  };

  // ─── Filtered photos ──────────────────────────────────────────────────
  const filteredPhotos = photos.filter(p => {
    if (showFavoritesOnly && !p.isFavorite) return false;
    if (selectedAlbumId !== 'ALL' && p.albumId !== selectedAlbumId) return false;
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
                <Cloud size={11} color="var(--accent-cyan)" /> 雲端即時同步 · {storageConfig.totalGB}GB
              </span>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
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

            {/* Current Member Badge / Edit Nickname */}
            {currentMember ? (
              <div 
                onClick={() => setActiveModal('nickname')}
                title="點擊修改暱稱"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '30px', 
                  background: `${currentMember.color || '#6366f1'}20`, border: `1px solid ${currentMember.color || '#6366f1'}50`, 
                  cursor: 'pointer' 
                }}>
                <span style={{ fontSize: '1.1rem' }}>{currentMember.avatar}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{currentMember.name}</span>
                <Edit3 size={13} color="var(--text-muted)" />
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setActiveModal('nickname')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <UserCheck size={14} /> 設定家族暱稱
              </button>
            )}

            {/* Upload */}
            <button className="btn btn-primary" onClick={() => setActiveModal('upload')}>
              <Upload size={16} /> 上傳照片
            </button>

            {/* Admin Invite Button */}
            {isAdmin && (
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveModal('invite')}
                style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}>
                👑 邀請成員
              </button>
            )}

            {/* User Avatar & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px 5px 6px', borderRadius: '30px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)' }}>
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>{user.displayName?.[0] || '?'}</div>
              }
              <button onClick={logout} title="登出" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── FILTER & TAB BAR ────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(9,13,22,0.7)', borderBottom: '1px solid var(--border-subtle)', padding: '10px 24px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Main Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
            <button 
              onClick={() => { setActiveTab('gallery'); setSelectedAlbumId('ALL'); }}
              className={`btn ${activeTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '16px' }}>
              <Images size={15} /> 照片藝廊 ({photos.length})
            </button>
            <button 
              onClick={() => setActiveTab('albums')}
              className={`btn ${activeTab === 'albums' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '16px' }}>
              <Folder size={15} /> 家族相簿 ({albums.length})
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

          {/* Favorites toggle */}
          <button onClick={() => setShowFavoritesOnly(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 13px', borderRadius: '20px', border: showFavoritesOnly ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)', background: showFavoritesOnly ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', color: showFavoritesOnly ? 'var(--accent-amber)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Heart size={13} fill={showFavoritesOnly ? 'var(--accent-amber)' : 'none'} /> 精選收藏 {totalFavorites > 0 && `(${totalFavorites})`}
          </button>

          {/* Album Filter chips */}
          {albums.length > 0 && activeTab === 'gallery' && (
            <>
              <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />
              <button 
                onClick={() => setSelectedAlbumId('ALL')}
                style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                  background: selectedAlbumId === 'ALL' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.04)',
                  color: '#fff', border: selectedAlbumId === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                }}>
                全部相簿
              </button>
              {albums.map(alb => (
                <button
                  key={alb.id}
                  onClick={() => setSelectedAlbumId(alb.id)}
                  style={{
                    padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                    background: selectedAlbumId === alb.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.04)',
                    color: selectedAlbumId === alb.id ? '#fff' : 'var(--text-muted)',
                    border: selectedAlbumId === alb.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap'
                  }}>
                  {alb.title}
                </button>
              ))}
            </>
          )}

          {/* Member filter */}
          {members.length > 0 && (
            <>
              <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />
              <button onClick={() => setMemberFilter('ALL')} style={{ padding: '5px 12px', borderRadius: '20px', border: memberFilter === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: memberFilter === 'ALL' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: memberFilter === 'ALL' ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                全部成員
              </button>
              {members.map(m => (
                <button key={m.id} onClick={() => setMemberFilter(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', border: memberFilter === m.id ? `1px solid ${m.color}` : '1px solid var(--border-subtle)', background: memberFilter === m.id ? `${m.color}20` : 'rgba(255,255,255,0.04)', color: memberFilter === m.id ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {m.avatar} {m.name}
                </button>
              ))}
            </>
          )}

        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', padding: '28px 24px', flex: 1 }}>

        {/* TAB 1: GALLERY VIEW */}
        {activeTab === 'gallery' && (
          <>
            {photos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  共 <strong style={{ color: '#fff' }}>{filteredPhotos.length}</strong> 張家族照片
                  {selectedAlbumId !== 'ALL' && ` · ${albums.find(a => a.id === selectedAlbumId)?.title}`}
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
                  {searchQuery || memberFilter !== 'ALL' || selectedAlbumId !== 'ALL' || showFavoritesOnly ? '沒有符合條件的照片' : '相簿目前是空的'}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                  {searchQuery || memberFilter !== 'ALL' || selectedAlbumId !== 'ALL' || showFavoritesOnly
                    ? '試著清除篩選條件，查看所有照片。'
                    : '點擊「上傳照片」，開始建立您的家族雲端記憶！'}
                </p>
                {!searchQuery && memberFilter === 'ALL' && selectedAlbumId === 'ALL' && !showFavoritesOnly && (
                  <button className="btn btn-primary" onClick={() => setActiveModal('upload')} style={{ marginTop: '8px', padding: '12px 32px', fontSize: '1rem' }}>
                    <Upload size={18} /> 上傳第一張家族照片
                  </button>
                )}
              </div>
            )}

            {/* Photo Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {filteredPhotos.map(photo => {
                return (
                  <div key={photo.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
                    onClick={() => { setSelectedPhoto(photo); setActiveModal('detail'); }}>

                    {/* Image */}
                    <div style={{ height: '210px', overflow: 'hidden', position: 'relative', background: '#000' }}>
                      <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'} />

                      {/* Top Action Badges */}
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        <button onClick={e => { e.stopPropagation(); handleToggleFavorite(photo.id); }}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Heart size={15} fill={photo.isFavorite ? 'var(--accent-rose)' : 'none'} color={photo.isFavorite ? 'var(--accent-rose)' : '#fff'} />
                        </button>
                      </div>
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
          </>
        )}

        {/* TAB 2: ALBUMS VIEW */}
        {activeTab === 'albums' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>家族主題相簿 ({albums.length})</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>按慶典、旅遊與家族大事分類管理照片</p>
              </div>

              <button className="btn btn-primary" onClick={() => setActiveModal('createAlbum')}>
                <FolderPlus size={16} /> 建立新相簿
              </button>
            </div>

            {/* Empty Albums */}
            {albums.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '4rem' }}>📁</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700' }}>尚未建立任何家族相簿</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                  點擊右上角「建立新相簿」，開始為家族活動分類整理照片！
                </p>
                <button className="btn btn-primary" onClick={() => setActiveModal('createAlbum')} style={{ marginTop: '8px', padding: '12px 28px', fontSize: '1rem' }}>
                  <FolderPlus size={18} /> 建立第一個家族相簿
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
                {albums.map(album => {
                  const albumPhotos = photos.filter(p => p.albumId === album.id);
                  const cover = albumPhotos[0]?.url || album.coverImage;

                  return (
                    <div key={album.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#0a0f1d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cover ? (
                          <img src={cover} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '3rem' }}>📁</div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(9,13,22,0.9) 0%, transparent 60%)' }} />
                        <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px' }}>
                          <span className="badge badge-purple" style={{ marginBottom: '6px' }}>{album.category}</span>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{album.title}</h3>
                        </div>
                      </div>

                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        {album.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{album.description}</p>}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: 'auto' }}>
                          <span>📍 {album.location}</span>
                          <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>包含 {albumPhotos.length} 張照片</span>
                        </div>

                        <button 
                          className="btn btn-secondary" 
                          onClick={() => { setSelectedAlbumId(album.id); setActiveTab('gallery'); }}
                          style={{ width: '100%', marginTop: '4px' }}>
                          瀏覽相簿照片
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', background: 'rgba(9,13,22,0.85)' }}>
        家族雲端相簿 · {storageConfig.provider} · 已加入家族成員：{members.length} 位
      </footer>

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      {activeModal === 'upload' && (
        <UploadModal 
          albums={albums} 
          members={members} 
          currentMember={currentMember} 
          storageConfig={storageConfig} 
          onClose={() => setActiveModal(null)} 
          onUploadComplete={handleUpload} 
        />
      )}
      {activeModal === 'detail' && selectedPhoto && (
        <PhotoDetailModal 
          photo={selectedPhoto} 
          members={members} 
          currentUser={currentMember || { id: user.uid, name: user.displayName || '家族成員' }} 
          onClose={() => setActiveModal(null)}
          onToggleFavorite={handleToggleFavorite} 
          onToggleLike={handleToggleLike} 
          onAddComment={handleAddComment} 
          onDeletePhoto={handleDeletePhoto}
        />
      )}
      {activeModal === 'storage' && (
        <StorageConfigModal storageConfig={storageConfig} onClose={() => setActiveModal(null)} onSaveConfig={setStorageConfig} />
      )}
      {activeModal === 'nickname' && (
        <NicknameModal 
          googleUser={user} 
          defaultName={currentMember?.name}
          onSave={handleSaveNickname} 
        />
      )}
      {activeModal === 'invite' && (
        <InviteModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'createAlbum' && (
        <CreateAlbumModal 
          onClose={() => setActiveModal(null)}
          onCreateAlbum={handleCreateAlbum}
        />
      )}
    </div>
  );
}
