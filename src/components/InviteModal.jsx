import React, { useState } from 'react';
import { X, UserPlus, Trash2, Copy, Check, Mail, Crown } from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';

export default function InviteModal({ onClose }) {
  const { invitedEmails, addInvitedEmail, removeInvitedEmail } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    addInvitedEmail(newEmail.trim());
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    setNewEmail('');
  };

  const handleCopyLink = () => {
    const link = window.location.origin;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '90vw', maxWidth: '520px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>邀請家族成員加入相簿</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Crown size={12} color="var(--accent-amber)" /> 管理者：{ADMIN_EMAIL}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Copy Shareable Link */}
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-active)', padding: '14px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>複製家族網站專屬連結</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>傳送此連結給受邀的家族成員即可登入</div>
          </div>
          <button className="btn btn-secondary" onClick={handleCopyLink} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            {copied ? '已複製！' : '複製網址'}
          </button>
        </div>

        {/* Add Email Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input 
            type="email" 
            placeholder="輸入家族成員的 Gmail (例如: mom@gmail.com)"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '14px', flex: 1 }}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <UserPlus size={16} /> 新增授權
          </button>
        </form>

        {/* Invited Emails List */}
        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
            已獲授權加入的 Email 清單 ({invitedEmails.length})
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
            {invitedEmails.map(email => {
              const isOwner = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
              return (
                <div 
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isOwner ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    border: isOwner ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-subtle)'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                    <Mail size={15} color={isOwner ? 'var(--accent-amber)' : 'var(--text-muted)'} />
                    <span style={{ fontWeight: isOwner ? '700' : '400', color: isOwner ? 'var(--accent-amber)' : '#fff' }}>
                      {email}
                    </span>
                    {isOwner && <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>👑 管理者</span>}
                  </div>

                  {!isOwner && (
                    <button 
                      onClick={() => removeInvitedEmail(email)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', opacity: 0.8 }}
                      title="移除授權">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
