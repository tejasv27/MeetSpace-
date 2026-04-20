import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const switchMode = () => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); };

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await signup(form.name, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    background: '#1e2330', border: '1px solid #2a2f3d', color: 'white', width: '100%',
    borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0e1117' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-semibold text-white">MeetApp</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {mode === 'login' ? 'Sign in to start a meeting' : 'Sign up for free'}
          </p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: '#12151d', borderColor: '#1e2330' }}>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Name</label>
                <input style={inputStyle} type="text" placeholder="Your name" value={form.name} onChange={handle('name')} required />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
              <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={handle('email')} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
              <input style={inputStyle} type="password" placeholder="Min. 6 characters" value={form.password} onChange={handle('password')} minLength={6} required />
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(240,62,62,0.1)', border: '1px solid rgba(240,62,62,0.3)', color: '#ff6b6b' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ background: '#2f5bcd' }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} className="font-medium transition-colors duration-150" style={{ color: '#74c0fc' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
