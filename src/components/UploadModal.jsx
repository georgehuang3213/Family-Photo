import React, { useState } from 'react';
import { X, Upload, Check, ShieldCheck, HardDrive, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { uploadToR2 } from '../utils/r2Storage';

// Fast high-quality image compression (< 0.2s, target ~200KB for fallback)
function compressImage(file, maxWidth = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadModal({ albums = [], members, currentMember, existingPhotos = [], _storageConfig, onClose, onUploadComplete, selectedAlbumId: propAlbumId }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState(
    (propAlbumId && propAlbumId !== 'ALL') ? propAlbumId : ''
  );
  const [location, setLocation] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [fileObjects, setFileObjects] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadErrorMessage, setUploadErrorMessage] = useState(null);
  const [skippedDuplicateCount, setSkippedDuplicateCount] = useState(0);
  const [isConvertingHeic, setIsConvertingHeic] = useState(false);

  const handleFileChange = async (e) => {
    const rawFiles = Array.from(e.target.files);
    if (!rawFiles.length) return;

    // Check if there are any HEIC files
    const hasHeic = rawFiles.some(file => file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic');

    let processedFiles = [];
    if (hasHeic) {
      setIsConvertingHeic(true);
      try {
        const heic2anyModule = await import('heic2any');
        const heic2any = heic2anyModule.default || heic2anyModule;

        for (let file of rawFiles) {
          if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
            try {
              const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.85
              });
              const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
              processedFiles.push(new File([blobToUse], newName, { type: 'image/jpeg' }));
            } catch (err) {
              console.warn('Failed to convert HEIC file in file change:', file.name, err);
              // Fallback: try compressImage native conversion if possible
              try {
                const dataUrl = await compressImage(file, 2048, 0.88);
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                processedFiles.push(new File([blob], newName, { type: 'image/jpeg' }));
              } catch (fallbackErr) {
                console.error('Fallback conversion also failed, keeping original:', fallbackErr);
                processedFiles.push(file);
              }
            }
          } else {
            processedFiles.push(file);
          }
        }
      } catch (err) {
        console.error('Failed to load heic2any library:', err);
        processedFiles = rawFiles;
      } finally {
        setIsConvertingHeic(false);
      }
    } else {
      processedFiles = rawFiles;
    }

    const existingSignatures = new Set(
      (existingPhotos || []).map(p => `${p.originalFileName || p.title}_${p.fileSize || 0}`)
    );

    const seenInBatch = new Set();
    const files = [];
    let skipped = 0;

    for (const file of processedFiles) {
      const sig = `${file.name}_${file.size}`;
      const titleSig = `${file.name.replace(/\.[^/.]+$/, "")}_${file.size}`;

      if (existingSignatures.has(sig) || existingSignatures.has(titleSig) || seenInBatch.has(sig)) {
        skipped++;
      } else {
        seenInBatch.add(sig);
        files.push(file);
      }
    }

    setSkippedDuplicateCount(skipped);

    if (!files.length) {
      return;
    }

    setFileObjects(prev => {
      const existingSignatures = new Set(prev.map(f => `${f.name}_${f.size}`));
      const newUniqueFiles = files.filter(f => !existingSignatures.has(`${f.name}_${f.size}`));
      const combined = [...prev, ...newUniqueFiles];
      
      const totalCount = combined.length;
      if (!title && totalCount === 1) {
        setTitle(combined[0].name.replace(/\.[^/.]+$/, ""));
      } else if (!title || title.startsWith('家族照片包')) {
        setTitle(`家族照片包 (${totalCount}張)`);
      }
      return combined;
    });

    setPreviewUrls(prev => {
      const newUrls = files.map(file => URL.createObjectURL(file));
      return [...prev, ...newUrls];
    });
  };

  const handleResetFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFileObjects([]);
    setPreviewUrls([]);
    setSkippedDuplicateCount(0);
    setTitle('');
  };

  // Bug #9 Fix: Revoke object URLs only on component unmount, not on every previewUrls change
  // This prevents preview images from briefly going blank when previewUrls updates
  const previewUrlsRef = React.useRef(previewUrls);
  React.useEffect(() => { previewUrlsRef.current = previewUrls; }, [previewUrls]);
  React.useEffect(() => {
    return () => { previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  const toggleMember = (mId) => {
    setSelectedMembers(prev => 
      prev.includes(mId) ? prev.filter(x => x !== mId) : [...prev, mId]
    );
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileObjects.length && !previewUrls.length) return;
    setIsUploading(true);
    setUploadProgress(5);
    setUploadErrorMessage(null);

    const total = fileObjects.length;
    let completed = 0;
    const processedPhotos = [];

    // Helper for chunked upload execution with concurrency limit = 3
    const CONCURRENCY_LIMIT = 3;
    const queue = fileObjects.map((file, i) => ({ file, i }));

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        let { file, i } = item;

        // Auto-convert HEIC/HEIF files to JPG on mobile devices that support it natively
        if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
          try {
            // Convert to high-quality 2K JPEG using native browser canvas decoding
            const dataUrl = await compressImage(file, 2048, 0.88);
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            file = new File([blob], newName, { type: 'image/jpeg' });
          } catch (heicErr) {
            console.warn('HEIC to JPEG conversion failed, uploading original file:', heicErr);
          }
        }

        let photoUrl = '';
        let r2Key = '';

        try {
          const r2Data = await uploadToR2(file);
          if (r2Data?.success && r2Data?.url) {
            photoUrl = r2Data.url;
            r2Key = r2Data.key;
          } else if (r2Data?.error) {
            console.warn('Cloudflare R2 upload rejected:', r2Data.error);
            setUploadErrorMessage(r2Data.error);
          }
        } catch (r2Err) {
          console.error('R2 upload error:', r2Err);
          setUploadErrorMessage(r2Err.message || '上傳失敗');
        }

        // Fallback to compressed Base64 only if R2 upload fails
        if (!photoUrl) {
          console.warn('Falling back to local compressed storage for file:', file.name);
          photoUrl = await compressImage(file);
        }

        completed++;
        setUploadProgress(5 + Math.round((completed / total) * 90));

        processedPhotos.push({
          id: crypto.randomUUID ? crypto.randomUUID() : `photo-${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,
          albumId: selectedAlbumId || 'alb-all',
          title: fileObjects.length > 1 ? `${title} (${i + 1})` : title || '家族照片',
          url: photoUrl,
          driveFileId: null,
          r2Key: r2Key || null,
          originalFileName: file.name,
          fileSize: file.size,
          date: new Date().toLocaleString('zh-TW', { hour12: false }),
          location: location || '',
          uploader: currentMember?.id || user?.uid || 'admin',
          members: selectedMembers,
          likes: 0,
          isFavorite: false,
          tags,
          comments: [],
          timestamp: Date.now() + i
        });
      }
    };

    const workers = [];
    for (let w = 0; w < Math.min(CONCURRENCY_LIMIT, total); w++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    setUploadProgress(100);
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.65 } });
    
    // Sort by timestamp descending
    processedPhotos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Batch update local & cloud state in one shot
    onUploadComplete(processedPhotos);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={() => !isUploading && onClose()}>
      <div className="glass-panel animate-fade-in" onClick={e => e.stopPropagation()} style={{ width: '90vw', maxWidth: '600px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>上傳家族照片</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>支援整包批次上傳與 Cloudflare R2 雲端儲存</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isUploading}>
            <X size={18} />
          </button>
        </div>

        {/* Cloudflare R2 Storage Banner */}
        <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={15} color="var(--accent-indigo)" />
            已啟用 Cloudflare R2 雲端儲存（支援 100% 無損原檔儲存）
          </div>
        </div>

        {/* Duplicate Photo Filter Banner */}
        {skippedDuplicateCount > 0 && (
          <div style={{ background: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.82rem', color: '#a5b4fc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
            已自動過濾掉 {skippedDuplicateCount} 張重複上傳的照片（僅處理新圖片）
          </div>
        )}

        {/* Cloudflare R2 Upload Error Banner */}
        {uploadErrorMessage && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.8rem', color: '#fb7185', fontWeight: '600', lineHeight: '1.4' }}>
            ⚠️ Cloudflare R2 雲端寫入警告：{uploadErrorMessage}。<br />
            相片已自動降級儲存，請確認 Cloudflare R2 金鑰與 CORS 設定。
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Drop Zone */}
          <div style={{ border: '2px dashed var(--border-active)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', background: 'rgba(99,102,241,0.05)', position: 'relative', cursor: 'pointer' }}>
            <input type="file" accept="image/*,.heic,.HEIC" multiple onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} disabled={isConvertingHeic} />
            {isConvertingHeic ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
                <RefreshCw size={36} color="var(--accent-indigo)" style={{ animation: 'spin 1.5s linear infinite' }} />
                <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>正在轉換 HEIC 照片格式...</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>正在自動轉為 JPEG 格式，以確保電腦與 Android 裝置可順利觀看</p>
              </div>
            ) : previewUrls.length > 0 ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {previewUrls.slice(0, 5).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                ))}
                {previewUrls.length > 5 && <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '700' }}>+{previewUrls.length - 5}</div>}
                <div style={{ width: '100%', fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />已選取 {previewUrls.length} 張照片（可點擊繼續加選）</span>
                  <button type="button" onClick={handleResetFiles} style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>清空重新選擇</button>
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

          {/* Title & Album */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>照片標題</label>
              <input type="text" placeholder="如：聚餐大合照" value={title} onChange={e => setTitle(e.target.value)} className="search-input" style={{ paddingLeft: '14px' }} required />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>歸屬相簿（選填）</label>
              <select 
                value={selectedAlbumId} 
                onChange={e => setSelectedAlbumId(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '14px', appearance: 'auto' }}>
                <option value="" style={{ background: '#111827', color: '#fff' }}>未分類相簿</option>
                {albums.filter(a => a.id !== 'alb-all' && (!a.title || !a.title.includes('全家福相片總集'))).map(a => (
                  <option key={a.id} value={a.id} style={{ background: '#111827', color: '#fff' }}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>拍攝地點（選填）</label>
            <input type="text" placeholder="如：台北市" value={location} onChange={e => setLocation(e.target.value)} className="search-input" style={{ paddingLeft: '14px' }} />
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
                <span>正在進行秒級處理與全裝置同步...</span><span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gradient-main)', transition: 'width 0.12s ease' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUploading || isConvertingHeic}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={isUploading || isConvertingHeic || !previewUrls.length}>
              {isUploading ? '處理中...' : isConvertingHeic ? '轉換中...' : `⚡ 極速上傳`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
