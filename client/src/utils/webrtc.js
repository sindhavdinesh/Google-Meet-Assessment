// WebRTC configuration and helper utilities

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

// Create a new RTCPeerConnection for a peer
export function createPeerConnection(peerId, socket, onRemoteStream, onIceCandidate) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal-ice-candidate', {
        targetId: peerId,
        candidate: event.candidate
      });
      if (onIceCandidate) onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    console.log(`[WebRTC] Received remote track from ${peerId}:`, event.track.kind);
    if (event.streams && event.streams[0]) {
      onRemoteStream(peerId, event.streams[0]);
    } else {
      const inboundStream = new MediaStream([event.track]);
      onRemoteStream(peerId, inboundStream);
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`[WebRTC] Connection state with ${peerId}:`, pc.connectionState);
  };

  return pc;
}

// Add local media stream tracks to a peer connection
export function addStreamTracks(pc, stream) {
  if (!pc || !stream) return [];
  const senders = [];
  stream.getTracks().forEach((track) => {
    try {
      const sender = pc.addTrack(track, stream);
      senders.push(sender);
    } catch (err) {
      console.warn('[WebRTC] Track already added or failed:', err);
    }
  });
  return senders;
}

// Replace video track (used for screen sharing)
export async function replaceVideoTrack(pc, newVideoTrack) {
  if (!pc) return;
  const senders = pc.getSenders();
  const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
  if (videoSender) {
    await videoSender.replaceTrack(newVideoTrack);
  }
}
