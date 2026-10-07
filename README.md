# 📹 Google Meet Clone - Full-Stack Assessment Project

An enterprise-grade, feature-complete **Google Meet Clone** built using **WebRTC**, **Socket.IO**, **Node.js/Express**, and **React (Vite)**. Designed specifically for the Google Meet Assessment curriculum (covering all modules from **Day 1 to Day 16**).

---

## 🚀 Quick Start (One Command)

### 1. Install Dependencies
```bash
npm install
npm run install:all
```

### 2. Run Both Server & Client
```bash
npm run dev
```

- **Frontend (Client):** `http://localhost:3000`
- **Backend (Signaling Server):** `http://localhost:5000`

---

## 🎯 Curriculum & Assessment Checklist Mapping

| No. | Day / Challenge | Feature Implemented | Code Location |
| :--- | :--- | :--- | :--- |
| **8.1 & 8.2** | Case Study: WebRTC & Google Meet | WebRTC Mesh Architecture, SDP handshake, ICE candidates, STUN servers | [`server.js`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/server/server.js), [`webrtc.js`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/utils/webrtc.js) |
| **8.3** | Make Landing Page | Google Meet Navbar, real-time clock, Hero section, New Meeting dropdown, Feature carousel | [`LandingPage.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/LandingPage.jsx) |
| **8.4** | Home Page / Pre-join Lobby | Audio/Video preview, mic/camera toggles, audio visualizer, name input | [`Lobby.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/Lobby.jsx) |
| **8.5** | Server & Socket.IO Setup | Real-time signaling server, room management, event routing | [`server.js`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/server/server.js) |
| **8.6** | Audio/Video & SDP Process | `createOffer`, `createAnswer`, `setLocalDescription`, `setRemoteDescription` | [`webrtc.js`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/utils/webrtc.js), [`MeetingRoom.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/MeetingRoom.jsx) |
| **8.7** | Audio/Video Streaming Connection | P2P video tiles, speaking indicator (Web Audio API), avatar fallbacks | [`VideoTile.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/VideoTile.jsx), [`audioActivity.js`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/utils/audioActivity.js) |
| **8.8** | Screen Sharing System | `getDisplayMedia`, dynamic `RTCRtpSender.replaceTrack`, presentation layout | [`MeetingRoom.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/MeetingRoom.jsx#L340-L380) |
| **8.9** | In-Call Messaging System | Real-time chat drawer, timestamps, sender badges, unread message counter | [`ChatDrawer.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/ChatDrawer.jsx) |
| **9.1** | Participants Details | Live participant drawer, search by name, mic & camera status indicators | [`ParticipantsDrawer.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/ParticipantsDrawer.jsx) |
| **9.2** | Miscellaneous Functions | 1-click meeting link copy, emoji reactions bar, floating emoji animations, elapsed meeting timer | [`MeetingRoom.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/MeetingRoom.jsx), [`MeetingInfoDrawer.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/MeetingInfoDrawer.jsx) |
| **9.3** | File Sharing System | Share images & documents in call, file size metadata, instant download cards | [`ChatDrawer.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/ChatDrawer.jsx#L25-L65) |
| **9.4** | Meeting Recording System | In-browser recording with `MediaRecorder` API, live 🔴 REC indicator, auto-download WebM | [`MeetingRoom.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/MeetingRoom.jsx#L390-L435) |
| **9.5** | Hand Raise Logic | Hand raise toggle button, animated ✋ badge on video tile and list, toast alert | [`MeetingRoom.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/MeetingRoom.jsx#L380-L390) |
| **9.6** | Host Permission System | Waiting Room knock admission ("Ask to Join"), Host Mute All, Host Kick Participant | [`server.js`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/server/server.js#L60-L115), [`ParticipantsDrawer.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/ParticipantsDrawer.jsx) |
| **9.7** | WebRTC Optimization & Polish | Responsive multi-tile grid, pinned spotlight view, collaborative Whiteboard tool | [`WhiteboardModal.jsx`](file:///c:/Users/User/Desktop/Google%20Meet%20Assessment/client/src/components/WhiteboardModal.jsx) |

---

## 🛠️ Architecture Overview

```
+-------------------------------------------------------------------------+
|                              CLIENT (React)                             |
|                                                                         |
|  [Landing Page] -> [Lobby / Preview] -> [Waiting Room / Meeting Room]  |
|         |                                      |                        |
|   New Meeting / Code                     MediaStreams (Cam / Mic)       |
+-------------------------------------------------------------------------+
           |                                              |
           | HTTP / WebSockets                            | WebRTC P2P (Mesh)
           v                                              v
+--------------------------------------+      +---------------------------+
|          SIGNALING SERVER            |      |      REMOTE PEERS         |
|         (Express + Socket.IO)        |      |   (Direct Media Exchange) |
|                                      |      |                           |
|  - Room Management                   |      |  - Video / Audio Tracks   |
|  - Host Admission (Waiting Room)     |      |  - Screen Share Track     |
|  - SDP Offer/Answer Exchange         |      |  - Zero Server Media Lag  |
|  - ICE Candidate Relay               |      +---------------------------+
|  - Chat & File Transfers             |
+--------------------------------------+
```

---

## 🧪 How to Test and Present (Step-by-Step)

1. Open `http://localhost:3000` in your browser.
2. Click **"New meeting"** -> **"Start an instant meeting"**.
3. In the pre-join lobby, verify your camera preview, microphone indicator, and enter your name (e.g. `Host Alice`).
4. Click **"Join now"**. You will enter as the **Host**.
5. Click the **Meeting Details (ℹ️)** icon on the bottom right and click **"Copy joining info"**.
6. Open an **Incognito / Private browser tab** (or another browser) and paste the link.
7. Enter a name (e.g. `Bob`) in the lobby and click **"Join now"**.
8. Notice that Bob sees **"Asking to join..."** (Waiting room).
9. Switch to Alice's tab: Alice receives a prompt: **"Bob is asking to join. [Admit / Deny]"**. Click **Admit**!
10. Both Alice and Bob are now in the call with two-way audio & video!
11. **Test Features:**
    - ✋ Click **Hand Raise** on Bob's side -> Alice sees `✋ Bob raised their hand`.
    - 🖥️ Click **Present now** -> Screen shares to all participants.
    - 💬 Open **Chat** -> Send a text message or attach a file using the paperclip 📎 -> Bob can download it!
    - 🔴 Click **Record Meeting** -> Recording starts with 🔴 REC indicator; click stop to download the video.
    - 🎨 Click the **Pencil icon** on top bar -> Draw collaboratively on the real-time **Whiteboard**.
    - 🛡️ Open **People** on Alice's side -> Test **"Mute All"** or click options next to Bob to mute or remove them.

---

## 📦 Project Structure

```
Google Meet Assessment/
├── package.json               # Root scripts (concurrent dev runner)
├── README.md                  # Complete documentation and curriculum map
├── server/
│   ├── package.json           # Backend dependencies (Express, Socket.IO, UUID, Cors)
│   └── server.js              # WebRTC signaling, room state, host admission, chat & files
└── client/
    ├── package.json           # Frontend dependencies (React, Vite, Lucide, Canvas-Confetti)
    ├── vite.config.js         # Proxy configuration for port 5000 & 3000
    ├── index.html             # Google Meet branding & Google Sans fonts
    └── src/
        ├── main.jsx           # App entry point
        ├── index.css          # Pixel-perfect Google Meet styling
        ├── App.jsx            # Routing & state coordinator
        ├── components/
        │   ├── Navbar.jsx             # Top Google Meet bar with live clock
        │   ├── LandingPage.jsx        # Landing hero, meeting generator, carousel
        │   ├── Lobby.jsx              # Pre-join camera/mic preview test
        │   ├── MeetingRoom.jsx        # Full meeting room & control bar
        │   ├── VideoTile.jsx          # Participant video tile & active speaker glow
        │   ├── ChatDrawer.jsx         # In-call chat & file sharing
        │   ├── ParticipantsDrawer.jsx # People list, host controls (Mute all / Kick)
        │   ├── MeetingInfoDrawer.jsx  # Shareable link & 1-click copy
        │   └── WhiteboardModal.jsx    # Real-time collaborative whiteboard
        └── utils/
            ├── webrtc.js              # RTCPeerConnection, STUN servers & track handling
            └── audioActivity.js       # Web Audio API speaking volume detection
```
