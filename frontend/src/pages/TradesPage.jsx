import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const RESULT_COLOR = { win: '#22c55e', loss: '#ef4444', breakeven: '#f59e0b' };

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/trades').then(r => setTrades(r.data)).catch(() => {});
  }, []);

  const filtered = trades.filter(t => {
    if (filter !== 'all' && t.result !== filter) return false;
    if (search && !t.asset.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Trade Journal</h1>
        <Link to="/trades/new" className="btn-primary">+ Log Trade</Link>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search asset..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
        />
        <div className="filter-tabs">
          {['all', 'win', 'loss', 'breakeven'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'filter-tab active' : 'filter-tab'}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-full">
          <div className="empty-icon">🐾</div>
          <p>No trades found. Pip is waiting for your journal entries.</p>
          <Link to="/trades/new" className="btn-primary">Log First Trade</Link>
        </div>
      ) : (
        <div className="trades-grid">
          {filtered.map(t => (
            <Link to={`/trades/${t.id}`} key={t.id} className="trade-card">
              <div className="trade-card-header">
                <div>
                  <span className="trade-asset-lg">{t.asset}</span>
                  <span className={`direction-badge ${t.direction}`}>{t.direction}</span>
                </div>
                <span className="result-badge" style={{ background: RESULT_COLOR[t.result] + '22', color: RESULT_COLOR[t.result] }}>
                  {t.result?.toUpperCase() || '—'}
                </span>
              </div>
              {t.screenshots?.length > 0 && (
                <img src={t.screenshots[0]} alt="trade chart" className="trade-card-img" />
              )}
              <div className="trade-card-body">
                <div className="trade-meta">
                  <span>{new Date(t.trade_date).toLocaleDateString()}</span>
                  {t.session && <span className="tag">{t.session}</span>}
                  {t.setup_type && <span className="tag">{t.setup_type}</span>}
                </div>
                {t.rr_actual && <div className="trade-rr">{t.rr_actual}R</div>}
                {t.post_note && <p className="trade-note">{t.post_note.slice(0, 100)}{t.post_note.length > 100 ? '...' : ''}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
