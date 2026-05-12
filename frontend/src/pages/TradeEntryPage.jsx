import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

const SESSIONS = ['london', 'new_york', 'asian', 'overlap'];
const EMOTIONS = ['confident', 'anxious', 'FOMO', 'revenge', 'patient', 'bored', 'disciplined'];
const RESULTS = ['win', 'loss', 'breakeven'];

export default function TradeEntryPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    asset: '', direction: 'long', entry_price: '', exit_price: '',
    stop_loss: '', take_profit: '', rr_planned: '', rr_actual: '',
    result: '', pnl: '', session: '', setup_type: '', emotional_state: '',
    pre_note: '', post_note: '', trade_date: new Date().toISOString().split('T')[0],
    screenshots: [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanState, setScanState] = useState(null); // null | 'scanning' | 'filled' | 'error'

  useEffect(() => {
    if (isEdit) {
      api.get(`/trades/${id}`).then(r => setForm(r.data)).catch(() => navigate('/trades'));
    }
  }, [id, isEdit, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleScreenshot = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('screenshot', file);
    try {
      const { data } = await api.post('/trades/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!isEdit && form.screenshots.length === 0) {
        setScanState('scanning');
        try {
          const { data: scan } = await api.post('/trades/analyze-chart', { imageUrl: data.url });
          setForm(f => ({
            ...f,
            screenshots: [...f.screenshots, data.url],
            asset: f.asset || (scan.asset || ''),
            direction: f.direction || (scan.direction || 'long'),
            entry_price: f.entry_price || (scan.entry_price != null ? String(scan.entry_price) : ''),
            exit_price: f.exit_price || (scan.exit_price != null ? String(scan.exit_price) : ''),
            stop_loss: f.stop_loss || (scan.stop_loss != null ? String(scan.stop_loss) : ''),
            take_profit: f.take_profit || (scan.take_profit != null ? String(scan.take_profit) : ''),
            result: f.result || (scan.result || ''),
            setup_type: f.setup_type || (scan.setup_type || ''),
            session: f.session || (scan.session || ''),
          }));
          setScanState('filled');
        } catch {
          set('screenshots', [...form.screenshots, data.url]);
          setScanState('error');
        }
      } else {
        set('screenshots', [...form.screenshots, data.url]);
      }
    } catch {
      alert('Upload failed');
    }
    setUploading(false);
  };

  const removeScreenshot = (url) => {
    set('screenshots', form.screenshots.filter(s => s !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/trades/${id}`, form);
      } else {
        await api.post('/trades', form);
      }
      navigate('/trades');
    } catch {
      alert('Failed to save trade');
    }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Trade' : 'Log a Trade'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="trade-form">
        <div className="form-section">
          <h3>Trade Details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Asset / Pair *</label>
              <input className="input" value={form.asset} onChange={e => set('asset', e.target.value.toUpperCase())} placeholder="EURUSD, BTC, AAPL..." required />
            </div>
            <div className="form-field">
              <label>Date *</label>
              <input className="input" type="date" value={form.trade_date} onChange={e => set('trade_date', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Direction</label>
              <div className="toggle-group">
                <button type="button" className={form.direction === 'long' ? 'toggle active long' : 'toggle'} onClick={() => set('direction', 'long')}>Long</button>
                <button type="button" className={form.direction === 'short' ? 'toggle active short' : 'toggle'} onClick={() => set('direction', 'short')}>Short</button>
              </div>
            </div>
            <div className="form-field">
              <label>Result</label>
              <div className="toggle-group">
                {RESULTS.map(r => (
                  <button key={r} type="button"
                    className={form.result === r ? `toggle active ${r}` : 'toggle'}
                    onClick={() => set('result', r)}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Entry Price</label>
              <input className="input" type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Exit Price</label>
              <input className="input" type="number" step="any" value={form.exit_price} onChange={e => set('exit_price', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Stop Loss</label>
              <input className="input" type="number" step="any" value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Take Profit</label>
              <input className="input" type="number" step="any" value={form.take_profit} onChange={e => set('take_profit', e.target.value)} />
            </div>
            <div className="form-field">
              <label>R:R Planned</label>
              <input className="input" type="number" step="any" value={form.rr_planned} onChange={e => set('rr_planned', e.target.value)} placeholder="2.5" />
            </div>
            <div className="form-field">
              <label>R:R Actual</label>
              <input className="input" type="number" step="any" value={form.rr_actual} onChange={e => set('rr_actual', e.target.value)} placeholder="1.8" />
            </div>
            <div className="form-field">
              <label>P&L ($)</label>
              <input className="input" type="number" step="any" value={form.pnl} onChange={e => set('pnl', e.target.value)} placeholder="-50.00" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Context</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Session</label>
              <select className="input" value={form.session} onChange={e => set('session', e.target.value)}>
                <option value="">Select session</option>
                {SESSIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Setup Type</label>
              <input className="input" value={form.setup_type} onChange={e => set('setup_type', e.target.value)} placeholder="Breakout, Reversal, Trend..." />
            </div>
          </div>
          <div className="form-field">
            <label>Emotional State</label>
            <div className="chip-group">
              {EMOTIONS.map(em => (
                <button key={em} type="button"
                  className={form.emotional_state === em ? 'chip active' : 'chip'}
                  onClick={() => set('emotional_state', form.emotional_state === em ? '' : em)}>
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Journal Notes</h3>
          <div className="form-field">
            <label>Pre-Trade — Why did you take this?</label>
            <textarea className="input textarea" value={form.pre_note} onChange={e => set('pre_note', e.target.value)} placeholder="What setup did you see? What was your thesis?" rows={3} />
          </div>
          <div className="form-field">
            <label>Post-Trade — What happened?</label>
            <textarea className="input textarea" value={form.post_note} onChange={e => set('post_note', e.target.value)} placeholder="What went right or wrong? What would you do differently?" rows={3} />
          </div>
        </div>

        <div className="form-section">
          <h3>Chart Screenshots</h3>
          {scanState && (
            <div className={`scan-banner ${scanState}`}>
              {scanState === 'scanning' && <><div className="scan-spinner" /> Pip is reading your chart...</>}
              {scanState === 'filled' && <>🐾 Pip filled these in — review and adjust if needed</>}
              {scanState === 'error' && <>Pip couldn't read this chart — fill in the details manually</>}
            </div>
          )}
          <div className="screenshots-grid">
            {form.screenshots.map(url => (
              <div key={url} className="screenshot-thumb">
                <img src={url} alt="trade chart" />
                <button type="button" className="screenshot-remove" onClick={() => removeScreenshot(url)}>×</button>
              </div>
            ))}
            <button type="button" className="screenshot-add" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : '+ Add Screenshot'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} style={{ display: 'none' }} />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>
      </form>
    </div>
  );
}
