import React, { useState } from 'react';
import { 
  Images, FolderHeart, Calendar, Heart, Search, Upload, HardDrive, 
  Wand2, Filter, Sparkles, User, Tag, Plus, Check, MapPin, Eye,
  SlidersHorizontal, Download, Trash2, ShieldCheck, ChevronDown
} from 'lucide-react';

import { 
  INITIAL_FAMILY_MEMBERS, INITIAL_ALBUMS, 
  INITIAL_PHOTOS, INITIAL_STORAGE_CONFIG 
} from './data/familyData';

import PhotoEditor from './components/PhotoEditor';
import UploadModal from './components/UploadModal';
import PhotoDetailModal from './components/PhotoDetailModal';
import StorageConfigModal from './components/StorageConfigModal';

export default function App() {
  const [members] = useState(INITIAL_FAMILY_MEMBERS);
  const [albums, setAlbums] = useState(INITIAL_ALBUMS);
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [storageConfig, setStorageConfig] = useState(INITIAL_STORAGE_CONFIG);
  const [currentMember, setCurrentMember] = useState(members[3]); // Default: 小明 (我)

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'albums' | 'timeline' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('ALL');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('ALL');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // null | 'upload' | 'detail' | 'editor' | 'storage'
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Batch Selection
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);

  // Filter Photos
  const filteredPhotos = photos.filter(photo => {
    // Tab filter
    if (activeTab === 'favorites' && !photo.isFavorite) return false;
    
    // Album filter
    if (selectedAlbumId !== 'ALL' && photo.albumId !== selectedAlbumId) return false;

    // Member filter
    if (selectedMemberFilter !== 'ALL' && !photo.members.includes(selectedMemberFilter)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = photo.title.toLowerCase().includes(q);
      const matchLocation = photo.location.toLowerCase().includes(q);
      const matchTags = photo.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchLocation && !matchTags) return false;
    }

    return true;
  });

  // Photo handlers
  const handleToggleFavorite = (photoId) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p));
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
  };

  const handleToggleLike = (photoId) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: p.likes + 1 } : p));
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto(prev => ({ ...prev, likes: prev.likes + 1 }));
    }
  };

  const handleAddComment = (photoId, comment) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, comments: [...p.comments, comment] } : p));
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto(prev => ({ ...prev, comments: [...prev.comments, comment] }));
    }
  };

  const handleSaveEditedPhoto = (photoId, editedUrl) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, url: editedUrl } : p));
  };

  const handleUploadComplete = (newPhoto) => {
    setPhotos([newPhoto, ...photos]);
  };

  const toggleSelectPhoto = (id) => {
    if (selectedPhotoIds.includes(id)) {
      setSelectedPhotoIds(selectedPhotoIds.filter(pId => pId !== id));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, id]);
    }
  };

  const handleBatchDownload = () => {
    selectedPhotoIds.forEach(id => {
      const p = photos.find(item => item.id === id);
      if (p) {
        const a = document.createElement('a');
        a.href = p.url;
        a.download = `${p.title}.jpg`;
        a.click();
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* TOP HEADER */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100, padding: '12px 28px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              <Images size={24} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.3px', background: 'linear-gradient(90deg, #fff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  家族雲端相簿
                </h1>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  <Sparkles size={12} /> Google AI Pro 5TB 雲端對接
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>四代同堂照片全記錄 • 多人線上修圖與雲端協作</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Storage capacity pill */}
            <div 
              onClick={() => setActiveModal('storage')}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                padding: '6px 14px', borderRadius: '30px', cursor: 'pointer'
              }}
              className="glass-panel">
              <HardDrive size={16} color="var(--accent-cyan)" />
              <div style={{ fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>雲端空間：</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{storageConfig.usedGB}GB / {storageConfig.totalGB}GB</strong>
              </div>
            </div>

            {/* Current Member identity switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid var(--border-active)', padding: '6px 14px', borderRadius: '30px' }}>
              <span style={{ fontSize: '1.1rem' }}>{currentMember.avatar}</span>
              <select 
                value={currentMember.id}
                onChange={e => setCurrentMember(members.find(m => m.id === e.target.value))}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                {members.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#111827', color: '#fff' }}>
                    切換身分：{m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <button className="btn btn-primary" onClick={() => setActiveModal('upload')}>
              <Upload size={16} /> 雲端上傳照片
            </button>

          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Navigation Tabs Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button 
              onClick={() => setActiveTab('gallery')}
              className={`btn ${activeTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Images size={16} /> 藝廊總覽 ({photos.length})
            </button>
            <button 
              onClick={() => setActiveTab('albums')}
              className={`btn ${activeTab === 'albums' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <FolderHeart size={16} /> 家族相簿 ({albums.length})
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Calendar size={16} /> 時間軸歷程
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`btn ${activeTab === 'favorites' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Heart size={16} color="var(--accent-rose)" /> 精選收藏 ({photos.filter(p => p.isFavorite).length})
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', minWidth: '320px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="搜尋照片標題、地點、標籤 (如：沖繩、壽宴)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Albums Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', whiteSpace: 'nowrap' }}>
              活動分類：
            </span>
            <button 
              onClick={() => setSelectedAlbumId('ALL')}
              style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                background: selectedAlbumId === 'ALL' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                color: '#fff', border: '1px solid var(--border-subtle)'
              }}>
              全部照片
            </button>
            {albums.map(alb => (
              <button
                key={alb.id}
                onClick={() => setSelectedAlbumId(alb.id)}
                style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                  background: selectedAlbumId === alb.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: selectedAlbumId === alb.id ? '#fff' : 'var(--text-muted)',
                  border: selectedAlbumId === alb.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap'
                }}>
                {alb.title}
              </button>
            ))}
          </div>

          {/* Member Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>登場成員：</span>
            <button
              onClick={() => setSelectedMemberFilter('ALL')}
              style={{
                padding: '4px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                background: selectedMemberFilter === 'ALL' ? 'rgba(99, 102, 241, 0.2)' : 'none',
                color: selectedMemberFilter === 'ALL' ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: 'none'
              }}>
              全員
            </button>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberFilter(m.id)}
                style={{
                  padding: '4px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                  background: selectedMemberFilter === m.id ? `${m.color}30` : 'none',
                  color: selectedMemberFilter === m.id ? '#fff' : 'var(--text-muted)',
                  border: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                <span>{m.avatar}</span> {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Selection Action Floating Bar */}
        {selectedPhotoIds.length > 0 && (
          <div className="glass-panel animate-fade-in" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--accent-primary)', background: 'rgba(99, 102, 241, 0.15)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>
              已選取 <strong>{selectedPhotoIds.length}</strong> 張照片
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={handleBatchDownload} style={{ fontSize: '0.82rem' }}>
                <Download size={14} /> 批次下載原圖
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedPhotoIds([])} style={{ fontSize: '0.82rem' }}>
                取消選取
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: GALLERY VIEW */}
        {(activeTab === 'gallery' || activeTab === 'favorites') && (
          filteredPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '4rem' }}>🖼️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {activeTab === 'favorites' ? '尚無精選照片' : '相簿目前是空的'}
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                {activeTab === 'favorites'
                  ? '點擊照片上的愛心圖示，即可將珍貴照片加入精選收藏！'
                  : '點擊右上角「雲端上傳照片」，開始建立您的家族雲端相簿吧！'}
              </p>
              {activeTab === 'gallery' && (
                <button className="btn btn-primary" onClick={() => setActiveModal('upload')} style={{ marginTop: '8px', padding: '12px 28px', fontSize: '1rem' }}>
                  <Upload size={18} /> 上傳第一張家族照片
                </button>
              )}
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
            {filteredPhotos.map(photo => {
              const uploader = members.find(m => m.id === photo.uploader);
              const isSelected = selectedPhotoIds.includes(photo.id);

              return (
                <div 
                  key={photo.id}
                  className="glass-panel"
                  style={{ 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                  }}>
                  
                  {/* Photo Container */}
                  <div style={{ height: '220px', overflow: 'hidden', position: 'relative', background: '#000' }}>
                    <img 
                      src={photo.url} 
                      alt={photo.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                    />

                    {/* Top Overlay Badges */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectPhoto(photo.id)}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      />
                      <button 
                        onClick={() => handleToggleFavorite(photo.id)}
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Heart size={16} fill={photo.isFavorite ? 'var(--accent-rose)' : 'none'} color={photo.isFavorite ? 'var(--accent-rose)' : '#fff'} />
                      </button>
                    </div>

                    {/* Bottom Quick Action Overlay */}
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => { setSelectedPhoto(photo); setActiveModal('editor'); }}
                        title="開啟線上修圖編輯器"
                        style={{ width: '34px', height: '34px', background: 'rgba(0,0,0,0.6)' }}>
                        <Wand2 size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => { setSelectedPhoto(photo); setActiveModal('detail'); }}
                        title="檢視詳細資訊與留言"
                        style={{ width: '34px', height: '34px', background: 'rgba(0,0,0,0.6)' }}>
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Photo Info Content */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 
                        onClick={() => { setSelectedPhoto(photo); setActiveModal('detail'); }}
                        style={{ fontSize: '1rem', fontWeight: '700', cursor: 'pointer', hover: { color: 'var(--accent-primary)' } }}>
                        {photo.title}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {photo.date.split(' ')[0]}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="var(--accent-rose)" /> {photo.location}
                      </span>
                    </div>

                    {/* Member Avatars Tagged */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {photo.members.map(mId => {
                          const m = members.find(item => item.id === mId);
                          return m ? (
                            <span key={mId} title={m.name} style={{ fontSize: '1.1rem' }}>{m.avatar}</span>
                          ) : null;
                        })}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span onClick={() => handleToggleLike(photo.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Heart size={14} color="var(--accent-rose)" /> {photo.likes}
                        </span>
                        <span>💬 {photo.comments.length}</span>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
          )
        )}

        {/* TAB 2: ALBUMS VIEW */}
        {activeTab === 'albums' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {albums.map(album => (
              <div key={album.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <img src={album.coverImage} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(9,13,22,0.9) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
                    <span className="badge badge-purple" style={{ marginBottom: '6px' }}>{album.category}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>{album.title}</h3>
                  </div>
                </div>

                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{album.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <span>📍 {album.location}</span>
                    <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>包含 {album.photoCount} 張相片</span>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setSelectedAlbumId(album.id); setActiveTab('gallery'); }}
                    style={{ width: '100%', marginTop: '6px' }}>
                    檢視此相簿照片
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: TIMELINE VIEW */}
        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingLeft: '20px', borderLeft: '2px solid var(--accent-primary)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '-31px', marginBottom: '16px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-primary)', border: '4px solid var(--bg-dark)' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>2026 年家族大事記</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {photos.map(p => (
                  <div key={p.id} className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setSelectedPhoto(p); setActiveModal('detail'); }}>
                    <img src={p.url} alt={p.title} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>{p.title}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.date}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>📍 {p.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 28px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(9,13,22,0.8)' }}>
        <p>家族雲端照片管理系統 © 2026 • 已串接 {storageConfig.provider} ({storageConfig.connectedEmail})</p>
      </footer>

      {/* MODALS */}
      {activeModal === 'upload' && (
        <UploadModal 
          albums={albums}
          members={members}
          storageConfig={storageConfig}
          onClose={() => setActiveModal(null)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {activeModal === 'editor' && selectedPhoto && (
        <PhotoEditor 
          photo={selectedPhoto}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveEditedPhoto}
        />
      )}

      {activeModal === 'detail' && selectedPhoto && (
        <PhotoDetailModal 
          photo={selectedPhoto}
          members={members}
          albums={albums}
          currentUser={currentMember}
          onClose={() => setActiveModal(null)}
          onOpenEditor={(p) => { setSelectedPhoto(p); setActiveModal('editor'); }}
          onToggleFavorite={handleToggleFavorite}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
        />
      )}

      {activeModal === 'storage' && (
        <StorageConfigModal 
          storageConfig={storageConfig}
          onClose={() => setActiveModal(null)}
          onSaveConfig={setStorageConfig}
        />
      )}

    </div>
  );
}
