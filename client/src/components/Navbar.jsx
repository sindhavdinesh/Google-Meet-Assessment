import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, MessageSquareWarning, Settings, Grid, LogOut, UserCheck, Shield, Camera, Check } from 'lucide-react';

export default function Navbar({ onLogoClick, userInitial = 'G', currentUserName = 'Student', onUpdateName }) {
  const [timeStr, setTimeStr] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editName, setEditName] = useState(localStorage.getItem('meet_username') || 'Student');
  const [isEditing, setIsEditing] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      setTimeStr(`${time} • ${date}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveName = (e) => {
    e.preventDefault();
    const trimmed = editName.trim() || 'Student';
    localStorage.setItem('meet_username', trimmed);
    if (onUpdateName) onUpdateName(trimmed);
    setIsEditing(false);
  };

  const displayName = localStorage.getItem('meet_username') || currentUserName || 'Student';
  const initialLetter = (displayName[0] || 'S').toUpperCase();

  return (
    <header className="meet-navbar">
      {/* Left: Google Meet Logo */}
      <div className="meet-logo-group" onClick={onLogoClick} title="Google Meet">
        <svg className="meet-logo-svg" viewBox="0 0 48 48">
          <path fill="#00832d" d="M37 24v-9.5c0-1.93-1.57-3.5-3.5-3.5h-23C8.57 11 7 12.57 7 14.5v19c0 1.93 1.57 3.5 3.5 3.5h23c1.93 0 3.5-1.57 3.5-3.5V24z"/>
          <path fill="#0066da" d="M37 20l9-6.5v21L37 28z"/>
          <path fill="#e53935" d="M25 11h8.5c1.93 0 3.5 1.57 3.5 3.5V24h-12z"/>
          <path fill="#ffb300" d="M7 28h12v9H10.5C8.57 37 7 35.43 7 33.5z"/>
          <path fill="#00aa47" d="M7 14.5C7 12.57 8.57 11 10.5 11H19v13H7z"/>
        </svg>
        <div className="meet-logo-text">
          Google <strong>Meet</strong>
        </div>
      </div>

      {/* Right Controls & Profile */}
      <div className="meet-navbar-right" ref={menuRef}>
        <div className="meet-clock-text">{timeStr}</div>

        <button className="icon-btn-round" title="Support">
          <HelpCircle size={20} />
        </button>

        <button className="icon-btn-round" title="Feedback">
          <MessageSquareWarning size={20} />
        </button>

        <button 
          className="icon-btn-round" 
          title="Settings"
          onClick={() => setShowSettingsModal(true)}
        >
          <Settings size={20} />
        </button>

        <button className="icon-btn-round" title="Google apps">
          <Grid size={20} />
        </button>

        {/* Profile Avatar Button with Google Profile styling */}
        <div style={{ position: 'relative', marginLeft: '6px' }}>
          <button
            className="google-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title={`Google Account: ${displayName}`}
            aria-label="Google Account"
          >
            <div className="google-avatar-inner">
              {initialLetter}
            </div>
          </button>

          {/* Authentic Google Account Dropdown Card */}
          {showProfileMenu && (
            <div className="google-account-popup">
              <div className="account-popup-header">
                <span className="account-email-text">
                  {displayName.toLowerCase().replace(/\s+/g, '')}@gmail.com
                </span>
              </div>

              <div className="account-popup-profile-section">
                <div className="account-large-avatar">
                  {initialLetter}
                  <div className="avatar-camera-badge" title="Change photo">
                    <Camera size={13} color="#ffffff" />
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="edit-name-input"
                      autoFocus
                    />
                    <button type="submit" className="save-name-btn" title="Save name">
                      <Check size={16} />
                    </button>
                  </form>
                ) : (
                  <div 
                    className="account-user-name"
                    onClick={() => setIsEditing(true)}
                    title="Click to edit name"
                  >
                    <span>Hi, {displayName}!</span>
                    <span className="edit-hint-chip">Edit</span>
                  </div>
                )}
              </div>

              <div className="account-manage-btn-wrapper">
                <button 
                  className="btn-manage-google"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <UserCheck size={16} />
                  <span>Manage your Google Account</span>
                </button>
              </div>

              <div className="account-popup-divider" />

              <div className="account-popup-footer">
                <button 
                  className="account-signout-row"
                  onClick={() => {
                    localStorage.removeItem('meet_username');
                    window.location.reload();
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign out of all accounts</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-dialog-title">Settings</h3>
            <p className="modal-dialog-body">
              Audio and video devices are configured automatically using your browser's default media permissions.
            </p>
            <div style={{ marginBottom: '18px', background: '#f8fafd', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e8f0fe' }}>
              <div style={{ fontSize: '13px', color: '#5f6368', marginBottom: '6px' }}>Current User Profile:</div>
              <div style={{ fontWeight: 500, color: '#202124' }}>{displayName}</div>
            </div>
            <div className="modal-actions-group">
              <button className="btn-join-pill" onClick={() => setShowSettingsModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
