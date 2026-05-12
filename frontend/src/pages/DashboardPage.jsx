import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getUser } from '../lib/auth';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const user = getUser();

  useEffect(() => {
    api.get('/trades/stats/summary').then(r => setStats(r.data)).catch(() => {});
    api.get('/trades').then(r => setRecentTrades(r.data.slice(0, 5))).catch(() => {});
  }, []);

  const getWeeklyAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const { data } = await api.get('/pip/weekly');
      setWeeklyAnalysis(data.analysis);
    } catch {
      setWeeklyAnalysis("Pip is napping. Try again later.");
    }
    setLoadingAnalysis(false);
  };

  const resultColor = (r) => r === 'win' ? '#22c55e' : r === 'loss' ? '#ef4444' : '#f59e0b';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good trading, {user?.name?.split(' ')[0]} 🐾</h1>
          <p className="page-sub">Here's what Pip sees in your journal</p>
        </div>
        <Link to="/trades/new" className="btn-primary">+ Log Trade</Link>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.win_rate}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Trades</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: stats.wins > stats.losses ? '#22c55e' : '#ef4444' }}>
              {stats.wins}W / {stats.losses}L
            </div>
            <div className="stat-label">Win / Loss</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg_rr ? `${stats.avg_rr}R` : '—'}</div>
            <div className="stat-label">Avg R:R</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: stats.total_pnl >= 0 ? '#22c55e' : '#ef4444' }}>
              {stats.total_pnl ? `$${Number(stats.total_pnl).toFixed(2)}` : '—'}
            </div>
            <div className="stat-label">Total P&L</div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Recent Trades</h2>
            <Link to="/trades" className="link-sm">View all →</Link>
          </div>
          {recentTrades.length === 0 ? (
            <p className="empty-state">No trades yet. <Link to="/trades/new">Log your first one.</Link></p>
          ) : (
            <div className="trade-list">
              {recentTrades.map(t => (
                <Link to={`/trades/${t.id}`} key={t.id} className="trade-row">
                  <div className="trade-row-left">
                    <span className="trade-asset">{t.asset}</span>
                    <span className="trade-direction">{t.direction}</span>
                  </div>
                  <div className="trade-row-right">
                    <span className="trade-date">{new Date(t.trade_date).toLocaleDateString()}</span>
                    <span className="trade-result" style={{ color: resultColor(t.result) }}>
                      {t.result?.toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card pip-card">
          <div className="card-header">
            <h2>🐾 Pip's Weekly Report</h2>
          </div>
          {weeklyAnalysis ? (
            <p className="pip-analysis">{weeklyAnalysis}</p>
          ) : (
            <div className="pip-prompt">
              <p>Pip has been watching your charts. Want the weekly breakdown?</p>
              <button onClick={getWeeklyAnalysis} disabled={loadingAnalysis} className="btn-primary">
                {loadingAnalysis ? 'Pip is thinking...' : 'Get Weekly Analysis'}
              </button>
            </div>
          )}
          <Link to="/pip" className="link-sm" style={{ marginTop: '12px', display: 'block' }}>Chat with Pip →</Link>
        </div>
      </div>
    </div>
  );
}
