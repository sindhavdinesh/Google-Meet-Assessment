import React, { useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, MoreVertical, UserX, VolumeX, Search, Shield } from 'lucide-react';

export default function ParticipantsDrawer({
  participants = [],
  currentUserId,
  isCurrentUserHost,
  onMuteParticipant,
  onMuteAll,
  onRemoveParticipant,
  onClose
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const filtered = participants.filter((p) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="side-drawer">
      <div className="drawer-header">
        <h3>People ({participants.length})</h3>
        <button className="icon-btn-round" onClick={onClose} title="Close">
          <X size={20} />
        </button>
      </div>

      {/* Host Controls Action Card */}
      {isCurrentUserHost && participants.length > 1 && (
        <div style={{ padding: '12px 20px 4px 20px' }}>
          <div className="people-host-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a73e8', fontWeight: 500 }}>
              <Shield size={16} />
              <span>Host management</span>
            </div>
            <button
              onClick={onMuteAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fce8e6',
                color: '#d93025',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <VolumeX size={14} />
              <span>Mute all</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div style={{ padding: '8px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f3f4', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
          <Search size={16} color="#5f6368" />
          <input
            type="text"
            placeholder="Search for people"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
          />
        </div>
      </div>

      <div className="drawer-body">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((p) => {
            const isMe = p.id === currentUserId;
            const initial = (p.name?.[0] || 'U').toUpperCase();

            return (
              <div key={p.id} className="participant-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="participant-avatar-mini">{initial}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#202124', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{p.name}</span>
                      {isMe && <span style={{ color: '#5f6368', fontSize: '12px' }}>(You)</span>}
                      {p.isHost && <span className="tile-host-tag">Host</span>}
                    </div>
                    {p.isHandRaised && (
                      <span style={{ fontSize: '12px', color: '#b06000' }}>✋ Hand raised</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span title={p.isAudioOn ? 'Microphone on' : 'Microphone muted'} style={{ color: p.isAudioOn ? '#5f6368' : '#ea4335' }}>
                    {p.isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
                  </span>

                  <span title={p.isVideoOn ? 'Camera on' : 'Camera off'} style={{ color: p.isVideoOn ? '#5f6368' : '#ea4335', marginLeft: '6px' }}>
                    {p.isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                  </span>

                  {/* Host Action Menu */}
                  {isCurrentUserHost && !isMe && (
                    <div style={{ position: 'relative' }}>
                      <button
                        className="icon-btn-round"
                        onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                        title="Participant options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === p.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: '#ffffff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            zIndex: 10,
                            width: '180px',
                            border: '1px solid #dadce0',
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              onMuteParticipant(p.id);
                              setActiveMenuId(null);
                            }}
                          >
                            <VolumeX size={16} />
                            <span>Mute participant</span>
                          </button>
                          <button
                            className="dropdown-item"
                            style={{ color: '#ea4335' }}
                            onClick={() => {
                              if (window.confirm(`Remove ${p.name} from the call?`)) {
                                onRemoveParticipant(p.id);
                              }
                              setActiveMenuId(null);
                            }}
                          >
                            <UserX size={16} />
                            <span>Remove from call</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
