import React, { useState } from 'react';
import { X, Copy, Check, Info } from 'lucide-react';

export default function MeetingInfoDrawer({ roomId, onClose }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${window.location.origin}?room=${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="side-drawer">
      <div className="drawer-header">
        <h3>Meeting details</h3>
        <button className="icon-btn-round" onClick={onClose} title="Close">
          <X size={20} />
        </button>
      </div>

      <div className="drawer-body">
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 500, color: '#202124', marginBottom: '8px' }}>
            Joining info
          </h4>
          <p style={{ fontSize: '13px', color: '#5f6368', marginBottom: '16px' }}>
            Share this link with people you want to join this call:
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f1f3f4',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '13px', color: '#3c4043', wordBreak: 'break-all' }}>
              {fullUrl}
            </span>
          </div>

          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: copied ? '#1e8e3e' : '#1a73e8',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? 'Link copied to clipboard' : 'Copy joining info'}</span>
          </button>
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid #dadce0', paddingTop: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', color: '#5f6368', fontSize: '13px' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              Meeting ID: <strong>{roomId}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
