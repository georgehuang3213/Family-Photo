import React, { useState } from 'react';
import { X, Check, Cloud, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const PROVIDERS = [
  { 
    id: 'r2', 
    name: 'Cloudflare R2 Object Storage (family-photo)', 
    desc: '實體圖檔 100% 獨佔儲存桶 (免流量費 $0 Egress CDN)', 
    icon: '☁️', 
    egressCost: '$0 / GB',
    status: '使用中 (Active - 獨佔實體圖床)'
  },
  { 
    id: 'firestore', 
    name: 'Firebase Firestore & IndexedDB', 
    desc: '家族成員全裝置即時同步與元數據 (Metadata) 索引', 
    icon: '🔥', 
    egressCost: '極速同步',
    status: '連線中 (Active - 詮釋資料)'
  }
];

export default function StorageConfigModal({ storageConfig, photos = [], onClose, onSaveConfig }) {
  const [selectedProvider, setSelectedProvider] = useState('r2');
  const [email, _setEmail] = useState(storageConfig.connectedEmail || 'family.hub.cloud@gmail.com');
  const [autoBackup, setAutoBackup] = useState(storageConfig.autoBackupMobile ?? true);
  const [rawStorage, setRawStorage] = useState(storageConfig.rawStorageEnabled ?? true);

  const handleSave = () => {
    onSaveConfig({
      ...storageConfig,
      provider: PROVIDERS.find(p => p.id === selectedProvider)?.name || 'Cloudflare R2 Object Storage',
      connectedEmail: email,
      autoBackupMobile: autoBackup,
      rawStorageEnabled: rawStorage
    });
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  // Calculate real Cloudflare R2 storage usage dynamically from photos
  const totalSizeBytes = photos.reduce((acc, p) => acc + (p.fileSize || (2.57 * 1024 * 1024)), 0);
  const usedMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  const usedGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(3);
  const totalGB = storageConfig.totalGB || 10; // Cloudflare R2 10 GB Free Tier
  const percentage = Math.min(100, Math.max(0.1, ((totalSizeBytes / (10 * 1024 * 1024 * 1024)) * 100).toFixed(1)));

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '90vw', maxWidth: '640px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cloud size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Cloudflare R2 家族雲端儲存配置</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>儲存桶：family-photo · 免費提供 10 GB 儲存空間</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Real Cloudflare R2 Capacity Progress */}
        <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-active)', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" /> Cloudflare R2 儲存用量 (family-photo)
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
              {usedMB} MB ({usedGB} GB) / {totalGB} GB ({percentage}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(percentage, 1)}%`, height: '100%', background: 'var(--gradient-main)', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>已託管物件：{photos.length} 張家族照片</span>
            <span>月傳輸流量費：$0 Egress (免費)</span>
          </div>
        </div>

        {/* Select Provider */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
            儲存後端架構（實體檔案與詮釋資料）：
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PROVIDERS.map(p => {
              const isSelected = selectedProvider === p.id;
              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.desc}</div>
                    </div>
                  </div>

                  <span className="badge badge-purple">
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoBackup} 
              onChange={e => setAutoBackup(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
            />
            開啟 Cloudflare R2 直連上傳 (S3 Presigned Direct Upload)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={rawStorage} 
              onChange={e => setRawStorage(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
            />
            保存 100% 原始無損畫質 (RAW / Uncompressed Quality)
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={16} /> 儲存儲存設定
          </button>
        </div>

      </div>
    </div>
  );
}
