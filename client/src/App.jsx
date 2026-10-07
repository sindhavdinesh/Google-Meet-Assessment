import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Lobby from './components/Lobby';
import MeetingRoom from './components/MeetingRoom';
import { Clock } from 'lucide-react';

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'lobby' | 'meeting' | 'waiting'
  const [roomId, setRoomId] = useState('');
  const [userConfig, setUserConfig] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    // In dev Vite proxies /socket.io to backend 5000
    const newSocket = io({
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Global listener for waiting for host
    newSocket.on('waiting-for-host', () => {
      setPage('waiting');
    });

    newSocket.on('join-denied', () => {
      alert('The host has denied your request to join the meeting.');
      setPage('landing');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Check URL query parameters for ?room=xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      setPage('lobby');
    }
  }, []);

  const handleStartMeeting = (newRoomId) => {
    setRoomId(newRoomId);
    window.history.pushState({}, '', `?room=${newRoomId}`);
    setPage('lobby');
  };

  const handleJoinMeeting = (enteredRoomId) => {
    setRoomId(enteredRoomId);
    window.history.pushState({}, '', `?room=${enteredRoomId}`);
    setPage('lobby');
  };

  const handleJoinCall = (config) => {
    setUserConfig(config);
    // MeetingRoom will emit 'request-join' or 'direct-join'
    setPage('meeting');
  };

  const handleLeaveMeeting = () => {
    window.history.pushState({}, '', window.location.pathname);
    setRoomId('');
    setUserConfig(null);
    setPage('landing');
  };

  return (
    <div className="app-container">
      {/* Show Navbar on landing & lobby pages */}
      {(page === 'landing' || page === 'lobby' || page === 'waiting') && (
        <Navbar
          onLogoClick={handleLeaveMeeting}
          userInitial={userConfig?.name?.[0]?.toUpperCase() || localStorage.getItem('meet_username')?.[0]?.toUpperCase() || 'S'}
          currentUserName={userConfig?.name || localStorage.getItem('meet_username') || 'Student'}
          onUpdateName={(newName) => {
            if (userConfig) setUserConfig({ ...userConfig, name: newName });
          }}
        />
      )}

      {page === 'landing' && (
        <LandingPage
          onStartMeeting={handleStartMeeting}
          onJoinMeeting={handleJoinMeeting}
        />
      )}

      {page === 'lobby' && (
        <Lobby
          roomId={roomId}
          onJoinCall={handleJoinCall}
        />
      )}

      {page === 'waiting' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 80px)',
          textAlign: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: '#e8f0fe',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            animation: 'pulse 2s infinite'
          }}>
            <Clock size={40} color="#1a73e8" />
          </div>
          <h2 style={{ fontSize: '26px', color: '#202124', fontWeight: 400, marginBottom: '12px' }}>
            Asking to join...
          </h2>
          <p style={{ fontSize: '15px', color: '#5f6368', maxWidth: '420px', lineHeight: '22px', marginBottom: '28px' }}>
            You'll join the call when someone in the meeting lets you in.
          </p>
          <button
            className="btn-secondary"
            onClick={handleLeaveMeeting}
            style={{ border: '1px solid #dadce0', borderRadius: '8px' }}
          >
            Cancel request
          </button>
        </div>
      )}

      {page === 'meeting' && socket && (
        <MeetingRoom
          roomId={roomId}
          initialUserConfig={userConfig}
          socket={socket}
          onLeaveMeeting={handleLeaveMeeting}
        />
      )}
    </div>
  );
}
