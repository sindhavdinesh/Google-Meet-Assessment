import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Pin, PinOff } from 'lucide-react';
import { createAudioLevelDetector } from '../utils/audioActivity';

export default function VideoTile({
  participant,
  stream,
  isLocal = false,
  isPinned = false,
  onTogglePin
}) {
  const videoRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioDetectorRef = useRef(null);

  // Attach stream to video tag
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Monitor speaking levels if audio is on
  useEffect(() => {
    if (stream && participant.isAudioOn) {
      audioDetectorRef.current = createAudioLevelDetector(stream, (level, speaking) => {
        setIsSpeaking(speaking);
      });
    } else {
      setIsSpeaking(false);
    }

    return () => {
      if (audioDetectorRef.current) {
        audioDetectorRef.current.stop();
      }
    };
  }, [stream, participant.isAudioOn]);

  const displayName = participant?.name || (isLocal ? 'You' : 'Participant');
  const initial = (displayName[0] || 'U').toUpperCase();
  const hasVideoTrack = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');
  const showVideo = participant.isVideoOn && hasVideoTrack;

  return (
    <div className={`video-tile ${isSpeaking ? 'speaking' : ''}`}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Avoid audio feedback for local microphone
          className={isLocal && !participant.isScreenSharing ? 'mirrored' : ''}
        />
      ) : (
        <div className="video-tile-avatar-view">
          <div className="participant-avatar-circle">
            {initial}
          </div>
        </div>
      )}

      {/* Top right badges: Hand Raised, Pin */}
      <div className="tile-top-actions">
        {participant.isHandRaised && (
          <div className="hand-raised-banner" title={`${displayName} raised their hand`}>
            <span>✋</span>
            <span>Hand raised</span>
          </div>
        )}

        <button
          className="tile-icon-pill"
          onClick={() => onTogglePin(participant.id)}
          title={isPinned ? 'Unpin' : 'Pin to screen'}
        >
          {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
        </button>
      </div>

      {/* Bottom left name tag with live mic icon */}
      <div className="tile-bottom-bar">
        {participant.isAudioOn ? (
          <Mic size={14} color="#ffffff" />
        ) : (
          <MicOff size={14} color="#ea4335" />
        )}
        <span>{displayName} {isLocal ? '(You)' : ''}</span>
        {participant.isHost && <span className="tile-host-tag">Host</span>}
        {participant.isScreenSharing && <span className="tile-host-tag" style={{ background: '#34a853' }}>Presenting</span>}
      </div>
    </div>
  );
}
