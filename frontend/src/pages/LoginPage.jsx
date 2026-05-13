import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { getToken, login } from '../lib/auth';
import api from '../lib/api';
import PipLogo from '../components/PipLogo';

const isNative = Capacitor.isNativePlatform();

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [error, setError] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (getToken()) navigate('/', { replace: true });
  }, [navigate]);

  // Web-only: load Google GSI button
  useEffect(() => {
    if (isNative) return;
    const loadGsi = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const { data } = await api.post('/auth/google', { token: response.credential });
            login(data.token, data.user);
            navigate('/', { replace: true });
          } catch {
            setError('Google sign-in failed. Use email instead.');
          }
        },
      });
      const btn = document.getElementById('google-btn');
      if (btn) window.google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', shape: 'pill' });
    };
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = loadGsi;
    script.async = true;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [navigate]);

  const handleNativeGoogle = async () => {
    setSocialLoading('google');
    setError('');
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.initialize();
      const result = await GoogleAuth.signIn();
      const idToken = result.authentication.idToken;
      const { data } = await api.post('/auth/google', { token: idToken });
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      if (err?.message !== 'The user canceled the sign-in flow.') {
        setError(err?.message || 'Google sign-in failed.');
      }
    }
    setSocialLoading('');
  };

  const handleApple = async () => {
    setSocialLoading('apple');
    setError('');
    try {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
      const result = await SignInWithApple.authorize({
        clientId: 'com.piplog.app',
        redirectURI: 'https://piplog.onrender.com',
        scopes: 'email name',
        state: '',
        nonce: '',
      });
      const r = result.response;
      const { data } = await api.post('/auth/apple', {
        identityToken: r.identityToken,
        firstName: r.givenName,
        lastName: r.familyName,
        email: r.email,
      });
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      if (!err?.message?.includes('AuthorizationError error 1001')) {
        setError(err?.response?.data?.error || err?.message || 'Apple sign-in failed.');
      }
    }
    setSocialLoading('');
  };

  const handleEmailSubmit = async (e) => {
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
      setError(err.response?.data?.error || 'Something went wrong.');
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

        {/* Native social buttons (iOS app) */}
        {isNative && (
          <div className="social-btns">
            {/* Google native requires CocoaPods — revisit when plugin adds SPM support */}
            <button className="social-btn google-btn" onClick={handleNativeGoogle} disabled={!!socialLoading} style={{display:'none'}}>
              {socialLoading === 'google' ? <span className="social-spinner" /> : (
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              )}
              <span>Continue with Google</span>
            </button>
            <button className="social-btn apple-btn" onClick={handleApple} disabled={!!socialLoading}>
              {socialLoading === 'apple' ? <span className="social-spinner" /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              )}
              <span>Continue with Apple</span>
            </button>
            <div className="login-divider"><span>or</span></div>
          </div>
        )}

        {/* Email form */}
        {(!isNative || showEmail) ? (
          <form className="login-form" onSubmit={handleEmailSubmit}>
            {mode === 'register' && (
              <input className="input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            )}
            <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
            {error && <p className="login-error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? '...' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
            <button type="button" className="btn-ghost" style={{ fontSize: 13 }} onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            {isNative && <button type="button" className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowEmail(false)}>← Back</button>}
          </form>
        ) : (
          <>
            {error && <p className="login-error">{error}</p>}
            <button className="btn-ghost" style={{ fontSize: 13, marginTop: 4 }} onClick={() => setShowEmail(true)}>
              Sign in with Email
            </button>
          </>
        )}

        {/* Web Google button */}
        {!isNative && (
          <>
            <div className="login-divider"><span>or</span></div>
            <div id="google-btn" className="login-google-btn" />
          </>
        )}
      </div>
    </div>
  );
}
