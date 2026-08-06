import React, { useState } from 'react';
import { Upload, X, Check, Image as ImageIcon, FolderPlus, Tag, ShieldCheck, Cloud } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function UploadModal({ albums, members, storageConfig, onClose, onUploadComplete }) {
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0]?.id || '');
  const [selectedMembers, setSelectedMembers] = useState(['m4']); // default current user
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('台北');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['家族合照', '溫馨時刻']);
  const [files, setFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('/demo_photos/birthday.jpg');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const fileList = Array.from(e.target.files);
    if (fileList.length > 0) {
      setFiles(fileList);
      const url = URL.createObjectURL(fileList[0]);
      setPreviewUrl(url);
      if (!title) {
        setTitle(fileList[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const toggleMemberTag = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsUploading(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
          
          onUploadComplete({
            id: `photo-${Date.now()}`,
            title: title || '新上傳家族照片',
            albumId: selectedAlbumId,
            url: previewUrl,
            date: new Date().toLocaleString('zh-TW', { hour12: false }),
            location: location || '台灣',
            uploader: 'm4',
            members: selectedMembers,
            likes: 1,
            isFavorite: false,
            tags: tags,
            exif: {
              camera: 'iPhone 15 Pro Max',
              lens: '24mm eq. f/1.78',
              iso: '64',
              fstop: 'f/1.78',
              shutter: '1/120s',
              resolution: '4032 x 3024'
            },
            comments: []
          });
          onClose();
        }, 400);
      }
    }, 150);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '90vw', maxWidth: '680px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>上傳照片至家族雲端</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cloud size={14} color="var(--accent-cyan)" /> 儲存至 {storageConfig.provider} (直連高畫質備份)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isUploading}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* File Drag & Drop Zone */}
          <div 
            style={{ 
              border: '2px dashed var(--border-active)', 
              borderRadius: 'var(--radius-md)', 
              padding: '24px', 
              textAlign: 'center',
              background: 'rgba(99, 102, 241, 0.05)',
              position: 'relative',
              cursor: 'pointer'
            }}>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
            {previewUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px', boxShadow: 'var(--shadow-sm)' }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: '600', fontSize: '0.92rem' }}>已選擇 1 張高清照片</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>自動識別 EXIF 拍攝時間與地點</p>
                  <span className="badge badge-emerald" style={{ marginTop: '6px' }}>
                    <ShieldCheck size={12} /> 原圖高清保存 (RAW / High-Res)
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={36} color="var(--accent-primary)" />
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>拖拽照片到此處，或點擊選擇檔案</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>支援 JPG, PNG, HEIC, RAW 格式</p>
              </div>
            )}
          </div>

          {/* Form Controls Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>照片標題：</label>
              <input 
                type="text" 
                placeholder="例如：沖繩海邊開心大合照" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '14px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>歸屬家族相簿：</label>
              <select 
                value={selectedAlbumId} 
                onChange={e => setSelectedAlbumId(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '14px', appearance: 'auto' }}>
                {albums.map(a => (
                  <option key={a.id} value={a.id} style={{ background: '#111827', color: '#fff' }}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>拍攝地點：</label>
            <input 
              type="text" 
              placeholder="例如：沖繩古宇利島" 
              value={location} 
              onChange={e => setLocation(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '14px' }}
            />
          </div>

          {/* Tag Family Members */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>標記照片中的家族成員：</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {members.map(m => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMemberTag(m.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: isSelected ? `1px solid ${m.color}` : '1px solid var(--border-subtle)',
                      background: isSelected ? `${m.color}30` : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                    <span>{m.avatar}</span>
                    <span>{m.name}</span>
                    {isSelected && <Check size={12} color={m.color} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tags */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>相片標籤 (按 Enter 新增)：</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map(t => (
                <span key={t} className="badge badge-purple" style={{ paddingRight: '6px' }}>
                  #{t}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                </span>
              ))}
            </div>
            <input 
              type="text" 
              placeholder="輸入標籤後按 Enter" 
              value={tagInput} 
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="search-input"
              style={{ paddingLeft: '14px' }}
            />
          </div>

          {/* Progress bar if uploading */}
          {isUploading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>正在上傳至 {storageConfig.provider}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gradient-main)', transition: 'width 0.15s ease' }} />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUploading}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploading}>
              {isUploading ? '雲端上傳中...' : '開始上傳至家族雲端'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
