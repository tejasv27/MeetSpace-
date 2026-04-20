import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col text-white" style={{ background: '#0e1117' }}>
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: '#1e2330' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="font-semibold text-white">MeetApp</span>
        </div>
        <button onClick={() => navigate('/login')}
          className="text-sm font-medium px-5 py-2 rounded-xl transition-all duration-150 hover:brightness-110 active:scale-95 text-white"
          style={{ background: '#2f5bcd' }}>
          Sign in
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-8 border" style={{ color: '#74c0fc', borderColor: '#1e3a5f', background: '#0d1f33' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Free to use — no downloads required
          </div>
          <h1 className="text-5xl font-bold text-white mb-5 leading-tight tracking-tight">
            Video calls that<br />
            <span style={{ color: '#74c0fc' }}>just work.</span>
          </h1>
          <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Secure peer-to-peer video meetings with screen sharing,<br />live chat, and instant room creation.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/login')}
              className="font-semibold px-8 py-3 rounded-xl transition-all duration-150 hover:brightness-110 active:scale-95 text-white text-base"
              style={{ background: '#2f5bcd' }}>
              Start a meeting
            </button>
            <button onClick={() => navigate('/login')}
              className="font-medium px-8 py-3 rounded-xl transition-all duration-150 hover:bg-white/5 active:scale-95 text-base border"
              style={{ color: 'rgba(255,255,255,0.7)', borderColor: '#2a2f3d' }}>
              Join with a code
            </button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            { icon: '🎥', title: 'HD Video calls', desc: 'Crystal clear peer-to-peer video with WebRTC, no servers in the middle.' },
            { icon: '🖥️', title: 'Screen sharing', desc: 'Share your screen with auto-layout. Thumbnails adjust automatically.' },
            { icon: '💬', title: 'Live chat', desc: 'Message participants during the call without interrupting anyone.' },
          ].map(f => (
            <div key={f.title} className="rounded-xl p-5 text-left border" style={{ background: '#12151d', borderColor: '#1e2330' }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <p className="font-medium text-white text-sm mb-1.5">{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs border-t" style={{ color: 'rgba(255,255,255,0.2)', borderColor: '#1e2330' }}>
        MeetApp · Built with React, Node.js, WebRTC & Socket.IO
      </footer>
    </div>
  );
}
