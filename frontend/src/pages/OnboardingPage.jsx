import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getUser, getToken, login } from '../lib/auth';
import PipLogo from '../components/PipLogo';

const STYLE_OPTIONS = [
  { label: 'Day Trader', value: 'day trader' },
  { label: 'Swing Trader', value: 'swing trader' },
  { label: 'Scalper', value: 'scalper' },
  { label: 'Position Trader', value: 'position trader' },
];

const MARKET_OPTIONS = ['Forex', 'Crypto', 'Stocks', 'Futures', 'Options', 'Indices'];

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = getUser();
  const firstName = user?.name?.split(' ')[0] || 'you';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trading_style: '',
    markets: [],
    risk_percent: '',
    account_balance: '',
    broker: '',
    trading_rules: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMarket = (market) => {
    setForm(f => ({
      ...f,
      markets: f.markets.includes(market)
        ? f.markets.filter(m => m !== market)
        : [...f.markets, market],
    }));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/profile', form);
      login(getToken(), { ...getUser(), ...data });
      navigate('/');
    } catch {
      alert('Failed to save profile. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot${i <= step ? ' active' : ''}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div>
            <div className="onboarding-mascot"><PipLogo size={64} /></div>
            <h1 className="onboarding-title">I'm Pip.</h1>
            <p className="onboarding-sub">
              I've been waiting for you, {firstName}.<br />
              Let me learn how you trade so I can give you sharper feedback.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <button className="btn-primary" onClick={() => setStep(1)}>
                Let's go →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="onboarding-title">How do you trade?</h1>
            <p className="onboarding-sub" style={{ marginBottom: 24 }}> </p>

            <div className="onboarding-section">
              <div className="onboarding-label">Trading Style</div>
              <div className="chip-group">
                {STYLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`chip${form.trading_style === opt.value ? ' active' : ''}`}
                    onClick={() => set('trading_style', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-section">
              <div className="onboarding-label">Markets I Trade</div>
              <div className="chip-group">
                {MARKET_OPTIONS.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`chip${form.markets.includes(m) ? ' active' : ''}`}
                    onClick={() => toggleMarket(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-footer">
              <button className="btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={!form.trading_style}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="onboarding-title">Let's talk numbers.</h1>
            <p className="onboarding-sub">Pip uses this to put your trades in context.</p>

            <div className="onboarding-section">
              <div className="form-field" style={{ marginBottom: 12 }}>
                <label className="onboarding-label">Risk Per Trade (%)</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  placeholder="e.g. 1"
                  value={form.risk_percent}
                  onChange={e => set('risk_percent', e.target.value)}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 12 }}>
                <label className="onboarding-label">Account Balance ($)</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 10000"
                  value={form.account_balance}
                  onChange={e => set('account_balance', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="onboarding-label">Broker</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. IC Markets, FTMO, Binance..."
                  value={form.broker}
                  onChange={e => set('broker', e.target.value)}
                />
              </div>
            </div>

            <div className="onboarding-footer">
              <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="onboarding-title">Your trading rules.</h1>
            <p className="onboarding-sub">
              Pip will hold you accountable. Be specific — the more detail, the better the feedback.
            </p>

            <div className="onboarding-section">
              <textarea
                className="input textarea"
                rows={8}
                placeholder={"1. Only trade London and NY sessions\n2. Never risk more than 1% per trade\n3. No trading after 3 consecutive losses..."}
                value={form.trading_rules}
                onChange={e => set('trading_rules', e.target.value)}
                style={{ minHeight: 180 }}
              />
            </div>

            <div className="onboarding-footer">
              <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button
                className="btn-primary"
                onClick={handleFinish}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Finish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
