import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, login } from '../lib/auth';
import api from '../lib/api';
import PipLogo from '../components/PipLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getToken()) navigate('/', { replace: true });
  }, [navigate]);

  // Google GSI — only load on web (won't work in WebView but won't break either)
  useEffect(() => {
    const loadGsi = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      const btn = document.getElementById('google-btn');
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill',
        });
      }
    };
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = loadGsi;
    script.async = true;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const { data } = await api.post('/auth/google', { token: response.credential });
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch {
      setError('Google sign-in failed. Use email instead.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload = mode === 'register' ? { email, password, name } : { email, password };
      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mascot"><PipLogo size={72} /></div>
        <h1 className="login-title">PipLog</h1>
        <p className="login-subtitle">Your AI-powered trading journal</p>
        <p className="login-pip-quote">"Every trade tells a story. Let's read yours." — Pip</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
          {error && <p className="login-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          className="btn-ghost"
          style={{ fontSize: 13 }}
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>

        <div className="login-divider"><span>or</span></div>
        <div id="google-btn" className="login-google-btn" />
      </div>
    </div>
  );
}
