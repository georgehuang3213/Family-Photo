import React, { useState } from 'react';
import { X, Heart, Download, MapPin, Calendar, MessageSquare, Send, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PhotoDetailModal({ photo, members, currentUser, onClose, onToggleFavorite, onToggleLike, onAddComment }) {
  const [commentText, setCommentText] = useState('');

  const uploader = members.find(m => m.id === photo.uploader);
  const taggedMembers = members.filter(m => photo.members?.includes(m.id));

  const handleLike = () => {
    onToggleLike(photo.id);
    confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.title}.jpg`;
    a.click();
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

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '94vw', maxWidth: '1100px', height: '86vh', display: 'flex', overflow: 'hidden', padding: 0 }}>

        {/* Photo View */}
        <div style={{ flex: 1.5, background: '#03060c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
          <img src={photo.url} alt={photo.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }} />

          {/* Download button overlay */}
          <button className="btn btn-secondary" onClick={handleDownload} style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '0.82rem' }}>
            <Download size={15} /> 下載原圖
          </button>
        </div>

        {/* Info Panel */}
        <div style={{ width: '340px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-subtle)', background: 'rgba(12,18,30,0.97)' }}>

          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{photo.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {photo.date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> {photo.date}</span>}
                {photo.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} color="var(--accent-rose)" /> {photo.location}</span>}
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          <div style={{ flex: 1, padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Uploader & Tagged Members */}
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>登場成員</p>
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
            </div>

            {/* Tags */}
            {photo.tags?.length > 0 && (
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>標籤</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {photo.tags.map(t => <span key={t} className="badge badge-purple">#{t}</span>)}
                </div>
              </div>
            )}

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
    </div>
  );
}
