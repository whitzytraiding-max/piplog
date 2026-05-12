import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts';
import api from '../lib/api';
import { getUser } from '../lib/auth';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [equityData, setEquityData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const user = getUser();

  useEffect(() => {
    api.get('/trades/stats/summary').then(r => setStats(r.data)).catch(() => {});
    api.get('/trades/stats/month').then(r => setMonthStats(r.data)).catch(() => {});
    api.get('/trades/stats/equity').then(r => setEquityData(r.data)).catch(() => {});
    api.get('/trades/stats/monthly').then(r => setMonthlyData(r.data)).catch(() => {});
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

      {monthStats && (
        <div className="month-card">
          <div className="month-card-label">This Month</div>
          <div className="month-card-pnl" style={{ color: monthStats.total_pnl >= 0 ? '#10b981' : '#f43f5e' }}>
            {monthStats.total_pnl >= 0 ? '+' : ''}{monthStats.total_pnl ? `$${Number(monthStats.total_pnl).toFixed(2)}` : '$0.00'}
          </div>
          <div className="month-card-meta">
            <span>{monthStats.total} trades</span>
            <span className="month-card-dot">·</span>
            <span>{monthStats.win_rate}% win rate</span>
            <span className="month-card-dot">·</span>
            <span style={{ color: '#10b981' }}>{monthStats.wins}W</span>
            <span> / </span>
            <span style={{ color: '#f43f5e' }}>{monthStats.losses}L</span>
          </div>
        </div>
      )}

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

      {equityData.length > 1 && (() => {
        const last = Number(equityData[equityData.length - 1].cumulative_pnl);
        const isUp = last >= 0;
        const color = isUp ? '#10b981' : '#f43f5e';
        const gradId = isUp ? 'equityGreen' : 'equityRed';
        const chartData = equityData.map((p, i) => ({
          i,
          pnl: Number(p.cumulative_pnl),
          label: p.date,
        }));
        return (
          <div className="equity-card">
            <div className="equity-header">
              <span className="equity-title">Equity Curve</span>
              <span className="equity-total" style={{ color }}>
                {last >= 0 ? '+' : ''}${last.toFixed(2)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#1c2537', border: '1px solid #27334a', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'P&L']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                />
                <ReferenceLine y={0} stroke="#27334a" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: color }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="equity-meta">{equityData.length} trades plotted</div>
          </div>
        );
      })()}

      {monthlyData.length > 0 && (() => {
        const chartData = monthlyData.map(m => ({
          label: m.label,
          pnl: Number(m.pnl) || 0,
          wins: Number(m.wins),
          losses: Number(m.losses),
        }));
        return (
          <div className="equity-card">
            <div className="equity-header">
              <span className="equity-title">Monthly P&L</span>
              <span className="equity-meta" style={{ marginTop: 0, fontSize: 12 }}>last 12 months</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barSize={18}>
                <XAxis dataKey="label" tick={{ fill: '#7d8fa8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#1c2537', border: '1px solid #27334a', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v, _n, props) => [
                    `$${Number(v).toFixed(2)}`,
                    `${props.payload.wins}W / ${props.payload.losses}L`,
                  ]}
                />
                <ReferenceLine y={0} stroke="#27334a" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

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
