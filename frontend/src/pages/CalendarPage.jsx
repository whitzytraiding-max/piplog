import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [dayData, setDayData] = useState({});
  const [monthStats, setMonthStats] = useState(null);

  useEffect(() => {
    api.get(`/trades/calendar?year=${year}&month=${month}`)
      .then(r => {
        const map = {};
        r.data.forEach(d => { map[d.date] = d; });
        setDayData(map);
      }).catch(() => {});
    api.get('/trades/stats/month').then(r => setMonthStats(r.data)).catch(() => {});
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-sub">Your trades, day by day</p>
        </div>
        <Link to="/trades/new" className="btn-primary">+ Log Trade</Link>
      </div>

      {monthStats && (
        <div className="month-card">
          <div className="month-card-label">{MONTHS[month-1]} {year}</div>
          <div className="month-card-pnl" style={{ color: (monthStats.total_pnl || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
            {(monthStats.total_pnl || 0) >= 0 ? '+' : ''}${Number(monthStats.total_pnl || 0).toFixed(2)}
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

      <div className="cal-card">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>←</button>
          <span className="cal-month-title">{MONTHS[month-1]} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>→</button>
        </div>

        <div className="cal-grid">
          {DAYS.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="cal-cell cal-cell-empty" />;
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const data = dayData[dateStr];
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} className={`cal-cell${isToday ? ' cal-today' : ''}${data ? ' cal-has-trades' : ''}`}>
                <span className="cal-day-num">{day}</span>
                {data && (
                  <div className="cal-day-data">
                    <div className="cal-dots">
                      {Array.from({ length: Math.min(Number(data.wins), 5) }).map((_, j) => (
                        <span key={`w${j}`} className="cal-dot cal-dot-win" />
                      ))}
                      {Array.from({ length: Math.min(Number(data.losses), 5) }).map((_, j) => (
                        <span key={`l${j}`} className="cal-dot cal-dot-loss" />
                      ))}
                    </div>
                    {data.pnl != null && (
                      <span className="cal-day-pnl" style={{ color: Number(data.pnl) >= 0 ? '#10b981' : '#f43f5e' }}>
                        {Number(data.pnl) >= 0 ? '+' : ''}{Number(data.pnl).toFixed(0)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
