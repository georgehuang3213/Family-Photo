import React, { useState } from 'react';
import { X, HardDrive, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const PROVIDERS = [
  { 
    id: 'google', 
    name: 'Google AI Pro (Google One 2TB)', 
    desc: '已包含免費 2TB 空間與家族共享權益', 
    icon: '✨', 
    egressCost: '免費',
    status: '連線中 (Active)'
  },
  { 
    id: 'r2', 
    name: 'Cloudflare R2 Object Storage', 
    desc: '$0.015/GB，完全免傳輸流量費 ($0 Egress)', 
    icon: '☁️', 
    egressCost: '$0 / GB',
    status: '備用 (Standby)'
  },
  { 
    id: 'b2', 
    name: 'Backblaze B2 Storage', 
    desc: '$0.006/GB 極低單價，搭配 Cloudflare 免費傳輸', 
    icon: '🔥', 
    egressCost: '低廉',
    status: '可連結'
  },
  { 
    id: 'supabase', 
    name: 'Supabase Storage & DB', 
    desc: '包含完整家族資料庫與帳號登入系統', 
    icon: '⚡', 
    egressCost: '標準',
    status: '可連結'
  }
];

export default function StorageConfigModal({ storageConfig, onClose, onSaveConfig }) {
  const [selectedProvider, setSelectedProvider] = useState('google');
  const [email, _setEmail] = useState(storageConfig.connectedEmail);
  const [autoBackup, setAutoBackup] = useState(storageConfig.autoBackupMobile);
  const [rawStorage, setRawStorage] = useState(storageConfig.rawStorageEnabled);

  const handleSave = () => {
    onSaveConfig({
      ...storageConfig,
      provider: PROVIDERS.find(p => p.id === selectedProvider)?.name || storageConfig.provider,
      connectedEmail: email,
      autoBackupMobile: autoBackup,
      rawStorageEnabled: rawStorage
    });
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const percentage = Math.round((storageConfig.usedGB / storageConfig.totalGB) * 100);

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '90vw', maxWidth: '640px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>家族雲端儲存空間配置</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>管理您的 5TB / 2TB 空間與同步後端</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Current Capacity Progress */}
        <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-active)', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--accent-amber)" /> Google AI Pro 家族空間狀態
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
              {storageConfig.usedGB} GB / {storageConfig.totalGB} GB ({percentage}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--gradient-main)', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>剩餘可用：{(storageConfig.totalGB - storageConfig.usedGB).toFixed(1)} GB</span>
            <span>共享家族成員：{storageConfig.familyMembersSharedCount} 位</span>
          </div>
        </div>

        {/* Select Provider */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
            儲存後端適配器選擇：
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
                    justify: 'space-between',
                    transition: 'all 0.2s ease'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.desc}</div>
                    </div>
                  </div>

                  <span className={`badge ${isSelected ? 'badge-purple' : 'badge-emerald'}`}>
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
            開啟手機相片自動背景備份 (Google One Auto-Sync)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={rawStorage} 
              onChange={e => setRawStorage(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
            />
            保存原始無損畫質 (RAW / Original Uncompressed)
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
