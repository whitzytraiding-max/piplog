import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, login } from '../lib/auth';
import api from '../lib/api';
import PipLogo from '../components/PipLogo';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const loadGsi = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill' }
      );
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = loadGsi;
    script.async = true;
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const { data } = await api.post('/auth/google', { token: response.credential });
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch {
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mascot"><PipLogo size={72} /></div>
        <h1 className="login-title">PipLog</h1>
        <p className="login-subtitle">Your AI-powered trading journal</p>
        <p className="login-pip-quote">"Every trade tells a story. Let's read yours." — Pip</p>
        <div id="google-btn" className="login-google-btn" />
      </div>
    </div>
  );
}
