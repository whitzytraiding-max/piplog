import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';

export default function PipPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    api.get('/pip/messages').then(r => setMessages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text, id: Date.now() }]);
    setLoading(true);
    try {
      const { data } = await api.post('/pip/chat', { message: text });
      setMessages(m => [...m, { role: 'assistant', content: data.reply, id: Date.now() + 1 }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Mrrrow... something went wrong. Try again.", id: Date.now() + 1 }]);
    }
    setLoading(false);
  };

  const SUGGESTIONS = [
    "Why do I keep losing on Fridays?",
    "Review my last 5 trades",
    "What emotional patterns do you see?",
    "Am I overtrading?",
  ];

  return (
    <div className="pip-page">
      <div className="pip-header">
        <div className="pip-avatar">🐾</div>
        <div>
          <h1 className="page-title">Pip</h1>
          <p className="page-sub">Your AI trading coach — watching every chart</p>
        </div>
      </div>

      <div className="chat-container">
        {messages.length === 0 && (
          <div className="pip-welcome">
            <p className="pip-intro">Mrrrow. I'm Pip. I've been watching your trades. Ask me anything.</p>
            <div className="suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="messages">
          {messages.map((m, i) => (
            <div key={m.id || i} className={`message ${m.role}`}>
              {m.role === 'assistant' && <span className="message-avatar">🐾</span>}
              <div className="message-bubble">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <span className="message-avatar">🐾</span>
              <div className="message-bubble typing">Pip is thinking<span className="dots">...</span></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={send} className="chat-input-form">
        <input
          className="input chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Pip about your trading..."
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
