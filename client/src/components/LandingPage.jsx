import React, { useState } from 'react';
import { Video, Keyboard, Link as LinkIcon, Plus, Calendar, Copy, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Rich SVG Illustrations matching real Google Meet product marketing artwork
const CAROUSEL_SLIDES = [
  {
    title: "Get a link you can share",
    desc: "Click New meeting to get a link you can send to people you want to meet with",
    illustration: (
      <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
        <rect x="25" y="30" width="210" height="135" rx="16" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="2" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.06))"/>
        {/* Meeting window top bar */}
        <rect x="25" y="30" width="210" height="24" rx="12" fill="#F1F3F4"/>
        <circle cx="42" cy="42" r="4" fill="#EA4335"/>
        <circle cx="54" cy="42" r="4" fill="#FBBC04"/>
        <circle cx="66" cy="42" r="4" fill="#34A853"/>
        {/* Link card */}
        <rect x="45" y="72" width="170" height="42" rx="8" fill="#E8F0FE"/>
        <circle cx="66" cy="93" r="12" fill="#1A73E8"/>
        <path d="M63 93h6m-3-3v6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <rect x="86" y="85" width="80" height="7" rx="3.5" fill="#1A73E8"/>
        <rect x="86" y="96" width="55" height="5" rx="2.5" fill="#8AB4F8"/>
        {/* Share avatars floating */}
        <circle cx="60" cy="140" r="14" fill="#EA4335" stroke="#fff" strokeWidth="2"/>
        <circle cx="85" cy="140" r="14" fill="#34A853" stroke="#fff" strokeWidth="2"/>
        <circle cx="110" cy="140" r="14" fill="#FBBC04" stroke="#fff" strokeWidth="2"/>
        <circle cx="135" cy="140" r="14" fill="#1A73E8" stroke="#fff" strokeWidth="2"/>
      </svg>
    )
  },
  {
    title: "Plan ahead and stay organized",
    desc: "Schedule meetings in Google Calendar and send invites to participants with ease",
    illustration: (
      <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
        <rect x="40" y="25" width="180" height="145" rx="14" fill="#FFFFFF" stroke="#E8EAED" strokeWidth="2" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.06))"/>
        {/* Calendar top */}
        <path d="M40 39c0-7.732 6.268-14 14-14h152c7.732 0 14 6.268 14 14v16H40V39z" fill="#1A73E8"/>
        <rect x="75" y="16" width="8" height="18" rx="4" fill="#174EA6"/>
        <rect x="177" y="16" width="8" height="18" rx="4" fill="#174EA6"/>
        <text x="130" y="46" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="Google Sans">OCTOBER</text>
        {/* Calendar event blocks */}
        <rect x="58" y="70" width="144" height="24" rx="6" fill="#CEEAD6"/>
        <circle cx="70" cy="82" r="5" fill="#34A853"/>
        <rect x="84" y="79" width="70" height="6" rx="3" fill="#137333"/>
        <rect x="58" y="104" width="144" height="24" rx="6" fill="#FCE8E6"/>
        <circle cx="70" cy="116" r="5" fill="#EA4335"/>
        <rect x="84" y="113" width="85" height="6" rx="3" fill="#C5221F"/>
        <rect x="58" y="138" width="100" height="18" rx="6" fill="#FEF7E0"/>
      </svg>
    )
  },
  {
    title: "Your meeting is safe and secure",
    desc: "Protected by enterprise-grade WebRTC encryption and host admission control",
    illustration: (
      <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
        <circle cx="130" cy="100" r="75" fill="#F8FAFD"/>
        {/* Shield */}
        <path d="M130 38l45 18v38c0 36-45 62-45 62s-45-26-45-62V56l45-18z" fill="#E8F0FE" stroke="#1A73E8" strokeWidth="3"/>
        {/* Lock inside shield */}
        <rect x="114" y="96" width="32" height="26" rx="6" fill="#1A73E8"/>
        <path d="M120 96v-8a10 10 0 0120 0v8" stroke="#1A73E8" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <circle cx="130" cy="107" r="3" fill="#FFFFFF"/>
        <path d="M130 110v5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Small check sparkles */}
        <circle cx="185" cy="65" r="8" fill="#34A853"/>
        <path d="M181 65l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="75" cy="120" r="6" fill="#FBBC04"/>
      </svg>
    )
  },
  {
    title: "See everyone together",
    desc: "Adaptive video grid with real-time audio detection, screen sharing, and interactive whiteboard",
    illustration: (
      <svg width="260" height="200" viewBox="0 0 260 200" fill="none">
        <rect x="30" y="30" width="200" height="135" rx="12" fill="#202124" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.15))"/>
        {/* 4 Video Tiles Grid */}
        <rect x="40" y="40" width="85" height="55" rx="6" fill="#3C4043"/>
        <circle cx="82" cy="67" r="14" fill="#1A73E8"/>
        <rect x="135" y="40" width="85" height="55" rx="6" fill="#3C4043"/>
        <circle cx="177" cy="67" r="14" fill="#EA4335"/>
        <rect x="40" y="102" width="85" height="55" rx="6" fill="#3C4043"/>
        <circle cx="82" cy="129" r="14" fill="#34A853"/>
        <rect x="135" y="102" width="85" height="55" rx="6" fill="#3C4043" stroke="#8AB4F8" strokeWidth="2"/>
        <circle cx="177" cy="129" r="14" fill="#FBBC04"/>
        {/* Speaking indicator wave */}
        <circle cx="177" cy="129" r="20" stroke="#8AB4F8" strokeWidth="1.5" strokeDasharray="3 3"/>
      </svg>
    )
  }
];

export default function LandingPage({ onStartMeeting, onJoinMeeting }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [laterModal, setLaterModal] = useState({ isOpen: false, link: '' });
  const [copied, setCopied] = useState(false);

  const generateMeetingId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randPart = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${randPart(3)}-${randPart(4)}-${randPart(3)}`;
  };

  const handleCreateLater = () => {
    const code = generateMeetingId();
    const fullLink = `${window.location.origin}?room=${code}`;
    setLaterModal({ isOpen: true, link: fullLink });
    setShowDropdown(false);
  };

  const handleInstantMeeting = () => {
    const code = generateMeetingId();
    setShowDropdown(false);
    onStartMeeting(code);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    let cleanCode = meetingCode.trim();
    if (cleanCode.includes('room=')) {
      cleanCode = cleanCode.split('room=')[1].split('&')[0];
    } else if (cleanCode.includes('/')) {
      cleanCode = cleanCode.split('/').pop();
    }
    onJoinMeeting(cleanCode);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(laterModal.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  return (
    <div className="landing-container">
      <main className="landing-main">
        {/* Left Hero Column */}
        <section className="landing-hero">
          <h1>Video calls and meetings for everyone</h1>
          <p>
            Connect, collaborate, and celebrate from anywhere with Google Meet. 
            Enjoy free enterprise-grade video conferencing with screen sharing and host controls.
          </p>

          <div className="landing-actions">
            {/* New Meeting Button */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-new-meeting"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <Video size={18} />
                <span>New meeting</span>
              </button>

              {showDropdown && (
                <div className="meeting-dropdown-menu">
                  <button className="dropdown-item" onClick={handleCreateLater}>
                    <LinkIcon size={18} color="#5f6368" />
                    <span>Create a meeting for later</span>
                  </button>
                  <button className="dropdown-item" onClick={handleInstantMeeting}>
                    <Plus size={18} color="#5f6368" />
                    <span>Start an instant meeting</span>
                  </button>
                  <button 
                    className="dropdown-item" 
                    onClick={() => {
                      window.open('https://calendar.google.com', '_blank');
                      setShowDropdown(false);
                    }}
                  >
                    <Calendar size={18} color="#5f6368" />
                    <span>Schedule in Google Calendar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Enter Code / Link Input */}
            <form onSubmit={handleJoinSubmit} className="meeting-input-group">
              <div className="meeting-input-wrapper">
                <Keyboard size={18} className="input-icon" />
                <input
                  type="text"
                  className="meeting-code-input"
                  placeholder="Enter a code or link"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-join"
                disabled={!meetingCode.trim()}
              >
                Join
              </button>
            </form>
          </div>

          <div className="landing-divider" />

          <div>
            <a href="https://support.google.com/meet" target="_blank" rel="noreferrer" className="learn-more-link">
              Learn more about Google Meet
            </a>
          </div>
        </section>

        {/* Right Feature Carousel Column */}
        <section className="carousel-card">
          <div className="carousel-img-circle">
            {CAROUSEL_SLIDES[currentSlide].illustration}
          </div>

          <h2 className="carousel-title">{CAROUSEL_SLIDES[currentSlide].title}</h2>
          <p className="carousel-desc">{CAROUSEL_SLIDES[currentSlide].desc}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="icon-btn-round" onClick={prevSlide} title="Previous slide">
              <ChevronLeft size={20} />
            </button>

            <div className="carousel-nav-dots">
              {CAROUSEL_SLIDES.map((_, index) => (
                <span
                  key={index}
                  className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>

            <button className="icon-btn-round" onClick={nextSlide} title="Next slide">
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
      </main>

      {/* Modal for "Create meeting for later" */}
      {laterModal.isOpen && (
        <div className="modal-overlay" onClick={() => setLaterModal({ isOpen: false, link: '' })}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="modal-dialog-title">Here's the link to your meeting</h3>
              <button className="icon-btn-round" onClick={() => setLaterModal({ isOpen: false, link: '' })}>
                <X size={20} />
              </button>
            </div>
            <p className="modal-dialog-body">
              Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f1f3f4',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '22px'
            }}>
              <span style={{ fontSize: '14px', color: '#3c4043', wordBreak: 'break-all' }}>
                {laterModal.link}
              </span>
              <button 
                onClick={handleCopyLink} 
                className="icon-btn-round" 
                title={copied ? "Copied!" : "Copy link"}
                style={{ color: copied ? '#1e8e3e' : '#5f6368' }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div className="modal-actions-group">
              <button 
                className="btn-join-pill" 
                onClick={() => {
                  const code = laterModal.link.split('room=')[1];
                  setLaterModal({ isOpen: false, link: '' });
                  onStartMeeting(code);
                }}
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
