import { useState, useEffect } from 'react';
import api from '../lib/api';
import { getUser, login, getToken } from '../lib/auth';

const STYLES = ['day trader', 'swing trader', 'scalper', 'position trader'];
const MARKETS = ['forex', 'crypto', 'stocks', 'futures', 'options', 'indices'];

export default function ProfilePage() {
  const user = getUser();
  const [form, setForm] = useState({
    trading_style: '', markets: [], risk_percent: '', account_balance: '',
    broker: '', trading_rules: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/profile').then(r => {
      const u = r.data;
      setForm({
        trading_style: u.trading_style || '',
        markets: u.markets || [],
        risk_percent: u.risk_percent || '',
        account_balance: u.account_balance || '',
        broker: u.broker || '',
        trading_rules: u.trading_rules || '',
      });
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMarket = (m) => {
    set('markets', form.markets.includes(m)
      ? form.markets.filter(x => x !== m)
      : [...form.markets, m]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/profile', form);
      login(getToken(), { ...user, ...data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user?.avatar && <img src={user.avatar} alt={user.name} style={{ width: 48, height: 48, borderRadius: '50%' }} />}
          <div>
            <h1 className="page-title">{user?.name}</h1>
            <p className="page-sub">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="trade-form">
        <div className="form-section">
          <h3>Trading DNA</h3>
          <div className="form-field">
            <label>Trading Style</label>
            <div className="chip-group">
              {STYLES.map(s => (
                <button key={s} type="button"
                  className={form.trading_style === s ? 'chip active' : 'chip'}
                  onClick={() => set('trading_style', s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Markets I Trade</label>
            <div className="chip-group">
              {MARKETS.map(m => (
                <button key={m} type="button"
                  className={form.markets.includes(m) ? 'chip active' : 'chip'}
                  onClick={() => toggleMarket(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Risk Per Trade (%)</label>
              <input className="input" type="number" step="0.1" value={form.risk_percent} onChange={e => set('risk_percent', e.target.value)} placeholder="1.0" />
            </div>
            <div className="form-field">
              <label>Account Balance ($)</label>
              <input className="input" type="number" step="any" value={form.account_balance} onChange={e => set('account_balance', e.target.value)} placeholder="10000" />
            </div>
            <div className="form-field">
              <label>Broker</label>
              <input className="input" value={form.broker} onChange={e => set('broker', e.target.value)} placeholder="IC Markets, Pepperstone..." />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>My Trading Rules</h3>
          <p className="form-hint">Pip reads this when giving you feedback. Be specific.</p>
          <div className="form-field">
            <textarea
              className="input textarea"
              value={form.trading_rules}
              onChange={e => set('trading_rules', e.target.value)}
              placeholder="1. Only trade London and NY sessions&#10;2. Never risk more than 1% per trade&#10;3. No trading after 3 consecutive losses..."
              rows={8}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
