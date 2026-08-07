import React, { useState, useEffect } from 'react';
import { 
  Images, Heart, Search, Upload, HardDrive,
  Calendar, MapPin, LogOut, RefreshCw, Edit3,
  FolderPlus, Folder, Trash2, Cloud, Check, Download
} from 'lucide-react';
import JSZip from 'jszip';
import { INITIAL_STORAGE_CONFIG, INITIAL_ALBUMS } from './data/familyData';
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
  subscribeToAlbums, saveAlbumToCloud, deleteAlbumFromCloud,
  subscribeToMembers, saveMemberToCloud
} from './utils/cloudSync';

export default function App() {
  const { user, logout } = useAuth();

  const [members, setMembers] = useState([]);
  const [isMembersLoaded, setIsMembersLoaded] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);

  // Calculate real Cloudflare R2 storage usage dynamically
  const totalSizeBytes = photos.reduce((acc, p) => acc + (p.fileSize || (2.57 * 1024 * 1024)), 0);
  const displayUsedMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  const displayUsedGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2);
  const [storageConfig, setStorageConfigState] = useState(() => {
    const cached = localStorage.getItem('family_storage_config');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.totalGB === 2048 || parsed.provider?.includes('Google')) {
        localStorage.setItem('family_storage_config', JSON.stringify(INITIAL_STORAGE_CONFIG));
        return INITIAL_STORAGE_CONFIG;
      }
      return parsed;
    }
    return INITIAL_STORAGE_CONFIG;
  });

  const setStorageConfig = (config) => {
    setStorageConfigState(config);
    localStorage.setItem('family_storage_config', JSON.stringify(config));
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null); // null | { total: number, current: number, stage: 'fetching' | 'sharing' | 'fallback', photos: Array<{blob?: Blob, url: string, title: string}> }

  const [activeModal, setActiveModal] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null); // null | 'upload' | 'detail' | 'storage' | 'nickname' | 'invite' | 'createAlbum'
  const [selectedPhoto, setSelectedPhoto] = useState(null);


  // Real-time Cloud Sync Subscriptions — only subscribe when user is authenticated
  useEffect(() => {
    if (!user) return; // Wait for confirmed login before connecting to Firestore

    // Photos real-time cloud sync
    const unsubPhotos = subscribeToPhotos((cloudPhotos) => {
      if (Array.isArray(cloudPhotos)) {
        setPhotos(cloudPhotos);
      }
    }, (err) => {
      console.warn('Photos sync error:', err);
    });

    // Albums real-time cloud sync
    const unsubAlbums = subscribeToAlbums((cloudAlbums) => {
      if (Array.isArray(cloudAlbums)) {
        if (cloudAlbums.length === 0) {
          // Auto seed default albums to Firestore if empty
          INITIAL_ALBUMS.forEach(a => saveAlbumToCloud(a));
          setAlbums(INITIAL_ALBUMS);
        } else {
          // Ensure default 'alb-all' exists
          const hasDefault = cloudAlbums.some(a => a.id === 'alb-all');
          if (!hasDefault) {
            saveAlbumToCloud(INITIAL_ALBUMS[0]);
            setAlbums([INITIAL_ALBUMS[0], ...cloudAlbums]);
          } else {
            setAlbums(cloudAlbums);
          }
        }
      }
    }, (err) => {
      console.warn('Albums sync error:', err);
    });

    // Members real-time cloud sync
    const unsubMembers = subscribeToMembers((cloudMembers) => {
      if (Array.isArray(cloudMembers)) {
        setMembers(cloudMembers);
        setIsMembersLoaded(true);
      }
    }, (err) => {
      console.warn('Members sync error:', err);
      setIsMembersLoaded(true);
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
  }, [user]); // Re-subscribe whenever user changes (login/logout)


  // Find logged-in user's family member profile
  const currentMember = user ? members.find(m => m.id === user.uid || m.email === user.email) : null;

  // Auto-prompt NicknameModal if logged in for the first time without a nickname
  useEffect(() => {
    if (!user || !isMembersLoaded) return;
    
    // Check if the user profile is completely missing both in Cloud members and localStorage
    const hasLocalNickname = localStorage.getItem(`nickname_set_${user.uid}`);
    if (!currentMember && !hasLocalNickname) {
      setActiveModal('nickname');
    } else {
      // If member profile is loaded or local token exists, make sure modal is closed
      if (activeModal === 'nickname') {
        setActiveModal(null);
      }
    }
  }, [user, isMembersLoaded, currentMember, activeModal]);

  // Save or update member profile
  const handleSaveNickname = async (newMember) => {
    try {
      if (user) {
        localStorage.setItem(`nickname_set_${user.uid}`, 'true');
      }
      setMembers(prev => {
        const exists = prev.some(m => m.id === newMember.id || m.email === newMember.email);
        return exists
          ? prev.map(m => (m.id === newMember.id || m.email === newMember.email) ? newMember : m)
          : [...prev, newMember];
      });
      setActiveModal(null);
      await saveMemberToCloud(newMember);
    } catch (err) {
      console.error('Failed to save nickname to cloud:', err);
      // Still close modal so user can enter the app
      setActiveModal(null);
    }
  };



  // Create new Album
  const handleCreateAlbum = async (newAlbum) => {
    try {
      await saveAlbumToCloud(newAlbum);
      setAlbums(prev => {
        if (prev.some(a => a.id === newAlbum.id)) return prev;
        return [newAlbum, ...prev];
      });
    } catch (err) {
      console.error('Failed to create album on cloud:', err);
      setAlbums(prev => [newAlbum, ...prev]);
    }
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

  // Delete Album (Move its photos to 'alb-all' first)
  const handleDeleteAlbum = async (albumId, albumTitle) => {
    if (albumId === 'alb-all') {
      alert('「📸 全家福相片總集」為系統預設相簿，無法刪除！');
      return;
    }
    const confirmDelete = window.confirm(`⚠️ 確定要刪除相簿「${albumTitle}」嗎？\n\n此操作不會刪除相簿內部的照片，照片將會自動歸類至「📸 全家福相片總集」。`);
    if (!confirmDelete) return;

    try {
      // 1. Find all photos belonging to this album and migrate their albumId to 'alb-all' in cloud & local
      const photosToMigrate = photos.filter(p => p.albumId === albumId);
      
      // Update local state first for instant responsiveness
      setPhotos(prev => prev.map(p => p.albumId === albumId ? { ...p, albumId: 'alb-all' } : p));

      // Migrate on cloud
      await Promise.all(photosToMigrate.map(photo => {
        const updatedPhoto = { ...photo, albumId: 'alb-all' };
        savePhotoToDB(updatedPhoto);
        return savePhotoToCloud(updatedPhoto);
      }));

      // 2. Delete album from cloud
      await deleteAlbumFromCloud(albumId);
      
      // Update local albums state
      setAlbums(prev => prev.filter(a => a.id !== albumId));
      
      // Redirect to main overview if we were viewing the deleted album
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId('ALL');
      }
    } catch (err) {
      console.error('Failed to delete album:', err);
      alert('刪除相簿失敗，請重試！');
    }
  };

  // Batch Delete Selected Photos
  const handleBatchDeletePhotos = async () => {
    if (selectedPhotoIds.length === 0) return;
    const confirmDelete = window.confirm(`⚠️ 確定要刪除選取的 ${selectedPhotoIds.length} 張照片嗎？\n\n此操作將會同時從雲端、Cloudflare R2 儲存庫及本地快取中永久移除，且無法復原！`);
    if (!confirmDelete) return;

    try {
      const idsToDelete = [...selectedPhotoIds];
      const photosToDelete = photos.filter(p => idsToDelete.includes(p.id));

      // Update local state instantly
      setPhotos(prev => prev.filter(p => !idsToDelete.includes(p.id)));
      setSelectedPhotoIds([]);
      setIsSelectMode(false);

      // Perform cloud, R2, and DB deletions for all selected photos
      await Promise.all(
        photosToDelete.map(p => Promise.all([
          deletePhotoFromDB(p.id),
          deletePhotoFromCloud(p)
        ]))
      );
    } catch (err) {
      console.error('Failed to batch delete photos:', err);
    }
  };

  // Batch Download — Web Share API on mobile (save to Photos), ZIP on desktop
  const handleBatchDownloadPhotos = async () => {
    if (selectedPhotoIds.length === 0) return;

    const photosToDownload = photos.filter(p => selectedPhotoIds.includes(p.id));
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // ── Mobile: sequentially share each file ──
    if (isMobile) {
      setBatchProgress({
        total: photosToDownload.length,
        current: 0,
        stage: 'fetching',
        photos: photosToDownload.map(p => ({ url: p.url, title: p.title || '照片' }))
      });

      const fetchedPhotos = [];
      for (let i = 0; i < photosToDownload.length; i++) {
        const photo = photosToDownload[i];
        try {
          let blob;
          if (photo.url && photo.url.startsWith('data:')) {
            const parts = photo.url.split(';base64,');
            const raw = window.atob(parts[1]);
            const arr = new Uint8Array(raw.length);
            for (let j = 0; j < raw.length; j++) arr[j] = raw.charCodeAt(j);
            blob = new Blob([arr], { type: 'image/jpeg' });
          } else {
            const res = await fetch(photo.url);
            if (!res.ok) throw new Error('fetch failed');
            blob = await res.blob();
          }
          fetchedPhotos.push({ url: photo.url, title: photo.title || `照片_${i + 1}`, blob });
        } catch {
          fetchedPhotos.push({ url: photo.url, title: photo.title || `照片_${i + 1}` });
        }

        setBatchProgress(prev => {
          if (!prev) return null;
          return {
            ...prev,
            current: i + 1,
            photos: fetchedPhotos
          };
        });
      }

      const hasShare = !!(navigator.share && navigator.canShare);
      setBatchProgress(prev => {
        if (!prev) return null;
        return {
          ...prev,
          current: 0,
          stage: hasShare ? 'sharing' : 'fallback'
        };
      });
      return;
    }

    // ── Desktop: ZIP download ──
    setIsBatchDownloading(true);
    const zip = new JSZip();
    let loadedCount = 0;
    let failedCount = 0;
    const zipFolder = zip.folder("family_photos");

    await Promise.all(
      photosToDownload.map(async (photo, index) => {
        try {
          if (photo.url && photo.url.startsWith('data:')) {
            const parts = photo.url.split(';base64,');
            const raw = window.atob(parts[1]);
            const uInt8Array = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i);
            zipFolder.file(`${photo.title || 'photo'}_${index + 1}.jpg`, uInt8Array, { binary: true });
            loadedCount++;
          } else {
            const response = await fetch(photo.url);
            if (!response.ok) throw new Error("CORS or network error");
            const blob = await response.blob();
            zipFolder.file(`${photo.title || 'photo'}_${index + 1}.jpg`, blob);
            loadedCount++;
          }
        } catch (err) {
          console.error("Failed to add photo to ZIP bundle:", photo.url, err);
          failedCount++;
        }
      })
    );

    if (loadedCount === 0) {
      alert("❌ 批次打包失敗：無法下載任何相片。這通常是因為您的 Cloudflare R2 CORS 設定尚未開通！");
      setSelectedPhotoIds([]);
      setIsSelectMode(false);
      setIsBatchDownloading(false);
      return;
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const zipUrl = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `家族相簿照片包_${Date.now()}.zip`;
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(zipUrl), 1000);
      if (failedCount > 0) {
        alert(`📥 下載完畢！成功打包 ${loadedCount} 張。有 ${failedCount} 張因 CORS 未開通而失敗。`);
      }
    } catch (zipErr) {
      console.error("Failed to generate ZIP archive:", zipErr);
      alert("❌ 打包檔案時發生異常，無法生成壓縮檔。");
    }

    setSelectedPhotoIds([]);
    setIsSelectMode(false);
    setIsBatchDownloading(false);
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
      // Firestore's onSnapshot listener automatically and instantly handles adding this photo to the UI.
    } catch (err) {
      console.error('Failed to save uploaded photo to cloud, using local fallback:', err);
      setPhotos(prev => {
        if (prev.some(p => p.id === newPhoto.id)) return prev;
        return [newPhoto, ...prev];
      });
    }
  };


  // ─── Filtered photos ──────────────────────────────────────────────────
  const filteredPhotos = photos.filter(p => {
    if (showFavoritesOnly && !p.isFavorite) return false;
    if (selectedAlbumId !== 'ALL') {
      if (selectedAlbumId === 'alb-all') {
        // 'alb-all' shows all photos or unassigned photos
      } else if (p.albumId !== selectedAlbumId) {
        return false;
      }
    }
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
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100, padding: '12px 16px' }}>
        <div className="header-container" style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>

          {/* Top Row / Logo & Profile on Mobile */}
          <div className="header-top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
                <Images size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.15rem', fontWeight: '700', background: 'linear-gradient(90deg, #fff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  家族雲端相簿
                </h1>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  <Cloud size={10} color="var(--accent-cyan)" /> 雲端即時同步 · {storageConfig.totalGB}GB
                </span>
              </div>
            </div>

            {/* Mobile User Profile pill */}
            <div className="mobile-profile-only" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {currentMember ? (
                <div 
                  onClick={() => setActiveModal('nickname')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', 
                    background: `${currentMember.color || '#6366f1'}25`, border: `1px solid ${currentMember.color || '#6366f1'}60`, 
                    cursor: 'pointer' 
                  }}>
                  <span style={{ fontSize: '0.95rem' }}>{currentMember.avatar}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>{currentMember.name}</span>
                </div>
              ) : null}
              <button onClick={logout} title="登出" className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container" style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="搜尋照片、地點、標籤..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" style={{ paddingLeft: '38px', fontSize: '0.85rem' }} />
          </div>

          {/* Right controls */}
          <div className="header-controls no-scrollbar">
            
            {/* Storage pill */}
            <div onClick={() => setActiveModal('storage')} className="touch-active" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', cursor: 'pointer', flexShrink: 0 }}>
              <HardDrive size={14} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {displayUsedMB}MB ({displayUsedGB}GB) / 10GB
              </span>
            </div>

            {/* Create Album button */}
            <button className="btn btn-secondary touch-active" onClick={() => setActiveModal('createAlbum')} style={{ fontSize: '0.8rem', padding: '6px 12px', flexShrink: 0 }}>
              <FolderPlus size={15} /> 新增相簿
            </button>

            {/* Primary Upload button */}
            <button className="btn btn-primary touch-active" onClick={() => setActiveModal('upload')} style={{ fontSize: '0.8rem', padding: '6px 14px', flexShrink: 0 }}>
              <Upload size={15} /> 上傳照片
            </button>

            {/* Invite Button for all family members */}
            <button 
              className="btn btn-secondary touch-active" 
              onClick={() => setActiveModal('invite')}
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)', flexShrink: 0 }}>
              👥 邀請成員
            </button>
          </div>
        </div>
      </header>


      {/* ── FILTER BAR ────────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(9,13,22,0.7)', borderBottom: '1px solid var(--border-subtle)', padding: '10px 16px', overflowX: 'auto' }} className="no-scrollbar">
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px', width: 'max-content', minWidth: '100%' }}>
          
          {/* Back to All Albums Button */}
          {selectedAlbumId !== 'ALL' && (
            <button 
              onClick={() => setSelectedAlbumId('ALL')}
              className="btn btn-primary touch-active"
              style={{ padding: '5px 14px', fontSize: '0.8rem', borderRadius: '20px', flexShrink: 0 }}>
              ← 所有家族相簿
            </button>
          )}

          {/* Favorites toggle */}
          <button onClick={() => setShowFavoritesOnly(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 13px', borderRadius: '20px', border: showFavoritesOnly ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)', background: showFavoritesOnly ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', color: showFavoritesOnly ? 'var(--accent-amber)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Heart size={13} fill={showFavoritesOnly ? 'var(--accent-amber)' : 'none'} /> 精選收藏 {totalFavorites > 0 && `(${totalFavorites})`}
          </button>

          {/* Member filter chips */}
          {members.length > 0 && (
            <>
              <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', flexShrink: 0 }} />
              <button onClick={() => setMemberFilter('ALL')} style={{ padding: '5px 12px', borderRadius: '20px', border: memberFilter === 'ALL' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', background: memberFilter === 'ALL' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: memberFilter === 'ALL' ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
                全部成員
              </button>
              {members.map(m => (
                <button key={m.id} onClick={() => setMemberFilter(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', border: memberFilter === m.id ? `1px solid ${m.color}` : '1px solid var(--border-subtle)', background: memberFilter === m.id ? `${m.color}20` : 'rgba(255,255,255,0.04)', color: memberFilter === m.id ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {m.avatar} {m.name}
                </button>
              ))}
            </>
          )}

        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', padding: '20px 16px', flex: 1 }}>

        {/* ── VIEW 1: ALBUMS OVERVIEW (SELECTED_ALBUM === 'ALL') ────── */}
        {selectedAlbumId === 'ALL' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>📁 家族主題相簿 ({albums.filter(a => a.id !== 'alb-all').length})</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>雲端即時同步 · 共收錄 {photos.length} 張家族照片與聚會記憶</p>
              </div>

              <button className="btn btn-primary touch-active" onClick={() => setActiveModal('createAlbum')}>
                <FolderPlus size={16} /> 建立新相簿
              </button>
            </div>

            <div className="album-grid">
              {albums.filter(a => a.id !== 'alb-all').map(album => {
                const albumPhotos = photos.filter(p => p.albumId === album.id || (album.id === 'alb-all' && (!p.albumId || p.albumId === 'alb-all')));
                const cover = albumPhotos[0]?.url || album.coverImage;

                return (
                  <div key={album.id} className="album-card-wrapper animate-fade-in">
                    {album.id !== 'alb-all' && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '6px' }}>
                        <button 
                          className="album-delete-btn touch-active" 
                          title="編輯相簿資訊" 
                          style={{ position: 'static', background: 'rgba(99,102,241,0.8)' }}
                          onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); }}>
                          <Edit3 size={15} />
                        </button>
                        <button 
                          className="album-delete-btn touch-active" 
                          title="刪除相簿" 
                          style={{ position: 'static' }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id, album.title); }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                    <div className="glass-panel touch-active" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', height: '100%' }}
                      onClick={() => setSelectedAlbumId(album.id)}>
                      
                      <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#0a0f1d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cover ? (
                          <img src={cover} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '3.5rem' }}>📁</div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(9,13,22,0.9) 0%, transparent 60%)' }} />
                        <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px' }}>
                          <span className="badge badge-purple" style={{ marginBottom: '6px' }}>{album.category || '日常紀錄'}</span>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>{album.title}</h3>
                        </div>
                      </div>

                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        {album.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{album.description}</p>}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: 'auto' }}>
                          <span>📍 {album.location || '家族雲端'}</span>
                          <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>包含 {albumPhotos.length} 張照片</span>
                        </div>

                        <button 
                          className="btn btn-secondary" 
                          onClick={(e) => { e.stopPropagation(); setSelectedAlbumId(album.id); }}
                          style={{ width: '100%', marginTop: '4px' }}>
                          點擊進入相簿
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── VIEW 2: ALBUM PHOTO DETAIL VIEW (SELECTED_ALBUM !== 'ALL') ── */}
        {selectedAlbumId !== 'ALL' && (
          <div>
            {/* Header for Selected Album */}
            {(() => {
              const currentAlbum = albums.find(a => a.id === selectedAlbumId) || { title: '相簿照片', description: '', category: '' };
              return (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => setSelectedAlbumId('ALL')} className="btn btn-secondary touch-active" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                        ← 返回相簿列表
                      </button>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff' }}>{currentAlbum.title}</h2>
                      {currentAlbum.category && <span className="badge badge-purple">{currentAlbum.category}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        共 <strong style={{ color: '#fff' }}>{filteredPhotos.length}</strong> 張照片
                        {searchQuery && ` · 搜尋「${searchQuery}」`}
                        {memberFilter !== 'ALL' && ` · ${members.find(m => m.id === memberFilter)?.name}`}
                        {showFavoritesOnly && ' · 精選收藏'}
                      </span>
                      {filteredPhotos.length > 0 && (
                        <button 
                          onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            setSelectedPhotoIds([]);
                          }} 
                          className={`btn ${isSelectMode ? 'btn-primary' : 'btn-secondary'} touch-active`} 
                          style={{ fontSize: '0.8rem', padding: '5px 12px', borderRadius: '20px' }}>
                          {isSelectMode ? '✓ 完成選擇' : '⚙️ 選擇模式'}
                        </button>
                      )}
                      {isSelectMode && (
                        <button 
                          onClick={() => {
                            if (selectedPhotoIds.length === filteredPhotos.length) {
                              setSelectedPhotoIds([]);
                            } else {
                              setSelectedPhotoIds(filteredPhotos.map(p => p.id));
                            }
                          }} 
                          className="btn btn-secondary touch-active" 
                          style={{ fontSize: '0.8rem', padding: '5px 12px', borderRadius: '20px' }}>
                          {selectedPhotoIds.length === filteredPhotos.length ? '取消全選' : '全選照片'}
                        </button>
                      )}
                    </div>
                  </div>
                  {currentAlbum.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentAlbum.description}</p>}
                </div>
              );
            })()}

            {/* Empty State */}
            {filteredPhotos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '4.5rem' }}>📷</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>
                  {searchQuery || memberFilter !== 'ALL' || showFavoritesOnly ? '沒有符合條件的照片' : '此相簿內尚無照片'}
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                  {searchQuery || memberFilter !== 'ALL' || showFavoritesOnly
                    ? '試著清除搜尋或成員篩選條件。'
                    : '點擊下方按鈕上傳照片至這本相簿！'}
                </p>
                <button className="btn btn-primary" onClick={() => setActiveModal('upload')} style={{ marginTop: '8px', padding: '12px 32px', fontSize: '1rem' }}>
                  <Upload size={18} /> 上傳照片至此相簿
                </button>
              </div>
            )}

            {/* Photo Grid */}
            <div className="photo-grid">
              {filteredPhotos.map(photo => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <div 
                    key={photo.id} 
                    className={`photo-card-wrapper ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (isSelectMode) {
                        setSelectedPhotoIds(prev => 
                          prev.includes(photo.id) ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
                        );
                      } else {
                        setSelectedPhoto(photo);
                        setActiveModal('detail');
                      }
                    }}>

                    {isSelectMode && (
                      <div className={`photo-select-overlay ${isSelected ? 'selected' : ''}`}>
                        {isSelected && <Check size={13} color="#fff" style={{ strokeWidth: 3 }} />}
                      </div>
                    )}

                    <div className="glass-panel touch-active" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative', height: '100%' }}>
                      {/* Image */}
                      <div style={{ height: '210px', overflow: 'hidden', position: 'relative', background: '#000' }}>
                        <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'} />

                        {/* Top Action Badges */}
                        {!isSelectMode && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                            <button onClick={e => { e.stopPropagation(); handleToggleFavorite(photo.id); }}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Heart size={15} fill={photo.isFavorite ? 'var(--accent-rose)' : 'none'} color={photo.isFavorite ? 'var(--accent-rose)' : '#fff'} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>{photo.title}</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {photo.date && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={12} /> {photo.date.split(' ')[0]}</span>}
                          {photo.location && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={12} color="var(--accent-rose)" /> {photo.location}</span>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                          {/* Member avatars */}
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {photo.members?.slice(0, 5).map(mId => {
                              const m = members.find(x => x.id === mId);
                              return m ? <span key={mId} title={m.name} style={{ fontSize: '1rem' }}>{m.avatar}</span> : null;
                            })}
                          </div>
                          {/* Counts */}
                          <div style={{ display: 'flex', gap: '10px', fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                            <span onClick={e => { e.stopPropagation(); if (!isSelectMode) handleToggleLike(photo.id); }} style={{ cursor: isSelectMode ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Heart size={13} color="var(--accent-rose)" /> {photo.likes}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              💬 {photo.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ────────────────────────────── */}
      <nav className="mobile-bottom-nav">
        <button 
          onClick={() => { setSelectedAlbumId('ALL'); setShowFavoritesOnly(false); }} 
          className={`mobile-nav-item ${selectedAlbumId === 'ALL' && !showFavoritesOnly ? 'active' : ''}`}>
          <Folder size={20} />
          <span>相簿</span>
        </button>
        <button 
          onClick={() => setActiveModal('createAlbum')} 
          className="mobile-nav-item">
          <FolderPlus size={20} />
          <span>新相簿</span>
        </button>
        <button 
          onClick={() => setActiveModal('upload')} 
          className="mobile-nav-fab"
          title="上傳照片">
          <Upload size={22} />
        </button>
        <button 
          onClick={() => setShowFavoritesOnly(f => !f)} 
          className={`mobile-nav-item ${showFavoritesOnly ? 'active' : ''}`}>
          <Heart size={20} fill={showFavoritesOnly ? 'var(--accent-amber)' : 'none'} />
          <span>收藏</span>
        </button>
        <button 
          onClick={() => setActiveModal('storage')} 
          className="mobile-nav-item">
          <HardDrive size={20} />
          <span>容量</span>
        </button>
      </nav>


      {/* ── MODALS ────────────────────────────────────────────────────── */}

      {activeModal === 'upload' && (
        <UploadModal 
          albums={albums} 
          members={members} 
          currentMember={currentMember}
          existingPhotos={photos} 
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
          onUpdatePhoto={async (updatedPhoto) => {
            setSelectedPhoto(updatedPhoto);
            setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
            await savePhotoToDB(updatedPhoto);
            await savePhotoToCloud(updatedPhoto);
          }}
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

      {editingAlbum && (
        <CreateAlbumModal 
          albumToEdit={editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onUpdateAlbum={async (updatedAlbum) => {
            setAlbums(prev => prev.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
            await saveAlbumToCloud(updatedAlbum);
            setEditingAlbum(null);
          }}
        />
      )}

      {batchProgress && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            if (batchProgress.stage !== 'fetching') {
              setBatchProgress(null);
            }
          }}
          style={{ 
            zIndex: 1200, 
            background: 'rgba(3, 6, 12, 0.92)', 
            backdropFilter: 'blur(12px)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}>
          <div 
            className="glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '420px', 
              width: '90%', 
              padding: '24px', 
              borderRadius: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '18px', 
              border: '1px solid rgba(255,255,255,0.15)', 
              background: 'rgba(12, 18, 30, 0.95)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
              color: '#fff'
            }}>
            
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                📱 手機批次儲存
              </h3>
              
              {batchProgress.stage === 'fetching' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    正在下載準備照片中，請稍候...
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'center', gap: '8px', marginBottom: '14px' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
                    <span style={{ fontWeight: '700', fontSize: '1rem' }}>{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.2s ease' }}></div>
                  </div>
                </div>
              )}

              {batchProgress.stage === 'sharing' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                    照片準備完畢！我們將依序分享每一張照片。<br />
                    請點選下方按鈕，並在跳出的選單中選擇<strong>「儲存影像」</strong>。
                  </p>
                  
                  {batchProgress.photos[batchProgress.current] && (
                    <div style={{ 
                      width: '100%', 
                      height: '140px', 
                      borderRadius: '10px', 
                      background: '#03060c', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <img 
                        src={batchProgress.photos[batchProgress.current].url} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  <button 
                    className="btn btn-primary touch-active" 
                    onClick={async () => {
                      const curIndex = batchProgress.current;
                      const photoInfo = batchProgress.photos[curIndex];
                      if (!photoInfo) return;

                      try {
                        const filename = `${photoInfo.title || 'photo'}.jpg`;
                        let file;
                        if (photoInfo.blob) {
                          file = new File([photoInfo.blob], filename, { type: photoInfo.blob.type || 'image/jpeg' });
                        } else {
                          const res = await fetch(photoInfo.url);
                          const b = await res.blob();
                          file = new File([b], filename, { type: b.type || 'image/jpeg' });
                        }

                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({
                            files: [file],
                            title: photoInfo.title,
                          });
                        } else {
                          alert("本瀏覽器不支援直接分享，請對著圖片長按儲存。");
                        }
                      } catch (shareErr) {
                        console.error(shareErr);
                      }

                      const nextIndex = curIndex + 1;
                      if (nextIndex >= batchProgress.total) {
                        setBatchProgress(null);
                        setSelectedPhotoIds([]);
                        setIsSelectMode(false);
                      } else {
                        setBatchProgress(prev => ({
                          ...prev,
                          current: nextIndex
                        }));
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '30px', fontWeight: '700', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontSize: '0.95rem' }}>
                    📤 點此儲存第 {batchProgress.current + 1} / {batchProgress.total} 張照片
                  </button>
                </div>
              )}

              {batchProgress.stage === 'single-fallback' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#fb7185', marginBottom: '14px', lineHeight: '1.4', fontWeight: '600' }}>
                    ⚠️ 此照片受限制，無法自動儲存。<br />
                    請長按下方圖片並選擇「儲存影像」：
                  </p>
                  
                  {batchProgress.photos[batchProgress.current] && (
                    <div style={{ 
                      width: '100%', 
                      height: '180px', 
                      borderRadius: '10px', 
                      background: '#03060c', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <img 
                        src={batchProgress.photos[batchProgress.current].url} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', WebkitTouchCallout: 'default', userSelect: 'auto', pointerEvents: 'auto' }}
                      />
                    </div>
                  )}

                  <button 
                    className="btn btn-primary touch-active" 
                    onClick={() => {
                      const nextIndex = batchProgress.current + 1;
                      if (nextIndex >= batchProgress.total) {
                        setBatchProgress(null);
                        setSelectedPhotoIds([]);
                        setIsSelectMode(false);
                      } else {
                        setBatchProgress(prev => ({
                          ...prev,
                          current: nextIndex,
                          stage: 'sharing'
                        }));
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '30px', fontWeight: '700', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontSize: '0.95rem' }}>
                    下一張 ({batchProgress.current + 1} / {batchProgress.total})
                  </button>
                </div>
              )}

              {batchProgress.stage === 'fallback' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                    您的瀏覽器不支援自動批次下載。<br />
                    請對下方各照片<strong>長按</strong>並點選<strong>「儲存影像」</strong>：
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '45vh', overflowY: 'auto', padding: '4px', marginBottom: '16px' }} className="custom-scrollbar">
                    {batchProgress.photos.map((p, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#03060c', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <img 
                          src={p.url} 
                          alt={p.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', WebkitTouchCallout: 'default', userSelect: 'auto', pointerEvents: 'auto' }} 
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', fontSize: '0.65rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {idx + 1}. {p.title}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="btn btn-secondary touch-active" 
                    onClick={() => {
                      setBatchProgress(null);
                      setSelectedPhotoIds([]);
                      setIsSelectMode(false);
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '30px', fontWeight: '600' }}>
                    我已全部儲存
                  </button>
                </div>
              )}
            </div>

            {batchProgress.stage !== 'fetching' && (
              <button 
                onClick={() => setBatchProgress(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
                取消批次下載
              </button>
            )}
          </div>
        </div>
      )}

      {/* Batch Selection Action Bar - only render when select mode is active, photos are selected, and no modal is open */}
      {isSelectMode && selectedPhotoIds.length > 0 && !activeModal && (
        <div className="batch-action-bar visible">
          <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: '600' }}>
            已選取 {selectedPhotoIds.length} 張照片
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleBatchDownloadPhotos} 
              disabled={isBatchDownloading}
              className="btn touch-active" 
              style={{ 
                background: 'rgba(52, 211, 153, 0.15)', 
                border: '1px solid rgba(52, 211, 153, 0.4)', 
                color: '#34d399', 
                fontSize: '0.8rem', 
                padding: '6px 16px', 
                borderRadius: '30px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                opacity: isBatchDownloading ? 0.6 : 1,
                cursor: isBatchDownloading ? 'not-allowed' : 'pointer'
              }}>
              {isBatchDownloading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> 打包中...
                </>
              ) : (
                <>
                  <Download size={14} /> 批次下載
                </>
              )}
            </button>
            <button 
              onClick={handleBatchDeletePhotos} 
              className="btn touch-active" 
              style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', fontSize: '0.8rem', padding: '6px 16px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trash2 size={14} /> 批次刪除
            </button>
            <button 
              onClick={() => { setIsSelectMode(false); setSelectedPhotoIds([]); }} 
              className="btn btn-secondary touch-active" 
              style={{ fontSize: '0.8rem', padding: '6px 16px', borderRadius: '30px' }}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
