import React, { useState } from 'react';
import { X, Heart, Download, MapPin, Calendar, MessageSquare, Send, Trash2, RefreshCw, Edit3, Check } from 'lucide-react';
import PhotoEditor from './PhotoEditor';
import confetti from 'canvas-confetti';
import { uploadToR2 } from '../utils/r2Storage';
import SafeImage from './SafeImage';

export default function PhotoDetailModal({ 
  photo, albums = [], members = [], currentUser, onClose, 
  onToggleFavorite, onToggleLike, onAddComment, onDeletePhoto, onUpdatePhoto 
}) {
  const [commentText, setCommentText] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Photo Info Editing state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTitle, setEditTitle] = useState(photo.title || '');
  const [editLocation, setEditLocation] = useState(photo.location || '');
  const [editAlbumId, setEditAlbumId] = useState(photo.albumId || '');
  const [editMembers, setEditMembers] = useState(photo.members || []);
  const [editTags, setEditTags] = useState(photo.tags || []);
  const [editTagInput, setEditTagInput] = useState('');

  const uploader = members.find(m => m.id === photo.uploader);
  const taggedMembers = members.filter(m => (isEditingInfo ? editMembers : photo.members)?.includes(m.id));

  const handleLike = () => {
    onToggleLike(photo.id);
    confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
  };

  const triggerDirectDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleSaveEdited = async (id, newUrl) => {
    setIsEditing(false);
    try {
      // Convert base64 data URI to File
      const res = await fetch(newUrl);
      const blob = await res.blob();
      const file = new File([blob], `edited_${photo.title || 'photo'}.jpg`, { type: 'image/jpeg' });
      
      const r2Data = await uploadToR2(file);
      
      let finalUrl = newUrl;
      let newR2Key = photo.r2Key;
      
      if (r2Data?.success && r2Data?.url) {
        finalUrl = r2Data.url;
        newR2Key = r2Data.key;
      }
      
      const updated = { ...photo, url: finalUrl, r2Key: newR2Key };
      if (onUpdatePhoto) {
        await onUpdatePhoto(updated);
      }
    } catch (err) {
      console.error('Failed to save edited photo to R2:', err);
      // Fallback to data URI if R2 fails
      const updated = { ...photo, url: newUrl };
      if (onUpdatePhoto) {
        await onUpdatePhoto(updated);
      }
    }
  };

  const handleSaveInfo = async () => {
    const updated = {
      ...photo,
      title: editTitle.trim() || photo.title,
      location: editLocation.trim(),
      albumId: editAlbumId,
      members: editMembers,
      tags: editTags
    };
    if (onUpdatePhoto) {
      await onUpdatePhoto(updated);
    }
    setIsEditingInfo(false);
  };

  const toggleMemberTag = (mId) => {
    setEditMembers(prev => 
      prev.includes(mId) ? prev.filter(x => x !== mId) : [...prev, mId]
    );
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && editTagInput.trim()) {
      e.preventDefault();
      if (!editTags.includes(editTagInput.trim())) {
        setEditTags([...editTags, editTagInput.trim()]);
      }
      setEditTagInput('');
    }
  };

  const handleDownload = async () => {
    const filename = `${photo.title || 'photo'}.jpg`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    setIsDownloading(true);

    try {
      let blob;
      if (photo.url && photo.url.startsWith('data:')) {
        const parts = photo.url.split(';base64,');
        const raw = window.atob(parts[1]);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        blob = new Blob([arr], { type: 'image/jpeg' });
      } else if (photo.driveFileId) {
        window.open(`https://drive.google.com/uc?export=download&id=${photo.driveFileId}`, '_blank');
        setIsDownloading(false);
        return;
      } else {
        const response = await fetch(photo.url);
        if (!response.ok) throw new Error("Fetch failed");
        blob = await response.blob();
      }

      if (isMobile) {
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: photo.title || '家族相簿照片',
            });
            setIsDownloading(false);
            return;
          } catch (shareErr) {
            if (shareErr.name === 'AbortError') {
              setIsDownloading(false);
              return;
            }
          }
        }
        setShowMobileGuide(true);
      } else {
        const blobUrl = window.URL.createObjectURL(blob);
        triggerDirectDownload(blobUrl, filename);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      }
    } catch (err) {
      console.error(err);
      if (isMobile) {
        setShowMobileGuide(true);
      } else {
        window.open(photo.url, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(photo.id, {
      id: `c-${Date.now()}`,
      memberId: currentUser.id,
      text: commentText.trim(),
      time: '剛剛'
    });
    setCommentText('');
  };

  const handleDelete = () => {
    onDeletePhoto(photo.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel photo-detail-modal animate-fade-in" 
        onClick={e => e.stopPropagation()} 
        style={{ width: '94vw', maxWidth: '1100px', height: '86vh', display: 'flex', overflow: 'hidden', padding: 0 }}>

        {/* Photo View */}
        <div style={{ flex: 1.5, background: '#03060c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
          {/* Floating Close Button */}
          <button 
            onClick={onClose}
            style={{ 
              position: 'absolute', 
              top: '16px', 
              right: '16px', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 99
            }}
            title="關閉"
            className="touch-active">
            <X size={20} />
          </button>

          <SafeImage src={photo.url} alt={photo.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }} />

          {/* Action buttons overlay */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsEditing(true)}
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Edit3 size={15} /> 編輯影像
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleDownload} 
              disabled={isDownloading}
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px', opacity: isDownloading ? 0.7 : 1 }}>
              {isDownloading ? (
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Download size={15} />
              )}
              {isDownloading ? "下載中..." : "下載原圖"}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowConfirmDelete(true)} 
              style={{ fontSize: '0.82rem', borderColor: 'rgba(244,63,94,0.4)', color: '#fb7185' }}>
              <Trash2 size={15} /> 刪除照片
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div style={{ width: '340px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-subtle)', background: 'rgba(12,18,30,0.97)' }}>

          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: '10px' }}>
              {isEditingInfo ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)} 
                    className="search-input" 
                    placeholder="照片標題"
                    style={{ paddingLeft: '10px', fontSize: '0.9rem', fontWeight: '700' }} 
                  />
                  <input 
                    type="text" 
                    value={editLocation} 
                    onChange={e => setEditLocation(e.target.value)} 
                    className="search-input" 
                    placeholder="拍攝地點"
                    style={{ paddingLeft: '10px', fontSize: '0.78rem' }} 
                  />
                  {albums.length > 0 && (
                    <select 
                      value={editAlbumId} 
                      onChange={e => setEditAlbumId(e.target.value)} 
                      className="search-input"
                      style={{ paddingLeft: '10px', fontSize: '0.78rem', appearance: 'auto' }}>
                      <option value="" style={{ background: '#111827', color: '#fff' }}>未分類相簿</option>
                      {albums.map(a => (
                        <option key={a.id} value={a.id} style={{ background: '#111827', color: '#fff' }}>{a.title}</option>
                      ))}
                    </select>
                  )}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button className="btn btn-secondary" onClick={() => setIsEditingInfo(false)} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>取消</button>
                    <button className="btn btn-primary" onClick={handleSaveInfo} style={{ fontSize: '0.75rem', padding: '3px 10px' }}><Check size={13} /> 儲存資訊</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{photo.title}</h2>
                    <button 
                      onClick={() => setIsEditingInfo(true)} 
                      title="編輯資訊"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {photo.date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> {photo.date}</span>}
                    {photo.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} color="var(--accent-rose)" /> {photo.location}</span>}
                  </div>
                </div>
              )}
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          <div style={{ flex: 1, padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Delete Confirmation Box */}
            {showConfirmDelete && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '12px', padding: '14px', color: '#fff' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>⚠️ 確定要刪除這張照片嗎？</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>刪除後將同步清除雲端與本機備份。</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowConfirmDelete(false)} style={{ fontSize: '0.78rem', padding: '4px 10px' }}>取消</button>
                  <button className="btn btn-primary" onClick={handleDelete} style={{ fontSize: '0.78rem', padding: '4px 12px', background: 'var(--accent-rose)' }}>確定刪除</button>
                </div>
              </div>
            )}

            {/* Uploader & Tagged Members */}
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>登場成員</p>
              {isEditingInfo ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {members.map(m => {
                    const sel = editMembers.includes(m.id);
                    return (
                      <button key={m.id} type="button" onClick={() => toggleMemberTag(m.id)}
                        style={{ padding: '3px 9px', borderRadius: '16px', border: sel ? `1px solid ${m.color}` : '1px solid var(--border-subtle)', background: sel ? `${m.color}25` : 'rgba(255,255,255,0.04)', color: sel ? '#fff' : 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                        {m.avatar} {m.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {uploader && (
                    <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.8rem', fontWeight: '600' }}>
                      {uploader.avatar} {uploader.name} <span style={{ color: 'var(--text-dim)', fontWeight: '400' }}>(上傳)</span>
                    </span>
                  )}
                  {taggedMembers.filter(m => m.id !== photo.uploader).map(m => (
                    <span key={m.id} className="badge" style={{ background: `${m.color}20`, border: `1px solid ${m.color}40`, color: '#fff' }}>
                      {m.avatar} {m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>標籤</p>
              {isEditingInfo ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                    {editTags.map(t => (
                      <span key={t} className="badge badge-purple">#{t} <X size={11} style={{ cursor: 'pointer' }} onClick={() => setEditTags(editTags.filter(x => x !== t))} /></span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="新增標籤按 Enter" 
                    value={editTagInput} 
                    onChange={e => setEditTagInput(e.target.value)} 
                    onKeyDown={handleAddTag} 
                    className="search-input" 
                    style={{ paddingLeft: '10px', fontSize: '0.78rem' }} 
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {photo.tags?.length > 0 ? (
                    photo.tags.map(t => <span key={t} className="badge badge-purple">#{t}</span>)
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>無標籤</span>
                  )}
                </div>
              )}
            </div>

            {/* Likes & Favorite */}
            <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', alignItems: 'center' }}>
              <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>
                <Heart size={17} fill="var(--accent-rose)" /> {photo.likes}
              </button>
              <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
              <button onClick={() => onToggleFavorite(photo.id)} style={{ background: 'none', border: 'none', color: photo.isFavorite ? 'var(--accent-amber)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                {photo.isFavorite ? '★ 已加精選' : '☆ 加入精選'}
              </button>
            </div>

            {/* Comments */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                <MessageSquare size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                家族留言 ({photo.comments?.length || 0})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {(!photo.comments || photo.comments.length === 0) ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>還沒有留言，來第一個留下回憶吧！</p>
                ) : (
                  photo.comments.map(c => {
                    const m = members.find(x => x.id === c.memberId);
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: '9px', background: 'rgba(255,255,255,0.04)', padding: '9px 11px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{m?.avatar || '👤'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: m?.color || '#fff' }}>{m?.name || '成員'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{c.time}</span>
                          </div>
                          <p style={{ fontSize: '0.83rem', color: 'var(--text-main)', marginTop: '2px' }}>{c.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form onSubmit={handleComment} style={{ display: 'flex', gap: '7px' }}>
                <input type="text" placeholder={`${currentUser.name} 留言...`} value={commentText} onChange={e => setCommentText(e.target.value)} className="search-input" style={{ paddingLeft: '12px', flex: 1 }} />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 14px' }}><Send size={14} /></button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {isEditing && (
        <PhotoEditor 
          photo={photo} 
          onClose={() => setIsEditing(false)} 
          onSave={handleSaveEdited} 
        />
      )}

      {showMobileGuide && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { e.stopPropagation(); setShowMobileGuide(false); }}
          style={{ 
            zIndex: 1100, 
            background: 'rgba(3, 6, 12, 0.9)', 
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
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)'
            }}>
            
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                📱 儲存照片說明
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                手機不支援自動下載。請<strong>長按下方圖片</strong>，然後點選「儲存影像」或「加到照片」以存入您的相簿。
              </p>
            </div>

            <div style={{ 
              width: '100%', 
              maxHeight: '40vh', 
              overflow: 'hidden', 
              borderRadius: '12px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)', 
              display: 'flex', 
              justifyContent: 'center', 
              background: '#03060c',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <img 
                src={photo.url} 
                alt="長按以儲存" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '40vh', 
                  objectFit: 'contain', 
                  WebkitTouchCallout: 'default',
                  userSelect: 'auto',
                  pointerEvents: 'auto'
                }} 
              />
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => setShowMobileGuide(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '30px', fontWeight: '600', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>
              關閉提示
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
