import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

// ── Icons (Lucide-style stroke) ───────────────────────────────────────────────
const I = {
  MicOn:    () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  MicOff:   () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  CamOn:    () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  CamOff:   () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/><polygon points="23 7 16 12 23 17 23 7"/><line x1="2" y1="2" x2="22" y2="22"/></svg>,
  Share:    () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><polyline points="9 8 12 5 15 8"/><line x1="12" y1="5" x2="12" y2="13"/></svg>,
  StopShare:() => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><polyline points="9 10 12 13 15 10"/><line x1="12" y1="13" x2="12" y2="5"/></svg>,
  People:   () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chat:     () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Leave:    () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Crown:    () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 3h14v2H5v-2z"/></svg>,
  Lock:     () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  MuteUser: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>,
  Kick:     () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="8"/></svg>,
  Copy:     () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check:    () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Close:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// Deterministic avatar color per name initial
const ABG = ['#3b5bdb','#7950f2','#0ca678','#e67700','#c2255c','#1971c2','#2f9e44','#e64980'];
const avatarBg = name => ABG[(name?.charCodeAt(0) || 0) % ABG.length];

function Avatar({ name, size = 'md' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-2xl' }[size];
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none`}
      style={{ background: avatarBg(name) }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

// Control button in bottom bar
function Btn({ onClick, icon, label, danger = false, active = true, accent = false, badge }) {
  let border = '1px solid #2a2f3d';
  let bg     = 'transparent';
  let color  = active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.8)';
  if (!active && danger)  { color = '#f03e3e'; bg = 'rgba(240,62,62,0.12)'; border = '1px solid rgba(240,62,62,0.35)'; }
  if (active && accent)   { color = '#74c0fc'; bg = 'rgba(116,192,252,0.08)'; border = '1px solid rgba(116,192,252,0.25)'; }
  return (
    <button onClick={onClick}
      className="relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 hover:bg-white/5 active:scale-[0.97] select-none"
      style={{ color, bg, border, minWidth: 64, background: bg }}>
      <span style={{ display: 'flex', overflow: 'visible' }}>{icon}</span>
      {label}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-semibold leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// Remote peer video — only updates srcObject when stream identity changes
function PeerVideo({ stream, name, muted, videoOff }) {
  const ref  = useRef();
  const prev = useRef(null);
  useEffect(() => {
    if (!ref.current || stream === prev.current) return;
    ref.current.srcObject = stream || null;
    prev.current = stream;
  }, [stream]);
  const showVideo = stream && !videoOff;
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#1a1d23' }}>
      <video ref={ref} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-300 ${showVideo ? 'opacity-100' : 'opacity-0 absolute'}`} />
      {!showVideo && <Avatar name={name} size="lg" />}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
      <div className="absolute bottom-2.5 left-2.5">
        <span className="text-white text-xs font-medium drop-shadow-sm">{name}</span>
      </div>
      {muted && (
        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-red-400">
          <I.MicOff />
        </div>
      )}
    </div>
  );
}

// Local video — updates when stream becomes available or screenOn changes
function LocalVideo({ localStreamRef, screenStreamRef, screenOnRef, screenOn, videoOn, name, streamReady }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    const src = (screenOnRef.current && screenStreamRef.current)
      ? screenStreamRef.current
      : localStreamRef.current;
    if (src) ref.current.srcObject = src;
  }, [streamReady, screenOn, screenOnRef, screenStreamRef, localStreamRef]);

  const mirrored = !screenOn && videoOn;
  return (
    <>
      <video ref={ref} autoPlay muted playsInline
        className={`w-full h-full object-cover transition-all duration-300 ${mirrored ? 'scale-x-[-1]' : ''}`}
      />
      {!videoOn && !screenOn && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1a1d23' }}>
          <Avatar name={name} size="lg" />
        </div>
      )}
    </>
  );
}

// Camera thumb shown in screen-share sidebar — reads camera tracks from localStream only
function SelfThumb({ localStreamRef, videoOn, name, audioOn, streamReady }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !localStreamRef.current) return;
    ref.current.srcObject = localStreamRef.current;
  }, [localStreamRef, streamReady]);
  return (
    <>
      {videoOn
        ? <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
        : <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1a1d23' }}><Avatar name={name} size="sm" /></div>
      }
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-1 left-1.5 flex items-center gap-1">
        <span className="text-white text-xs">{name}</span>
        {!audioOn && <span className="text-red-400"><I.MicOff /></span>}
      </div>
    </>
  );
}

function useTimer() {
  const [s, setS] = useState(0);
  useEffect(() => { const t = setInterval(() => setS(n => n + 1), 1000); return () => clearInterval(t); }, []);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Meeting() {
  const { roomId } = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const rid        = roomId.toUpperCase();
  const elapsed    = useTimer();

  // Refs (don't trigger re-renders, safe in async callbacks)
  const localStream   = useRef(null);
  const screenStream  = useRef(null);
  const sock          = useRef(null);
  const pcs           = useRef({});
  const peerMeta      = useRef({});
  const seenMsgs      = useRef(new Set());
  const audioRef      = useRef(true);
  const videoRef      = useRef(true);
  const screenOnRef   = useRef(false);

  // localStreamState is set once getUserMedia resolves — triggers LocalVideo to re-mount
  const [localStreamReady, setLocalStreamReady] = useState(false);

  // State
  const [peers,       setPeers]       = useState({});
  const [audioOn,     _setAudioOn]    = useState(true);
  const [videoOn,     _setVideoOn]    = useState(true);
  const [screenOn,    _setScreenOn]   = useState(false);
  const [sharer,      setSharer]      = useState(null);   // 'self' | socketId | null
  const [isHost,      setIsHost]      = useState(false);
  const [hostSid,     setHostSid]     = useState(null);
  const [roomLocked,  setRoomLocked]  = useState(false);
  const [panel,       setPanel]       = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [chatInput,   setChatInput]   = useState('');
  const [unread,      setUnread]      = useState(0);
  const [toast,       setToast]       = useState('');
  const [copied,      setCopied]      = useState(false);
  const [unmuteReq,   setUnmuteReq]   = useState(false);
  const chatBottom = useRef();

  // Synced setters — update both ref and state
  const setAudioOn  = v => { audioRef.current    = v; _setAudioOn(v);  };
  const setVideoOn  = v => { videoRef.current    = v; _setVideoOn(v);  };
  const setScreenOn = v => { screenOnRef.current = v; _setScreenOn(v); };

  const toast$ = useCallback((msg, ms = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(''), ms);
  }, []);

  const isSelf = id => id && id === user?.id;

  // Remove a peer by socketId
  const removePeer = useCallback(sid => {
    pcs.current[sid]?.close();
    delete pcs.current[sid];
    delete peerMeta.current[sid];
    setPeers(p => { const n = { ...p }; delete n[sid]; return n; });
    setSharer(s => s === sid ? null : s);
  }, []);

  // Remove all sockets belonging to same userId (dedup)
  const evictUserId = useCallback((userId, keepSid) => {
    for (const [sid, m] of Object.entries(peerMeta.current)) {
      if (m.userId === userId && sid !== keepSid) {
        pcs.current[sid]?.close();
        delete pcs.current[sid];
        delete peerMeta.current[sid];
        setPeers(p => { const n = { ...p }; delete n[sid]; return n; });
        setSharer(s => s === sid ? null : s);
      }
    }
  }, []);

  // Create RTCPeerConnection for a remote peer
  const createPC = useCallback((sid, name, userId) => {
    if (pcs.current[sid]) return pcs.current[sid];
    evictUserId(userId, sid);

    const pc = new RTCPeerConnection(ICE);
    localStream.current?.getTracks().forEach(t => pc.addTrack(t, localStream.current));

    pc.onicecandidate = ({ candidate }) =>
      candidate && sock.current?.emit('ice-candidate', { to: sid, candidate });

    pc.onconnectionstatechange = () =>
      ['failed', 'disconnected'].includes(pc.connectionState) && pc.restartIce();

    const remote = new MediaStream();
    pc.ontrack = ({ track }) => {
      remote.addTrack(track);
      setPeers(p => ({ ...p, [sid]: { ...p[sid], stream: remote, name } }));
    };

    pcs.current[sid] = pc;
    peerMeta.current[sid] = { name, userId };
    setPeers(p => ({ ...p, [sid]: { name, stream: null, audioOn: true, videoOn: true, sharing: false } }));
    return pc;
  }, [evictUserId]);

  const callPeer = useCallback(async (sid, name, userId) => {
    const pc = createPC(sid, name, userId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    sock.current?.emit('offer', { to: sid, offer });
  }, [createPC]);

  // Stop screen share — safe to call from event listeners (uses only refs)
  const stopSharing = useCallback(async () => {
    if (!screenOnRef.current) return;
    const camTrack = localStream.current?.getVideoTracks()[0];
    if (camTrack) {
      await Promise.all(
        Object.values(pcs.current).map(pc => {
          const s = pc.getSenders().find(s => s.track?.kind === 'video');
          return s ? s.replaceTrack(camTrack) : Promise.resolve();
        })
      ).catch(() => {});
    }
    screenStream.current?.getTracks().forEach(t => t.stop());
    screenStream.current = null;
    setScreenOn(false);
    setSharer(null);
    sock.current?.emit('media-state', { audio: audioRef.current, video: videoRef.current, screen: false });
  }, [setScreenOn]);

  // ── Socket + camera setup (runs once) ─────────────────────────────────────
  useEffect(() => {
    let alive = true;

    (async () => {
      // Camera/mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        localStream.current = stream;
        setLocalStreamReady(true);
      } catch {
        toast$('Camera/mic access denied. Check browser permissions.');
        return;
      }

      // Socket
      const s = io(import.meta.env.VITE_SOCKET_URL || '', { transports: ['websocket', 'polling'] });
      if (!alive) { s.disconnect(); return; }
      sock.current = s;

      s.emit('join-room', { roomId: rid, userName: user.name, userId: user.id });

      s.on('your-role', ({ isHost: h, hostSocketId: hid, locked }) => {
        if (!alive) return;
        setIsHost(h); setHostSid(hid); setRoomLocked(locked);
      });

      s.on('join-rejected', reason => {
        if (!alive) return;
        toast$(reason);
        setTimeout(() => navigate('/home'), 2000);
      });

      s.on('existing-participants', list => {
        list.forEach(({ socketId, name, userId }) => {
          if (!alive || isSelf(userId)) return;
          callPeer(socketId, name, userId);
        });
      });

      s.on('peer-joined', ({ socketId, name, userId }) => {
        if (!alive || isSelf(userId)) return;
        evictUserId(userId, socketId);
        toast$(`${name} joined`);
        peerMeta.current[socketId] = { name, userId };
        setPeers(p => {
          if (p[socketId]) return p; // already tracked
          return { ...p, [socketId]: { name, stream: null, audioOn: true, videoOn: true, sharing: false } };
        });
      });

      s.on('offer', async ({ from, offer }) => {
        if (!alive || isSelf(peerMeta.current[from]?.userId)) return;
        const { name = 'Participant', userId } = peerMeta.current[from] || {};
        const pc = createPC(from, name, userId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        s.emit('answer', { to: from, answer: ans });
      });

      s.on('answer', async ({ from, answer }) => {
        await pcs.current[from]?.setRemoteDescription(new RTCSessionDescription(answer));
      });

      s.on('ice-candidate', ({ from, candidate }) => {
        pcs.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      });

      s.on('peer-left', ({ socketId }) => alive && removePeer(socketId));

      s.on('peer-media-state', ({ socketId, audio, video, screen }) => {
        if (!alive) return;
        setPeers(p => ({ ...p, [socketId]: { ...p[socketId], audioOn: audio, videoOn: video, sharing: screen } }));
        setSharer(cur => screen ? socketId : (cur === socketId ? null : cur));
      });

      // Chat — deduplicate by message id
      s.on('chat-message', msg => {
        if (!alive) return;
        if (seenMsgs.current.has(msg.id)) return;
        seenMsgs.current.add(msg.id);
        setMessages(m => [...m, msg]);
        setPanel(cur => { if (cur !== 'chat') setUnread(n => n + 1); return cur; });
      });

      // Host events
      s.on('host-changed', ({ newHostSocketId }) => {
        if (!alive) return;
        setHostSid(newHostSocketId);
        if (s.id === newHostSocketId) { setIsHost(true); toast$('You are now the host 👑'); }
      });

      s.on('room-lock-changed', ({ locked }) => {
        if (!alive) return;
        setRoomLocked(locked);
        toast$(locked ? 'Room locked — no new participants can join' : 'Room unlocked');
      });

      s.on('force-mute', () => {
        if (!alive) return;
        const t = localStream.current?.getAudioTracks()[0];
        if (t) { t.enabled = false; setAudioOn(false); }
        s.emit('media-state', { audio: false, video: videoRef.current, screen: screenOnRef.current });
        toast$('You were muted by the host');
      });

      s.on('unmute-request', () => {
        if (!alive) return;
        setUnmuteReq(true);
        setTimeout(() => setUnmuteReq(false), 8000);
        toast$('The host is asking you to unmute');
      });

      s.on('you-were-kicked', () => {
        if (!alive) return;
        toast$('You were removed from the meeting');
        setTimeout(() => { localStream.current?.getTracks().forEach(t => t.stop()); navigate('/home'); }, 1800);
      });
    })();

    return () => {
      alive = false;
      localStream.current?.getTracks().forEach(t => t.stop());
      screenStream.current?.getTracks().forEach(t => t.stop());
      Object.values(pcs.current).forEach(pc => pc.close());
      sock.current?.disconnect();
    };
  }, []); // intentional: run once on mount

  useEffect(() => { chatBottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleAudio = () => {
    const t = localStream.current?.getAudioTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setAudioOn(t.enabled);
    sock.current?.emit('media-state', { audio: t.enabled, video: videoRef.current, screen: screenOnRef.current });
  };

  const toggleVideo = () => {
    const t = localStream.current?.getVideoTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setVideoOn(t.enabled);
    sock.current?.emit('media-state', { audio: audioRef.current, video: t.enabled, screen: screenOnRef.current });
  };

  const toggleScreen = async () => {
    if (screenOnRef.current) {
      await stopSharing();
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
        screenStream.current = ss;
        const track = ss.getVideoTracks()[0];
        await Promise.all(
          Object.values(pcs.current).map(pc => {
            const s = pc.getSenders().find(s => s.track?.kind === 'video');
            return s ? s.replaceTrack(track) : Promise.resolve();
          })
        ).catch(() => {});
        track.onended = () => stopSharing(); // user clicked "Stop sharing" in browser UI
        setScreenOn(true);
        setSharer('self');
        sock.current?.emit('media-state', { audio: audioRef.current, video: videoRef.current, screen: true });
      } catch (e) {
        if (e.name !== 'NotAllowedError') console.error('Screen share:', e);
      }
    }
  };

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    sock.current?.emit('chat-message', { message: msg });
    setChatInput('');
  };

  const leave = () => {
    localStream.current?.getTracks().forEach(t => t.stop());
    screenStream.current?.getTracks().forEach(t => t.stop());
    Object.values(pcs.current).forEach(pc => pc.close());
    sock.current?.disconnect();
    navigate('/home');
  };

  const togglePanel = name => {
    setPanel(p => p === name ? null : name);
    if (name === 'chat') setUnread(0);
  };

  // Host actions
  const hostMute = sid => sock.current?.emit('host:mute', { targetSocketId: sid });
  const hostKick = sid => sock.current?.emit('host:kick', { targetSocketId: sid });
  const hostToggleLock = () => sock.current?.emit('host:toggle-lock');

  // Computed
  const peerList = Object.entries(peers);
  const total    = 1 + peerList.length;
  const isSharing = sharer !== null;
  const sharerPeer = sharer && sharer !== 'self' ? peers[sharer] : null;

  const allPeople = [
    { id: 'self', name: user?.name, audioOn, videoOn, sharing: screenOn, isHostUser: isHost, sid: sock.current?.id },
    ...peerList.map(([sid, p]) => ({
      id: sid, sid, name: p.name, audioOn: p.audioOn, videoOn: p.videoOn, sharing: p.sharing,
      isHostUser: sid === hostSid,
    })),
  ];

  const grid =
    total === 1 ? 'grid-cols-1' :
    total === 2 ? 'grid-cols-2' :
    total <= 4  ? 'grid-cols-2' :
    'grid-cols-3';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0e1117' }}>

      {/* ── Main Column ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0 border-b"
          style={{ background: '#12151d', borderColor: '#1e2330' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ boxShadow: '0 0 6px #3b82f6' }} />
              <span className="text-white/70 text-sm font-medium tracking-wide">MeetApp</span>
            </div>
            <span className="w-px h-4 bg-white/10" />
            <button
              onClick={() => { navigator.clipboard.writeText(rid); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1.5 rounded-lg transition-all duration-150 hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}>
              {rid}
              <span className="transition-all duration-200 flex">
                {copied ? <I.Check /> : <I.Copy />}
              </span>
            </button>
            {isHost && (
              <button onClick={hostToggleLock} title={roomLocked ? 'Unlock room' : 'Lock room'}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-150 hover:bg-white/10"
                style={{ color: roomLocked ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
                {roomLocked ? <I.Lock /> : <I.Unlock />}
                <span className="hidden sm:inline">{roomLocked ? 'Locked' : 'Lock'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span className="font-mono tabular-nums">{elapsed}</span>
            <span>{total} in call</span>
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 p-2.5 flex gap-2.5 overflow-hidden min-h-0">
          {isSharing ? (
            // ── Screen share layout ─────────────────────────────────────────
            <div className="flex flex-1 gap-2.5 min-h-0">
              {/* Main screen */}
              <div className="flex-1 rounded-xl overflow-hidden relative flex items-center justify-center min-h-0"
                style={{ background: '#1a1d23' }}>
                {sharer === 'self' ? (
                  <LocalVideo localStreamRef={localStream} screenStreamRef={screenStream}
                    screenOnRef={screenOnRef} screenOn={screenOn} videoOn={videoOn} name={user?.name} streamReady={localStreamReady} />
                ) : sharerPeer?.stream ? (
                  <>
                    <PeerVideo stream={sharerPeer.stream} name={sharerPeer.name}
                      muted={!sharerPeer.audioOn} videoOff={false} />
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <I.Share />
                    <span className="text-sm">{sharerPeer?.name} is presenting...</span>
                  </div>
                )}
                {/* "Presenting" label */}
                <div className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium"
                  style={{ background: sharer === 'self' ? 'rgba(59,130,246,0.85)' : 'rgba(255,255,255,0.12)', color: 'white' }}>
                  {sharer === 'self' ? 'You are presenting' : `${sharerPeer?.name} is presenting`}
                </div>
              </div>

              {/* Sidebar thumbnails */}
              <div className="w-44 flex flex-col gap-2 overflow-y-auto flex-shrink-0">
                {/* Self cam */}
                <div className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: '4/3', background: '#1a1d23' }}>
                  <SelfThumb localStreamRef={localStream} videoOn={videoOn} name={user?.name} audioOn={audioOn} streamReady={localStreamReady} />
                </div>
                {/* Remote peers */}
                {peerList.map(([sid, p]) => (
                  <div key={sid} className={`relative rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 ${sharer === sid ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ aspectRatio: '4/3', background: '#1a1d23' }}>
                    <PeerVideo stream={p.stream} name={p.name} muted={!p.audioOn} videoOff={!p.videoOn} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // ── Normal grid ─────────────────────────────────────────────────
            <div className={`flex-1 grid ${grid} gap-2.5 min-h-0`}>
              {/* Local tile */}
              <div className="relative rounded-xl overflow-hidden flex items-center justify-center min-h-0"
                style={{ background: '#1a1d23' }}>
                <LocalVideo localStreamRef={localStream} screenStreamRef={screenStream}
                  screenOnRef={screenOnRef} screenOn={screenOn} videoOn={videoOn} name={user?.name} streamReady={localStreamReady} />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                  {isHost && <span title="Host" style={{ color: '#f59e0b' }}><I.Crown /></span>}
                  <span className="text-white text-xs font-medium">{user?.name} (you)</span>
                </div>
                {!audioOn && (
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-red-400">
                    <I.MicOff />
                  </div>
                )}
              </div>
              {/* Remote tiles */}
              {peerList.map(([sid, p]) => (
                <div key={sid} className="relative min-h-0">
                  <PeerVideo stream={p.stream} name={p.name} muted={!p.audioOn} videoOff={!p.videoOn} />
                  {p.sharing && (
                    <div className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.85)', color: 'white' }}>
                      presenting
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-center gap-1.5 border-t"
          style={{ background: '#12151d', borderColor: '#1e2330' }}>
          <Btn onClick={toggleAudio} icon={audioOn ? <I.MicOn /> : <I.MicOff />}
            label={audioOn ? 'Mute' : 'Unmute'} active={audioOn} danger={!audioOn} />
          <Btn onClick={toggleVideo} icon={videoOn ? <I.CamOn /> : <I.CamOff />}
            label={videoOn ? 'Camera' : 'Cam off'} active={videoOn} danger={!videoOn} />
          <Btn onClick={toggleScreen} icon={screenOn ? <I.StopShare /> : <I.Share />}
            label={screenOn ? 'Stop' : 'Share'} active={!screenOn} accent={screenOn} />
          <span className="w-px h-8 mx-1" style={{ background: '#1e2330' }} />
          <Btn onClick={() => togglePanel('people')} icon={<I.People />}
            label={`People (${total})`} active={panel !== 'people'} accent={panel === 'people'} />
          <Btn onClick={() => togglePanel('chat')} icon={<I.Chat />}
            label="Chat" active={panel !== 'chat'} accent={panel === 'chat'} badge={unread} />
          <span className="w-px h-8 mx-1" style={{ background: '#1e2330' }} />
          <button onClick={leave}
            className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
            style={{ background: '#e03131', minWidth: 64 }}>
            <I.Leave />
            Leave
          </button>
        </div>
      </div>

      {/* ── Side Panel ── */}
      {panel && (
        <div className="w-72 flex-shrink-0 flex flex-col border-l" style={{ background: '#12151d', borderColor: '#1e2330' }}>
          {/* Tabs */}
          <div className="flex items-center border-b flex-shrink-0" style={{ borderColor: '#1e2330' }}>
            {['people', 'chat'].map(tab => (
              <button key={tab} onClick={() => togglePanel(tab)}
                className="flex-1 py-3 text-sm font-medium transition-colors duration-150 capitalize relative"
                style={{ color: panel === tab ? 'white' : 'rgba(255,255,255,0.35)' }}>
                {tab === 'people' ? `People (${total})` : 'Chat'}
                {panel === tab && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-t" />}
                {tab === 'chat' && unread > 0 && panel !== 'chat' && (
                  <span className="ml-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
                )}
              </button>
            ))}
            <button onClick={() => setPanel(null)}
              className="px-3 text-white/30 hover:text-white transition-colors duration-150 py-3">
              <I.Close />
            </button>
          </div>

          {/* People panel */}
          {panel === 'people' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {allPeople.map(p => (
                <div key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-100 group"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="relative">
                    <Avatar name={p.name} size="sm" />
                    {p.isHostUser && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                        <I.Crown />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/85 truncate">{p.name}{p.id === 'self' ? ' (you)' : ''}</p>
                    {p.isHostUser && <p className="text-xs" style={{ color: '#f59e0b' }}>Host</p>}
                  </div>
                  {/* Media status */}
                  <div className="flex items-center gap-1.5 text-white/30">
                    {!p.audioOn && <span className="text-red-400"><I.MicOff /></span>}
                    {p.videoOn === false && <I.CamOff />}
                    {p.sharing && <span className="text-blue-400"><I.Share /></span>}
                  </div>
                  {/* Host controls (only shown to host, not for self) */}
                  {isHost && p.id !== 'self' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button onClick={() => hostMute(p.sid)} title="Mute"
                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors duration-150">
                        <I.MuteUser />
                      </button>
                      <button onClick={() => { if (confirm(`Remove ${p.name} from the meeting?`)) hostKick(p.sid); }}
                        title="Remove" className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-red-500 transition-colors duration-150">
                        <I.Kick />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Chat panel */}
          {panel === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 mt-12 text-white/20">
                    <I.Chat />
                    <span className="text-xs">No messages yet</span>
                  </div>
                )}
                {messages.map(m => {
                  const mine = m.socketId === sock.current?.id;
                  return (
                    <div key={m.id} className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.name} · {m.time}</span>
                      <span className="px-3 py-2 rounded-2xl text-sm max-w-[88%] break-words leading-snug"
                        style={{
                          background: mine ? '#2f5bcd' : '#1e2330',
                          color: mine ? 'white' : 'rgba(255,255,255,0.8)',
                          borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        }}>
                        {m.message}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatBottom} />
              </div>
              <div className="p-3 flex gap-2 flex-shrink-0 border-t" style={{ borderColor: '#1e2330' }}>
                <input
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none min-w-0 transition-all duration-150 focus:ring-1 focus:ring-blue-500/50"
                  style={{ background: '#1e2330', border: '1px solid #2a2f3d', placeholder: 'rgba(255,255,255,0.3)' }}
                  placeholder="Send a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                />
                <button onClick={sendChat}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium hover:brightness-110 active:scale-[0.97] transition-all duration-150 flex-shrink-0"
                  style={{ background: '#2f5bcd' }}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: 'fadeUp 0.2s ease-out' }}>
          <div className="text-white text-xs px-5 py-2.5 rounded-full shadow-xl"
            style={{ background: '#1e2330', border: '1px solid #2a2f3d', backdropFilter: 'blur(8px)' }}>
            {toast}
          </div>
        </div>
      )}

      {/* Unmute request banner */}
      {unmuteReq && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl"
          style={{ background: '#1e2330', border: '1px solid #2a2f3d' }}>
          <span className="text-sm text-white/80">Host is asking you to unmute</span>
          <button onClick={() => { setUnmuteReq(false); if (!audioOn) toggleAudio(); }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 hover:brightness-110"
            style={{ background: '#2f5bcd', color: 'white' }}>
            Unmute
          </button>
          <button onClick={() => setUnmuteReq(false)}
            className="text-white/30 hover:text-white transition-colors duration-150">
            <I.Close />
          </button>
        </div>
      )}

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); }}`}</style>
    </div>
  );
}
