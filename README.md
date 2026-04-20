# ZoomClone — Full-Stack Video Meetings

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Video**: WebRTC (native browser API, mesh topology)
- **Auth**: JWT + bcrypt
- **DB**: MongoDB (Mongoose)

## Setup

### 1. Clone & install

```bash
# Backend
cd backend
cp .env.example .env          # edit MONGO_URI and JWT_SECRET
npm install
npm run dev                   # runs on :5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                   # runs on :5173
```

### 2. Environment variables

**backend/.env**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/zoomclone
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

> Note: With the Vite proxy configured, you can also leave both VITE_ vars empty and requests will proxy automatically in dev.

## Core Logic

- **Auth**: JWT stored in localStorage, injected as `Authorization: Bearer <token>` on all Axios requests via defaults. `authMiddleware` verifies on every protected route.
- **Meeting creation**: Backend generates a `XXX-XXX-XXX` room ID, stores it in MongoDB. Frontend navigates to `/meeting/:roomId`.
- **WebRTC signaling**: Socket.IO relays `offer`, `answer`, and `ice-candidate` events between peers. Server never touches media data.
- **Peer mesh**: When user A joins, server sends them the list of existing peers. A creates an `RTCPeerConnection` and sends an offer to each. Existing peers respond with answers.
- **Screen share**: `getDisplayMedia()` replaces the video track in every active `RTCPeerConnection` sender via `replaceTrack()` — no renegotiation needed.
- **Chat**: Socket.IO room broadcast. Each message includes sender name, text, and timestamp. Unread badge shown when chat panel is closed.
- **Media state**: When a user mutes/unmutes or togges camera, a `media-state` socket event notifies peers to update the UI overlay (mute icon, black tile).
