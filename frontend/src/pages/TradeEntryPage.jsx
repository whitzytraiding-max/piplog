import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

const SESSIONS = ['london', 'new_york', 'asian', 'overlap'];
const EMOTIONS = ['confident', 'anxious', 'FOMO', 'revenge', 'patient', 'bored', 'disciplined'];

const EMPTY_FORM = {
  asset: '', direction: 'long', entry_price: '', exit_price: '',
  stop_loss: '', take_profit: '', rr_planned: '', rr_actual: '',
  result: '', pnl: '', session: '', setup_type: '', emotional_state: '',
  pre_note: '', post_note: '', trade_date: new Date().toISOString().split('T')[0],
  screenshots: [],
};

export default function TradeEntryPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef();

  const [mode, setMode] = useState(isEdit ? 'wizard' : 'select');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pipText, setPipText] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/trades/${id}`).then(r => {
        const t = r.data;
        setForm({
          ...EMPTY_FORM, ...t,
          screenshots: t.screenshots || [],
          entry_price: t.entry_price ?? '',
          exit_price: t.exit_price ?? '',
          stop_loss: t.stop_loss ?? '',
          take_profit: t.take_profit ?? '',
          rr_planned: t.rr_planned ?? '',
          rr_actual: t.rr_actual ?? '',
          pnl: t.pnl ?? '',
          result: t.result ?? '',
          session: t.session ?? '',
          setup_type: t.setup_type ?? '',
          emotional_state: t.emotional_state ?? '',
          pre_note: t.pre_note ?? '',
          post_note: t.post_note ?? '',
        });
      }).catch(() => navigate('/trades'));
    }
  }, [id, isEdit, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('screenshot', file);
    try {
      const { data } = await api.post('/trades/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, screenshots: [...f.screenshots, data.url] }));
      setUploading(false);
      setScanning(true);
      try {
        const { data: scan } = await api.post('/trades/analyze-chart', { imageUrl: data.url });
        setForm(f => ({
          ...f,
          asset: f.asset || scan.asset || '',
          direction: scan.direction || f.direction,
          entry_price: f.entry_price || (scan.entry_price != null ? String(scan.entry_price) : ''),
          exit_price: f.exit_price || (scan.exit_price != null ? String(scan.exit_price) : ''),
          stop_loss: f.stop_loss || (scan.stop_loss != null ? String(scan.stop_loss) : ''),
          take_profit: f.take_profit || (scan.take_profit != null ? String(scan.take_profit) : ''),
          result: f.result || scan.result || '',
          setup_type: f.setup_type || scan.setup_type || '',
          session: f.session || scan.session || '',
        }));
        setScanDone(true);
      } catch {
        // scan failed silently, still proceed
      }
      setScanning(false);
      setMode('wizard');
      setStep(0);
    } catch {
      alert('Upload failed');
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!pipText.trim()) return;
    setExtracting(true);
    try {
      const { data } = await api.post('/pip/extract-trade', { description: pipText });
      setForm(f => ({
        ...f,
        asset: data.asset || '',
        direction: data.direction || 'long',
        entry_price: data.entry_price != null ? String(data.entry_price) : '',
        exit_price: data.exit_price != null ? String(data.exit_price) : '',
        stop_loss: data.stop_loss != null ? String(data.stop_loss) : '',
        take_profit: data.take_profit != null ? String(data.take_profit) : '',
        rr_planned: data.rr_planned != null ? String(data.rr_planned) : '',
        rr_actual: data.rr_actual != null ? String(data.rr_actual) : '',
        result: data.result || '',
        pnl: data.pnl != null ? String(data.pnl) : '',
        session: data.session || '',
        setup_type: data.setup_type || '',
        emotional_state: data.emotional_state || '',
        pre_note: data.pre_note || '',
      }));
      setMode('wizard');
      setStep(0);
    } catch {
      alert('Pip could not extract the trade. Try again or fill it in manually.');
    }
    setExtracting(false);
  };

  const handleSave = async () => {
    if (!form.asset.trim()) { alert('Asset is required'); return; }
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

  const TOTAL_STEPS = 6;
  const canNext = () => {
    if (step === 0) return form.asset.trim().length > 0;
    return true;
  };

  // ── SELECT MODE ──────────────────────────────────
  if (mode === 'select') {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Log a Trade</h1>
        </div>
        <div className="entry-method-grid">
          <button className="entry-method-card" onClick={() => setMode('screenshot')}>
            <div className="entry-method-icon">📸</div>
            <div className="entry-method-title">Upload Chart</div>
            <div className="entry-method-desc">Drop your screenshot — Pip reads it and fills in the details for you</div>
          </button>
          <button className="entry-method-card" onClick={() => setMode('tellpip')}>
            <div className="entry-method-icon">💬</div>
            <div className="entry-method-title">Tell Pip</div>
            <div className="entry-method-desc">Describe your trade in plain English — Pip pulls out all the details</div>
          </button>
        </div>
        <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => { setMode('wizard'); setStep(0); }}>
          Fill in manually →
        </button>
      </div>
    );
  }

  // ── SCREENSHOT MODE ──────────────────────────────
  if (mode === 'screenshot') {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-ghost" onClick={() => setMode('select')}>← Back</button>
        </div>
        {!uploading && !scanning && (
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            <div className="upload-zone-icon">🐾</div>
            <div className="upload-zone-title">Drop your chart here</div>
            <div className="upload-zone-sub">Pip will read it and fill everything in</div>
            <button className="btn-primary" type="button">Choose File</button>
          </div>
        )}
        {uploading && (
          <div className="upload-zone">
            <div className="scan-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <div className="upload-zone-title">Uploading...</div>
          </div>
        )}
        {scanning && (
          <div className="upload-zone">
            <div className="upload-zone-icon" style={{ fontSize: 56 }}>🐾</div>
            <div className="upload-zone-title">Pip is reading your chart...</div>
            <div className="upload-zone-sub">This takes a few seconds</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
      </div>
    );
  }

  // ── TELL PIP MODE ────────────────────────────────
  if (mode === 'tellpip') {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Tell Pip</h1>
          <button className="btn-ghost" onClick={() => setMode('select')}>← Back</button>
        </div>
        <div className="form-section">
          <p className="form-hint">Describe your trade in plain English. Include the asset, direction, prices, result — whatever you remember.</p>
          <div className="form-field">
            <textarea
              className="input textarea tellpip-textarea"
              value={pipText}
              onChange={e => setPipText(e.target.value)}
              placeholder={"e.g. Long EURUSD at 1.0850, got stopped at 1.0820 for a $30 loss. It was a New York session breakout but I entered too early and was feeling impatient."}
              rows={6}
              autoFocus
            />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleExtract} disabled={extracting || !pipText.trim()}>
              {extracting ? 'Pip is reading...' : 'Let Pip Extract →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── WIZARD MODE ──────────────────────────────────
  return (
    <div className="wizard-page">
      <div className="wizard-progress">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`wizard-dot${i < step ? ' done' : i === step ? ' active' : ''}`} />
        ))}
      </div>

      {/* Step 0: Asset + Date */}
      {step === 0 && (
        <div className="wizard-step">
          <div className="wizard-label">What did you trade?</div>
          {scanDone && <div className="scan-banner filled">🐾 Pip read your chart — review the pre-filled details</div>}
          <div className="form-field">
            <label>Asset / Pair *</label>
            <input className="input" style={{ fontSize: 20, fontWeight: 700 }} value={form.asset} onChange={e => set('asset', e.target.value.toUpperCase())} placeholder="EURUSD, XAUUSD, BTC..." autoFocus />
          </div>
          <div className="form-field">
            <label>Date</label>
            <input className="input" type="date" value={form.trade_date} onChange={e => set('trade_date', e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 1: Direction */}
      {step === 1 && (
        <div className="wizard-step">
          <div className="wizard-label">Which way?</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className={`wizard-big-toggle${form.direction === 'long' ? ' active long' : ''}`} onClick={() => set('direction', 'long')}>
              📈 Long
            </button>
            <button className={`wizard-big-toggle${form.direction === 'short' ? ' active short' : ''}`} onClick={() => set('direction', 'short')}>
              📉 Short
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Result + P&L */}
      {step === 2 && (
        <div className="wizard-step">
          <div className="wizard-label">How did it go?</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {['win', 'loss', 'breakeven'].map(r => (
              <button key={r} className={`wizard-big-toggle${form.result === r ? ` active ${r}` : ''}`} onClick={() => set('result', form.result === r ? '' : r)}>
                {r === 'win' ? '✅ Win' : r === 'loss' ? '❌ Loss' : '➡️ Even'}
              </button>
            ))}
          </div>
          <div className="form-field">
            <label>P&L ($) — optional</label>
            <input className="input" type="number" step="any" value={form.pnl} onChange={e => set('pnl', e.target.value)} placeholder="e.g. -30 or 120" />
          </div>
        </div>
      )}

      {/* Step 3: Prices */}
      {step === 3 && (
        <div className="wizard-step">
          <div className="wizard-label">Prices — optional</div>
          <div className="form-grid">
            <div className="form-field"><label>Entry</label><input className="input" type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} placeholder="0.00" /></div>
            <div className="form-field"><label>Exit</label><input className="input" type="number" step="any" value={form.exit_price} onChange={e => set('exit_price', e.target.value)} placeholder="0.00" /></div>
            <div className="form-field"><label>Stop Loss</label><input className="input" type="number" step="any" value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)} placeholder="0.00" /></div>
            <div className="form-field"><label>Take Profit</label><input className="input" type="number" step="any" value={form.take_profit} onChange={e => set('take_profit', e.target.value)} placeholder="0.00" /></div>
            <div className="form-field"><label>R:R Planned</label><input className="input" type="number" step="any" value={form.rr_planned} onChange={e => set('rr_planned', e.target.value)} placeholder="2.0" /></div>
            <div className="form-field"><label>R:R Actual</label><input className="input" type="number" step="any" value={form.rr_actual} onChange={e => set('rr_actual', e.target.value)} placeholder="1.5" /></div>
          </div>
        </div>
      )}

      {/* Step 4: Context */}
      {step === 4 && (
        <div className="wizard-step">
          <div className="wizard-label">Set the scene.</div>
          <div className="form-field">
            <label>Session</label>
            <div className="chip-group">
              {SESSIONS.map(s => (
                <button key={s} type="button" className={form.session === s ? 'chip active' : 'chip'} onClick={() => set('session', form.session === s ? '' : s)}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Setup Type</label>
            <input className="input" value={form.setup_type} onChange={e => set('setup_type', e.target.value)} placeholder="Breakout, Reversal, Order Block..." />
          </div>
          <div className="form-field">
            <label>Emotional State</label>
            <div className="chip-group">
              {EMOTIONS.map(em => (
                <button key={em} type="button" className={form.emotional_state === em ? 'chip active' : 'chip'} onClick={() => set('emotional_state', form.emotional_state === em ? '' : em)}>
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Journal */}
      {step === 5 && (
        <div className="wizard-step">
          <div className="wizard-label">Write it down.</div>
          <div className="form-field">
            <label>Why did you take this trade?</label>
            <textarea className="input textarea" value={form.pre_note} onChange={e => set('pre_note', e.target.value)} placeholder="What setup did you see? What was your thesis?" rows={3} />
          </div>
          <div className="form-field">
            <label>What happened?</label>
            <textarea className="input textarea" value={form.post_note} onChange={e => set('post_note', e.target.value)} placeholder="What went right or wrong? What would you do differently?" rows={3} />
          </div>
          <div className="form-field">
            <label>Screenshots</label>
            <div className="screenshots-grid">
              {form.screenshots.map(url => (
                <div key={url} className="screenshot-thumb">
                  <img src={url} alt="chart" />
                  <button type="button" className="screenshot-remove" onClick={() => set('screenshots', form.screenshots.filter(s => s !== url))}>×</button>
                </div>
              ))}
              <button type="button" className="screenshot-add" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? '...' : '+ Add'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files[0]; if (!file) return;
              setUploading(true);
              const fd = new FormData(); fd.append('screenshot', file);
              try {
                const { data } = await api.post('/trades/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                set('screenshots', [...form.screenshots, data.url]);
              } catch { alert('Upload failed'); }
              setUploading(false);
            }} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="wizard-footer">
        <button className="btn-ghost" onClick={() => {
          if (step === 0) {
            if (isEdit) navigate(-1);
            else setMode('select');
          } else {
            setStep(s => s - 1);
          }
        }}>
          {step === 0 && !isEdit ? '← Methods' : step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < TOTAL_STEPS - 1 ? (
          <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
            Continue →
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Trade' : 'Save Trade'}
          </button>
        )}
      </div>
    </div>
  );
}
