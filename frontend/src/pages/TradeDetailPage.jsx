import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const RESULT_COLOR = { win: '#22c55e', loss: '#ef4444', breakeven: '#f59e0b' };

export default function TradeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api.get(`/trades/${id}`).then(r => setTrade(r.data)).catch(() => navigate('/trades'));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Delete this trade?')) return;
    await api.delete(`/trades/${id}`);
    navigate('/trades');
  };

  if (!trade) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="page-title">{trade.asset}</h1>
          <span className={`direction-badge ${trade.direction}`}>{trade.direction}</span>
          {trade.result && (
            <span className="result-badge" style={{ background: RESULT_COLOR[trade.result] + '22', color: RESULT_COLOR[trade.result] }}>
              {trade.result.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/trades/${id}/edit`} className="btn-ghost">Edit</Link>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </div>

      {trade.screenshots?.length > 0 && (
        <div className="screenshots-row">
          {trade.screenshots.map(url => (
            <img key={url} src={url} alt="chart" className="detail-screenshot" onClick={() => setLightbox(url)} />
          ))}
        </div>
      )}

      <div className="detail-grid">
        <div className="card">
          <h3>Trade Data</h3>
          <div className="detail-rows">
            <div className="detail-row"><span>Date</span><span>{new Date(trade.trade_date).toLocaleDateString()}</span></div>
            <div className="detail-row"><span>Session</span><span>{trade.session?.replace('_', ' ').toUpperCase() || '—'}</span></div>
            <div className="detail-row"><span>Setup</span><span>{trade.setup_type || '—'}</span></div>
            <div className="detail-row"><span>Emotion</span><span>{trade.emotional_state || '—'}</span></div>
            <div className="detail-row"><span>Entry</span><span>{trade.entry_price || '—'}</span></div>
            <div className="detail-row"><span>Exit</span><span>{trade.exit_price || '—'}</span></div>
            <div className="detail-row"><span>Stop Loss</span><span>{trade.stop_loss || '—'}</span></div>
            <div className="detail-row"><span>Take Profit</span><span>{trade.take_profit || '—'}</span></div>
            <div className="detail-row"><span>R:R Planned</span><span>{trade.rr_planned ? `${trade.rr_planned}R` : '—'}</span></div>
            <div className="detail-row"><span>R:R Actual</span><span>{trade.rr_actual ? `${trade.rr_actual}R` : '—'}</span></div>
            <div className="detail-row">
              <span>P&L</span>
              <span style={{ color: trade.pnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Journal</h3>
          {trade.pre_note && (
            <div className="note-section">
              <div className="note-label">Pre-Trade</div>
              <p className="note-text">{trade.pre_note}</p>
            </div>
          )}
          {trade.post_note && (
            <div className="note-section">
              <div className="note-label">Post-Trade</div>
              <p className="note-text">{trade.post_note}</p>
            </div>
          )}
          {!trade.pre_note && !trade.post_note && <p className="empty-state">No journal notes.</p>}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="chart" />
        </div>
      )}
    </div>
  );
}
