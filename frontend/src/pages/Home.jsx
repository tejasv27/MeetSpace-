import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  useEffect(() => { axios.get('/api/meetings').then(r => setRecent(r.data)).catch(() => {}); }, []);

  const createMeeting = async () => {
    setLoading(true); setError('');
    try { const { data } = await axios.post('/api/meetings'); navigate(`/meeting/${data.roomId}`); }
    catch { setError('Failed to create meeting'); setLoading(false); }
  };

  const joinMeeting = async e => {
    e.preventDefault();
    const id = joinId.trim().toUpperCase();
    if (!id) return; setError('');
    try { await axios.get(`/api/meetings/${id}`); navigate(`/meeting/${id}`); }
    catch { setError('Room not found. Double-check the ID.'); }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#0e1117' }}>
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: '#1e2330', background: '#12151d' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="font-semibold text-white">MeetApp</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.name}</span>
          <button onClick={logout} className="transition-colors duration-150 hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign out</button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-14">
        <h2 className="text-lg font-semibold text-white mb-6">Start or join a meeting</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl p-5 border" style={{ background: '#12151d', borderColor: '#1e2330' }}>
            <p className="font-medium text-white text-sm mb-1">New meeting</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Start an instant call</p>
            <button onClick={createMeeting} disabled={loading}
              className="w-full py-2 rounded-xl text-white text-sm font-medium transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{ background: '#2f5bcd' }}>
              {loading ? 'Creating...' : 'Start now'}
            </button>
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: '#12151d', borderColor: '#1e2330' }}>
            <p className="font-medium text-white text-sm mb-1">Join a meeting</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Enter a room code</p>
            <form onSubmit={joinMeeting} className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/25 outline-none min-w-0 focus:ring-1 focus:ring-blue-500/50 transition-all"
                style={{ background: '#1e2330', border: '1px solid #2a2f3d' }}
                placeholder="XXX-XXX-XXX"
                value={joinId}
                onChange={e => { setJoinId(e.target.value); setError(''); }}
                maxLength={11}
              />
              <button type="submit"
                className="px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-colors duration-150 border"
                style={{ border: '1px solid #2a2f3d', background: 'transparent' }}>
                Join
              </button>
            </form>
          </div>
        </div>

        {error && <p className="text-sm mb-4" style={{ color: '#ff6b6b' }}>{error}</p>}

        {recent.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Recent meetings</p>
            <div className="rounded-2xl overflow-hidden border divide-y" style={{ background: '#12151d', borderColor: '#1e2330', '--tw-divide-opacity': 1 }}>
              {recent.map(m => (
                <div key={m._id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors duration-100"
                  style={{ borderColor: '#1e2330' }}>
                  <div>
                    <span className="font-mono text-sm text-white">{m.roomId}</span>
                    <span className="text-xs ml-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button onClick={() => navigate(`/meeting/${m.roomId}`)}
                    className="text-xs font-medium transition-colors duration-150 hover:text-blue-300"
                    style={{ color: '#74c0fc' }}>
                    Rejoin →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
