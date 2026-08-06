import React, { useState } from 'react';
import { 
  X, Heart, Wand2, Download, MapPin, Calendar, Camera, Info, 
  MessageSquare, Send, Tag, User, ShieldCheck, Share2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PhotoDetailModal({ 
  photo, members, albums, currentUser, onClose, onOpenEditor, 
  onToggleFavorite, onToggleLike, onAddComment 
}) {
  const [commentText, setCommentText] = useState('');
  
  const album = albums.find(a => a.id === photo.albumId);
  const uploader = members.find(m => m.id === photo.uploader);
  const taggedMembers = members.filter(m => photo.members.includes(m.id));

  const handleCommentSubmit = (e) => {
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

  const handleLike = () => {
    onToggleLike(photo.id);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.title}.jpg`;
    a.click();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '94vw', maxWidth: '1200px', height: '88vh', display: 'flex', overflow: 'hidden', padding: 0 }}>
        
        {/* Left Side: Large Photo Viewport */}
        <div style={{ flex: 1.4, background: '#03060c', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
          <img 
            src={photo.url} 
            alt={photo.title}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.8)'
            }} 
          />

          {/* Top Quick Actions Bar over image */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => onOpenEditor(photo)} style={{ fontSize: '0.85rem' }}>
              <Wand2 size={16} /> 進入線上編輯器
            </button>
            <button className="btn btn-secondary" onClick={handleDownload} style={{ fontSize: '0.85rem' }}>
              <Download size={16} /> 下載高畫質原圖
            </button>
          </div>
        </div>

        {/* Right Side: Info & Comments Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-subtle)', background: 'rgba(12, 18, 30, 0.95)' }}>
          
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-purple" style={{ marginBottom: '6px' }}>{album?.title || '家族相簿'}</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '4px' }}>{photo.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {photo.date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="var(--accent-rose)" /> {photo.location}
                </span>
              </div>
            </div>

            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Uploader & Tagged Members */}
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                上傳者與登場家族成員
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {uploader && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <span>{uploader.avatar}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff' }}>{uploader.name} (上傳)</span>
                  </div>
                )}
                {taggedMembers.map(m => (
                  <span key={m.id} className="badge" style={{ background: `${m.color}20`, border: `1px solid ${m.color}40`, color: '#fff' }}>
                    {m.avatar} {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Likes & Favorite Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <button 
                onClick={handleLike}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', 
                  color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' 
                }}>
                <Heart size={18} fill="var(--accent-rose)" /> {photo.likes} 人按讚讚賞
              </button>

              <div style={{ height: '16px', width: '1px', background: 'var(--border-subtle)' }} />

              <button 
                onClick={() => onToggleFavorite(photo.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', 
                  color: photo.isFavorite ? 'var(--accent-amber)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' 
                }}>
                ★ {photo.isFavorite ? '已加入家族精選' : '加入精選相片'}
              </button>
            </div>

            {/* EXIF Details */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                <Camera size={15} /> 相機 EXIF 參數
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div>📸 相機: <strong style={{ color: '#fff' }}>{photo.exif.camera}</strong></div>
                <div>🔍 鏡頭: <strong style={{ color: '#fff' }}>{photo.exif.lens}</strong></div>
                <div>⚡ 光圈: <strong style={{ color: '#fff' }}>{photo.exif.fstop}</strong></div>
                <div>⏱️ 快門: <strong style={{ color: '#fff' }}>{photo.exif.shutter}</strong></div>
                <div>ISO: <strong style={{ color: '#fff' }}>{photo.exif.iso}</strong></div>
                <div>📐 解析度: <strong style={{ color: '#fff' }}>{photo.exif.resolution}</strong></div>
              </div>
            </div>

            {/* Family Comments Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '12px' }}>
                <MessageSquare size={16} color="var(--accent-primary)" /> 家族成員留言討論 ({photo.comments.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {photo.comments.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>尚無留言，成為第一個留下祝福的家族成員吧！</p>
                ) : (
                  photo.comments.map(c => {
                    const commentMember = members.find(m => m.id === c.memberId);
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{commentMember?.avatar || '👤'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: commentMember?.color || '#fff' }}>
                              {commentMember?.name || '家族成員'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{c.time}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>{c.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder={`以「${currentUser.name}」身份留言...`}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '14px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
                  <Send size={15} />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
