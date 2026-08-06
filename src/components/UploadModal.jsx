import React, { useState } from 'react';
import { X, Upload, Check, Cloud, MapPin, Tag, User, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadModal({ members, currentMember, storageConfig, onClose, onUploadComplete }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(currentMember ? [currentMember.id] : []);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [previewUrls, setPreviewUrls] = useState([]);
  const [fileObjects, setFileObjects] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setFileObjects(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    if (!title && files[0]) setTitle(files[0].name.replace(/\.[^/.]+$/, ''));
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileObjects.length && !previewUrls.length) return;
    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Convert all file objects to permanent Data URLs
      const persistentUrls = await Promise.all(
        fileObjects.map(file => fileToDataURL(file))
      );

      setUploadProgress(70);

      const newPhotos = persistentUrls.map((url, i) => ({
        id: `photo-${Date.now()}-${i}`,
        title: persistentUrls.length > 1 ? `${title} (${i + 1})` : title || '家族照片',
        url,
        date: new Date().toLocaleString('zh-TW', { hour12: false }),
        location: location || '',
        uploader: currentMember?.id || 'admin',
        members: selectedMembers,
        likes: 0,
        isFavorite: false,
        tags,
        comments: [],
        timestamp: Date.now() + i
      }));

      setUploadProgress(100);
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.65 } });
      
      // Send persistent photos to parent
      newPhotos.forEach(p => onUploadComplete(p));
      onClose();
    } catch (err) {
      console.error('Error processing upload files:', err);
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '90vw', maxWidth: '600px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>上傳照片至家族相簿</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cloud size={13} color="var(--accent-cyan)" /> {storageConfig.provider}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isUploading}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Drop Zone */}
          <div style={{ border: '2px dashed var(--border-active)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', background: 'rgba(99,102,241,0.05)', position: 'relative', cursor: 'pointer' }}>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            {previewUrls.length > 0 ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {previewUrls.slice(0, 5).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                ))}
                {previewUrls.length > 5 && <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '700' }}>+{previewUrls.length - 5}</div>}
                <div style={{ width: '100%', fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: '600', marginTop: '4px' }}>
                  <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  已選取 {previewUrls.length} 張照片 · 點擊可重新選擇
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
                <div style={{ fontSize: '2.5rem' }}>📸</div>
                <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>拖拽照片到此處，或點擊選擇</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>支援 JPG、PNG、HEIC、多選上傳</p>
              </div>
            )}
          </div>

          {/* Title & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>照片標題</label>
              <input type="text" placeholder="如：全家福大合照" value={title} onChange={e => setTitle(e.target.value)} className="search-input" style={{ paddingLeft: '14px' }} required />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>拍攝地點（選填）</label>
              <input type="text" placeholder="如：台北市" value={location} onChange={e => setLocation(e.target.value)} className="search-input" style={{ paddingLeft: '14px' }} />
            </div>
          </div>

          {/* Tag Members */}
          {members.length > 0 && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>標記家族成員</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {members.map(m => {
                  const sel = selectedMembers.includes(m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                      style={{ padding: '5px 12px', borderRadius: '20px', border: sel ? `1px solid ${m.color}` : '1px solid var(--border-subtle)', background: sel ? `${m.color}25` : 'rgba(255,255,255,0.04)', color: sel ? '#fff' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {m.avatar} {m.name}
                      {sel && <Check size={12} color={m.color} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>標籤（Enter 新增）</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: tags.length ? '8px' : '0' }}>
              {tags.map(t => (
                <span key={t} className="badge badge-purple">#{t} <X size={11} style={{ cursor: 'pointer' }} onClick={() => setTags(tags.filter(x => x !== t))} /></span>
              ))}
            </div>
            <input type="text" placeholder="輸入標籤後按 Enter（如：生日、旅遊）" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} className="search-input" style={{ paddingLeft: '14px' }} />
          </div>

          {/* Progress */}
          {isUploading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>正在轉為高畫質備份並存入雲端...</span><span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gradient-main)', transition: 'width 0.12s ease' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUploading}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={isUploading || !previewUrls.length}>
              {isUploading ? '處理中...' : `📤 上傳至家族雲端`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
