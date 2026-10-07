import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Smile, PhoneOff,
  MessageSquare, Users, Info, Edit3, Shield, Disc, Square, Subtitles, MoreVertical
} from 'lucide-react';
import { createPeerConnection, addStreamTracks, replaceVideoTrack } from '../utils/webrtc';
import { soundController } from '../utils/sounds';
import { createSpeechRecognizer } from '../utils/speechRecognition';
import VideoTile from './VideoTile';
import ChatDrawer from './ChatDrawer';
import ParticipantsDrawer from './ParticipantsDrawer';
import MeetingInfoDrawer from './MeetingInfoDrawer';
import WhiteboardModal from './WhiteboardModal';

const REACTION_EMOJIS = ['👍', '👏', '❤️', '🎉', '😂', '😮'];

export default function MeetingRoom({
  roomId,
  initialUserConfig,
  socket,
  onLeaveMeeting
}) {
  // Local media state
  const [localStream, setLocalStream] = useState(null);
  const [isAudioOn, setIsAudioOn] = useState(initialUserConfig.isAudioOn ?? true);
  const [isVideoOn, setIsVideoOn] = useState(initialUserConfig.isVideoOn ?? true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Closed Captions [CC]
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [liveCaptionText, setLiveCaptionText] = useState('');
  const speechRecognizerRef = useRef(null);

  // Room state
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);

  // Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState(null); // 'chat' | 'people' | 'info' | null
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  // Host Admission state (Day 9.6)
  const [knockApplicant, setKnockApplicant] = useState(null);

  // Recording state (Day 9.4)
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Toast alert
  const [toastMessage, setToastMessage] = useState(null);

  // WebRTC Peer connections map: { [socketId]: RTCPeerConnection }
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Meeting Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize local media and join room
  useEffect(() => {
    let activeStream = null;

    async function setupLocalMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        // Apply initial config
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = initialUserConfig.isAudioOn;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = initialUserConfig.isVideoOn;

        activeStream = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Emit request to join or direct-join
        socket.emit('request-join', {
          roomId,
          userName: initialUserConfig.name,
          isAudioOn: initialUserConfig.isAudioOn,
          isVideoOn: initialUserConfig.isVideoOn
        });
      } catch (err) {
        console.error('Error getting user media:', err);
        showToast('Camera/Mic permission needed');
      }
    }

    setupLocalMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [roomId, socket]);

  // 2. Socket Event Listeners (Signaling & Moderation)
  useEffect(() => {
    if (!socket) return;

    // Join approved
    socket.on('join-approved', ({ isHost: hostStatus, participants: roomParticipants, chatMessages: history }) => {
      setIsHost(hostStatus);
      setParticipants(roomParticipants);
      if (history) setChatMessages(history);

      soundController.playJoinSound();

      // Create offers to all existing peers in the room
      const myId = socket.id;
      roomParticipants.forEach((p) => {
        if (p.id !== myId && !peerConnectionsRef.current.has(p.id)) {
          initiateCall(p.id);
        }
      });
    });

    // New user joined
    socket.on('user-joined', ({ user }) => {
      soundController.playJoinSound();
      showToast(`${user.name} joined`);
      setParticipants((prev) => {
        if (prev.some((p) => p.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    // User left
    socket.on('user-left', ({ userId, userName }) => {
      soundController.playLeaveSound();
      showToast(`${userName} left`);
      setParticipants((prev) => prev.filter((p) => p.id !== userId));

      if (peerConnectionsRef.current.has(userId)) {
        peerConnectionsRef.current.get(userId).close();
        peerConnectionsRef.current.delete(userId);
      }

      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });

      if (pinnedParticipantId === userId) {
        setPinnedParticipantId(null);
      }
    });

    // Participant update (mute/unmute, cam on/off, screen share)
    socket.on('user-updated', ({ user }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === user.id ? { ...p, ...user } : p))
      );
    });

    // Hand raise notification (Day 9.5)
    socket.on('hand-raise-updated', ({ userName, isHandRaised: raised }) => {
      if (raised) {
        soundController.playHandRaiseSound();
        showToast(`✋ ${userName} raised their hand`);
      }
    });

    // Host knock notification (Day 9.6)
    socket.on('participant-knocked', ({ applicant }) => {
      soundController.playHandRaiseSound();
      setKnockApplicant(applicant);
    });

    // Force Muted by Host (Day 9.6)
    socket.on('force-mute', () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
        }
      }
      setIsAudioOn(false);
      socket.emit('toggle-audio', { isAudioOn: false });
      showToast('You were muted by the host');
    });

    // Force Removed by Host (Day 9.6)
    socket.on('force-removed', ({ reason }) => {
      alert(`You have been removed from the meeting: ${reason}`);
      onLeaveMeeting();
    });

    // Promoted to host
    socket.on('promoted-to-host', () => {
      setIsHost(true);
      showToast('You are now the host of this meeting');
    });

    // WebRTC Signaling: Receive Offer
    socket.on('signal-offer', async ({ callerId, offer }) => {
      let pc = peerConnectionsRef.current.get(callerId);
      if (!pc) {
        pc = createNewPeerConnection(callerId);
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('signal-answer', {
          targetId: callerId,
          answer
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    // WebRTC Signaling: Receive Answer
    socket.on('signal-answer', async ({ responderId, answer }) => {
      const pc = peerConnectionsRef.current.get(responderId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('[WebRTC] Error setting remote description for answer:', err);
        }
      }
    });

    // WebRTC Signaling: Receive ICE Candidate
    socket.on('signal-ice-candidate', async ({ senderId, candidate }) => {
      const pc = peerConnectionsRef.current.get(senderId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding received ICE candidate:', err);
        }
      }
    });

    // In-call Chat Message & File (Day 8.9 & 9.3)
    socket.on('receive-message', (message) => {
      soundController.playMessageSound();
      setChatMessages((prev) => [...prev, message]);
      if (activeDrawer !== 'chat') {
        setUnreadChatCount((prev) => prev + 1);
      }
    });

    // Emoji Reaction
    socket.on('receive-reaction', ({ emoji, id }) => {
      const leftPos = Math.floor(20 + Math.random() * 60);
      setFloatingReactions((prev) => [...prev, { id, emoji, left: `${leftPos}%` }]);

      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    return () => {
      socket.off('join-approved');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-updated');
      socket.off('hand-raise-updated');
      socket.off('participant-knocked');
      socket.off('force-mute');
      socket.off('force-removed');
      socket.off('promoted-to-host');
      socket.off('signal-offer');
      socket.off('signal-answer');
      socket.off('signal-ice-candidate');
      socket.off('receive-message');
      socket.off('receive-reaction');
    };
  }, [socket, activeDrawer, pinnedParticipantId]);

  // WebRTC Helper: Create connection & register remote track handler
  const createNewPeerConnection = (peerId) => {
    const pc = createPeerConnection(
      peerId,
      socket,
      (remotePeerId, stream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(remotePeerId, stream);
          return next;
        });
      }
    );

    const currentStream = screenStreamRef.current || localStreamRef.current;
    if (currentStream) {
      addStreamTracks(pc, currentStream);
    }

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  };

  // WebRTC Helper: Initiate call
  const initiateCall = async (peerId) => {
    const pc = createNewPeerConnection(peerId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('signal-offer', {
        targetId: peerId,
        offer
      });
    } catch (err) {
      console.error('[WebRTC] Failed to create offer for peer:', err);
    }
  };

  // Toggle Microphone
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
        socket.emit('toggle-audio', { isAudioOn: audioTrack.enabled });
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        socket.emit('toggle-video', { isVideoOn: videoTrack.enabled });
      }
    }
  };

  // Toggle Screen Share (Day 8.8)
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenStreamRef.current = screenStream;
        const screenVideoTrack = screenStream.getVideoTracks()[0];

        peerConnectionsRef.current.forEach((pc) => {
          replaceVideoTrack(pc, screenVideoTrack);
        });

        setIsScreenSharing(true);
        socket.emit('toggle-screen-share', { isScreenSharing: true });

        screenVideoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.warn('Screen sharing cancelled:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((pc) => {
        replaceVideoTrack(pc, camVideoTrack);
      });
    }

    setIsScreenSharing(false);
    socket.emit('toggle-screen-share', { isScreenSharing: false });
  };

  // Live Captions [CC]
  const toggleCaptions = () => {
    if (!isCaptionsOn) {
      const recognizer = createSpeechRecognizer((text) => {
        setLiveCaptionText(text);
      });
      if (recognizer) {
        recognizer.start();
        speechRecognizerRef.current = recognizer;
        setIsCaptionsOn(true);
        showToast('Live captions turned on');
      } else {
        showToast('Live captions not supported in this browser');
      }
    } else {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
        speechRecognizerRef.current = null;
      }
      setIsCaptionsOn(false);
      setLiveCaptionText('');
      showToast('Live captions turned off');
    }
  };

  // Hand Raise (Day 9.5)
  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socket.emit('toggle-hand-raise', { isHandRaised: nextState });
  };

  // Send Reaction
  const sendEmojiReaction = (emoji) => {
    socket.emit('send-reaction', { emoji });
    setShowReactions(false);
  };

  // Meeting Recording (Day 9.4)
  const toggleMeetingRecording = async () => {
    if (!isRecording) {
      try {
        const recordStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(recordStream, { mimeType: 'video/webm' });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Google-Meet-Recording-${roomId}-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('Recording downloaded successfully');
          recordStream.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        showToast('Recording started');
      } catch (err) {
        console.warn('Recording cancelled:', err);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  // Host Admission actions (Day 9.6)
  const handleAdmit = () => {
    if (!knockApplicant) return;
    socket.emit('admit-applicant', { applicantId: knockApplicant.id });
    setKnockApplicant(null);
  };

  const handleDeny = () => {
    if (!knockApplicant) return;
    socket.emit('deny-applicant', { applicantId: knockApplicant.id });
    setKnockApplicant(null);
  };

  // Host Moderation actions (Day 9.6)
  const handleHostMuteParticipant = (targetId) => {
    socket.emit('host-mute-participant', { targetId });
    showToast('Participant muted');
  };

  const handleHostMuteAll = () => {
    socket.emit('host-mute-all');
    showToast('All participants muted');
  };

  const handleHostRemoveParticipant = (targetId) => {
    socket.emit('host-remove-participant', { targetId });
    showToast('Participant removed from call');
  };

  const localUser = {
    id: socket.id,
    name: initialUserConfig.name,
    isAudioOn,
    isVideoOn,
    isHandRaised,
    isScreenSharing,
    isHost
  };

  const remoteParticipants = participants.filter((p) => p.id !== socket.id);
  const allParticipants = [localUser, ...remoteParticipants];

  // Dynamic Grid Class calculation
  const totalCount = allParticipants.length;
  let gridClass = 'grid-1';
  if (totalCount === 2) gridClass = 'grid-2';
  else if (totalCount === 3) gridClass = 'grid-3';
  else if (totalCount === 4) gridClass = 'grid-4';
  else if (totalCount > 4) gridClass = 'grid-more';

  // Spotlight participant check
  const activeSpotlightId =
    pinnedParticipantId ||
    allParticipants.find((p) => p.isScreenSharing)?.id ||
    null;

  return (
    <div className="meeting-room-container">
      {/* Top Header Bar */}
      <div className="in-call-top-bar">
        <div className="in-call-left-info">
          <span>{roomId}</span>
          <span style={{ color: '#9aa0a6' }}>•</span>
          <span style={{ color: '#9aa0a6' }}>{formatTimer(elapsedSeconds)}</span>

          {isRecording && (
            <div className="rec-badge-pill">
              <span className="rec-pulse-dot" />
              <span>REC</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-tray-ctrl"
            onClick={() => setShowWhiteboard(true)}
            title="Whiteboard"
          >
            <Edit3 size={18} />
          </button>
        </div>
      </div>

      {/* Main Video Grid and Side Drawer */}
      <div className="meeting-content-area">
        {/* Spotlight mode vs Regular Grid */}
        {activeSpotlightId ? (
          <div className="spotlight-container">
            <div className="spotlight-main-stage">
              {(() => {
                const spotlightUser = allParticipants.find((p) => p.id === activeSpotlightId);
                const stream =
                  activeSpotlightId === socket.id
                    ? isScreenSharing ? screenStreamRef.current : localStream
                    : remoteStreams.get(activeSpotlightId);

                return (
                  <VideoTile
                    key={activeSpotlightId}
                    participant={spotlightUser}
                    stream={stream}
                    isLocal={activeSpotlightId === socket.id}
                    isPinned={true}
                    onTogglePin={() => setPinnedParticipantId(null)}
                  />
                );
              })()}
            </div>

            <div className="spotlight-filmstrip">
              {allParticipants
                .filter((p) => p.id !== activeSpotlightId)
                .map((p) => {
                  const stream = p.id === socket.id ? localStream : remoteStreams.get(p.id);
                  return (
                    <VideoTile
                      key={p.id}
                      participant={p}
                      stream={stream}
                      isLocal={p.id === socket.id}
                      isPinned={false}
                      onTogglePin={(id) => setPinnedParticipantId(id)}
                    />
                  );
                })}
            </div>
          </div>
        ) : (
          <div className={`video-grid ${gridClass}`}>
            {/* Local Video Tile */}
            <VideoTile
              participant={localUser}
              stream={isScreenSharing ? screenStreamRef.current : localStream}
              isLocal={true}
              isPinned={false}
              onTogglePin={(id) => setPinnedParticipantId(id)}
            />

            {/* Remote Video Tiles */}
            {remoteParticipants.map((p) => (
              <VideoTile
                key={p.id}
                participant={p}
                stream={remoteStreams.get(p.id)}
                isLocal={false}
                isPinned={false}
                onTogglePin={(id) => setPinnedParticipantId(id)}
              />
            ))}
          </div>
        )}

        {/* Live Closed Captions Overlay */}
        {isCaptionsOn && liveCaptionText && (
          <div className="live-captions-banner">
            <span style={{ color: '#8ab4f8', fontWeight: 600, marginRight: '8px' }}>[CC]</span>
            <span>{liveCaptionText}</span>
          </div>
        )}

        {/* Drawers */}
        {activeDrawer === 'chat' && (
          <ChatDrawer
            messages={chatMessages}
            currentUserId={socket.id}
            onSendMessage={(text) => socket.emit('send-message', { text })}
            onShareFile={(fileData) => socket.emit('share-file', fileData)}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'people' && (
          <ParticipantsDrawer
            participants={allParticipants}
            currentUserId={socket.id}
            isCurrentUserHost={isHost}
            onMuteParticipant={handleHostMuteParticipant}
            onMuteAll={handleHostMuteAll}
            onRemoveParticipant={handleHostRemoveParticipant}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {activeDrawer === 'info' && (
          <MeetingInfoDrawer
            roomId={roomId}
            onClose={() => setActiveDrawer(null)}
          />
        )}
      </div>

      {/* Floating Reactions Layer */}
      <div className="reactions-fly-layer">
        {floatingReactions.map((r) => (
          <div key={r.id} className="flying-emoji-item" style={{ left: r.left }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Floating Reactions Bar Popup */}
      {showReactions && (
        <div className="reactions-picker-bar" style={{ left: '50%', transform: 'translateX(-50%)' }}>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="reaction-emoji-btn"
              onClick={() => sendEmojiReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* BOTTOM CONTROLS BAR (Google Meet Signature Bar) */}
      <footer className="meeting-bottom-bar">
        {/* Left: Meeting code & clock */}
        <div className="bar-left-meta">
          <span>{roomId}</span>
        </div>

        {/* Center: Action Buttons */}
        <div className="bar-center-cluster">
          {/* Mic */}
          <button
            className={`btn-pill-ctrl ${!isAudioOn ? 'off-red' : ''}`}
            onClick={toggleAudio}
            title={isAudioOn ? 'Turn off microphone' : 'Turn on microphone'}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Camera */}
          <button
            className={`btn-pill-ctrl ${!isVideoOn ? 'off-red' : ''}`}
            onClick={toggleVideo}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Closed Captions [CC] */}
          <button
            className={`btn-pill-ctrl ${isCaptionsOn ? 'active-blue' : ''}`}
            onClick={toggleCaptions}
            title={isCaptionsOn ? 'Turn off captions' : 'Turn on captions'}
          >
            <Subtitles size={20} />
          </button>

          {/* Emoji Reactions */}
          <button
            className={`btn-pill-ctrl ${showReactions ? 'active-blue' : ''}`}
            onClick={() => setShowReactions(!showReactions)}
            title="Send a reaction"
          >
            <Smile size={20} />
          </button>

          {/* Screen Share */}
          <button
            className={`btn-pill-ctrl ${isScreenSharing ? 'active-blue' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop presenting' : 'Present now'}
          >
            <MonitorUp size={20} />
          </button>

          {/* Hand Raise */}
          <button
            className={`btn-pill-ctrl ${isHandRaised ? 'active-blue' : ''}`}
            onClick={toggleHandRaise}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand size={20} />
          </button>

          {/* Record Meeting */}
          <button
            className={`btn-pill-ctrl ${isRecording ? 'off-red' : ''}`}
            onClick={toggleMeetingRecording}
            title={isRecording ? 'Stop recording' : 'Record meeting'}
          >
            {isRecording ? <Square size={18} fill="#ffffff" /> : <Disc size={20} />}
          </button>

          {/* Leave Call */}
          <button
            className="btn-leave-call-pill"
            onClick={onLeaveMeeting}
            title="Leave call"
          >
            <PhoneOff size={22} />
          </button>
        </div>

        {/* Right: Info, People, Chat, Host Controls */}
        <div className="bar-right-tray">
          <button
            className={`btn-tray-ctrl ${activeDrawer === 'info' ? 'active' : ''}`}
            onClick={() => setActiveDrawer(activeDrawer === 'info' ? null : 'info')}
            title="Meeting details"
          >
            <Info size={20} />
          </button>

          <button
            className={`btn-tray-ctrl ${activeDrawer === 'people' ? 'active' : ''}`}
            onClick={() => setActiveDrawer(activeDrawer === 'people' ? null : 'people')}
            title="People"
          >
            <Users size={20} />
            <span className="tray-count-chip">{allParticipants.length}</span>
          </button>

          <button
            className={`btn-tray-ctrl ${activeDrawer === 'chat' ? 'active' : ''}`}
            onClick={() => {
              setActiveDrawer(activeDrawer === 'chat' ? null : 'chat');
              setUnreadChatCount(0);
            }}
            title="Chat with everyone"
          >
            <MessageSquare size={20} />
            {unreadChatCount > 0 && <span className="tray-count-chip">{unreadChatCount}</span>}
          </button>

          {isHost && (
            <button
              className="btn-tray-ctrl"
              onClick={() => setActiveDrawer('people')}
              title="Host Controls"
              style={{ color: '#8ab4f8' }}
            >
              <Shield size={20} />
            </button>
          )}
        </div>
      </footer>

      {/* Host Knock Admission Modal */}
      {knockApplicant && isHost && (
        <div className="modal-overlay">
          <div className="modal-dialog-card">
            <h3 className="modal-dialog-title">Someone wants to join this call</h3>
            <p className="modal-dialog-body">
              <strong>{knockApplicant.name}</strong> is asking to join.
            </p>
            <div className="modal-actions-group">
              <button className="btn-secondary" onClick={handleDeny}>
                Deny entry
              </button>
              <button className="btn-primary" onClick={handleAdmit}>
                Admit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaborative Whiteboard Modal */}
      {showWhiteboard && (
        <WhiteboardModal
          socket={socket}
          onClose={() => setShowWhiteboard(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-pill-alert">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
