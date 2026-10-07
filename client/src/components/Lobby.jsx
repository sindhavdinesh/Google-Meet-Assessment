import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, Volume2, Sparkles } from 'lucide-react';
import { createAudioLevelDetector } from '../utils/audioActivity';

export default function Lobby({ roomId, onJoinCall, defaultName = '' }) {
  const [userName, setUserName] = useState(defaultName || localStorage.getItem('meet_username') || '');
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioDetectorRef = useRef(null);

  // Initialize camera and mic
  useEffect(() => {
    let streamInstance = null;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamInstance = stream;
        localStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize audio activity detector
        audioDetectorRef.current = createAudioLevelDetector(stream, (level) => {
          setAudioLevel(Math.min(100, Math.round(level * 2)));
        });
      } catch (err) {
        console.warn('Camera/Mic permission error or not found:', err);
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamInstance = audioOnlyStream;
          localStreamRef.current = audioOnlyStream;
          setIsVideoOn(false);
        } catch (e) {
          console.error('No media devices accessible:', e);
        }
      }
    }

    initMedia();

    return () => {
      if (audioDetectorRef.current) {
        audioDetectorRef.current.stop();
      }
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Toggle Mic
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    } else {
      setIsAudioOn(!isAudioOn);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    } else {
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const finalName = userName.trim() || 'Guest ' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('meet_username', finalName);

    // Stop lobby stream so MeetingRoom can acquire its own cleanly
    if (audioDetectorRef.current) {
      audioDetectorRef.current.stop();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    onJoinCall({
      name: finalName,
      isAudioOn,
      isVideoOn
    });
  };

  const userInitial = (userName.trim()[0] || 'G').toUpperCase();

  return (
    <div className="lobby-container">
      {/* Video Preview Column */}
      <div className="lobby-preview-box">
        {isVideoOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="lobby-preview-video"
          />
        ) : (
          <div className="lobby-camera-off-view">
            <div className="lobby-avatar-bubble">{userInitial}</div>
            <p style={{ color: '#e8eaed', fontSize: '15px' }}>Camera is off</p>
          </div>
        )}

        {/* Audio Visualizer Pill */}
        {isAudioOn && audioLevel > 5 && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            padding: '6px 14px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#34a853',
            fontSize: '12px'
          }}>
            <Volume2 size={16} />
            <div style={{
              width: '42px',
              height: '4px',
              background: '#5f6368',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${audioLevel}%`,
                height: '100%',
                background: '#34a853',
                transition: 'width 0.1s ease'
              }} />
            </div>
          </div>
        )}

        {/* Floating Mic/Cam Controls */}
        <div className="lobby-floating-bar">
          <button
            className={`lobby-ctrl-btn ${!isAudioOn ? 'off' : ''}`}
            onClick={toggleAudio}
            title={isAudioOn ? 'Turn microphone off' : 'Turn microphone on'}
          >
            {isAudioOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>

          <button
            className={`lobby-ctrl-btn ${!isVideoOn ? 'off' : ''}`}
            onClick={toggleVideo}
            title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>

          <button
            className="lobby-ctrl-btn"
            title="Visual effects"
            style={{ color: '#ffffff' }}
          >
            <Sparkles size={20} />
          </button>
        </div>
      </div>

      {/* Info & Join Column */}
      <div className="lobby-details-panel">
        <div>
          <h2>Ready to join?</h2>
          <div style={{ marginTop: '8px' }}>
            <span className="lobby-code-badge">
              Meeting code: <strong style={{ color: '#202124' }}>{roomId}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#5f6368', marginBottom: '8px' }}>
              What's your name?
            </label>
            <input
              type="text"
              className="lobby-input-field"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn-join-pill" style={{ flex: 1 }}>
              Join now
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5f6368', fontSize: '13px', marginTop: '4px' }}>
          <Settings size={16} />
          <span>Check your audio and video before entering</span>
        </div>
      </div>
    </div>
  );
}
