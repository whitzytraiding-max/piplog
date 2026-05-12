const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'piplog/screenshots', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});
const upload = multer({ storage });

// Upload screenshot
router.post('/upload', auth, upload.single('screenshot'), (req, res) => {
  res.json({ url: req.file.path, public_id: req.file.filename });
});

// Get all trades for user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trades WHERE user_id = $1 ORDER BY trade_date DESC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single trade
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create trade
router.post('/', auth, async (req, res) => {
  const {
    asset, direction, entry_price, exit_price, stop_loss, take_profit,
    rr_planned, rr_actual, result: tradeResult, pnl, session,
    setup_type, emotional_state, pre_note, post_note, screenshots, trade_date,
  } = req.body;
  const n = v => (v === '' || v === undefined) ? null : v;
  try {
    const result = await pool.query(
      `INSERT INTO trades
        (user_id, asset, direction, entry_price, exit_price, stop_loss, take_profit,
         rr_planned, rr_actual, result, pnl, session, setup_type, emotional_state,
         pre_note, post_note, screenshots, trade_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [req.user.id, asset, direction, n(entry_price), n(exit_price), n(stop_loss), n(take_profit),
       n(rr_planned), n(rr_actual), n(tradeResult), n(pnl), n(session), n(setup_type), n(emotional_state),
       n(pre_note), n(post_note), JSON.stringify(screenshots || []), trade_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update trade
router.put('/:id', auth, async (req, res) => {
  const {
    asset, direction, entry_price, exit_price, stop_loss, take_profit,
    rr_planned, rr_actual, result: tradeResult, pnl, session,
    setup_type, emotional_state, pre_note, post_note, screenshots, trade_date,
  } = req.body;
  const n = v => (v === '' || v === undefined) ? null : v;
  try {
    const result = await pool.query(
      `UPDATE trades SET
        asset=$1, direction=$2, entry_price=$3, exit_price=$4, stop_loss=$5,
        take_profit=$6, rr_planned=$7, rr_actual=$8, result=$9, pnl=$10,
        session=$11, setup_type=$12, emotional_state=$13, pre_note=$14,
        post_note=$15, screenshots=$16, trade_date=$17
       WHERE id=$18 AND user_id=$19 RETURNING *`,
      [asset, direction, n(entry_price), n(exit_price), n(stop_loss), n(take_profit),
       n(rr_planned), n(rr_actual), n(tradeResult), n(pnl), n(session), n(setup_type), n(emotional_state),
       n(pre_note), n(post_note), JSON.stringify(screenshots || []), trade_date,
       req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete trade
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM trades WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE result = 'win') AS wins,
        COUNT(*) FILTER (WHERE result = 'loss') AS losses,
        COUNT(*) FILTER (WHERE result = 'breakeven') AS breakevens,
        COUNT(*) AS total,
        ROUND(AVG(rr_actual) FILTER (WHERE rr_actual IS NOT NULL), 2) AS avg_rr,
        ROUND(SUM(pnl) FILTER (WHERE pnl IS NOT NULL), 2) AS total_pnl
       FROM trades WHERE user_id = $1`,
      [req.user.id]
    );
    const stats = result.rows[0];
    stats.win_rate = stats.total > 0
      ? Math.round((stats.wins / stats.total) * 100)
      : 0;
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Current month stats
router.get('/stats/month', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE result = 'win') AS wins,
        COUNT(*) FILTER (WHERE result = 'loss') AS losses,
        COUNT(*) FILTER (WHERE result = 'breakeven') AS breakevens,
        COUNT(*) AS total,
        ROUND(SUM(pnl) FILTER (WHERE pnl IS NOT NULL), 2) AS total_pnl
       FROM trades
       WHERE user_id = $1
         AND DATE_TRUNC('month', trade_date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [req.user.id]
    );
    const stats = result.rows[0];
    stats.win_rate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Calendar data — trades grouped by day for a given month
router.get('/calendar', auth, async (req, res) => {
  const { year, month } = req.query;
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || new Date().getMonth() + 1;
  try {
    const result = await pool.query(
      `SELECT
        trade_date::text AS date,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE result = 'win') AS wins,
        COUNT(*) FILTER (WHERE result = 'loss') AS losses,
        ROUND(SUM(pnl) FILTER (WHERE pnl IS NOT NULL), 2) AS pnl
       FROM trades
       WHERE user_id = $1
         AND EXTRACT(YEAR FROM trade_date) = $2
         AND EXTRACT(MONTH FROM trade_date) = $3
       GROUP BY trade_date
       ORDER BY trade_date`,
      [req.user.id, y, m]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Monthly P&L breakdown — last 12 months
router.get('/stats/monthly', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('month', trade_date), 'YYYY-MM') AS month,
        TO_CHAR(DATE_TRUNC('month', trade_date), 'Mon') AS label,
        COUNT(*) FILTER (WHERE result = 'win') AS wins,
        COUNT(*) FILTER (WHERE result = 'loss') AS losses,
        COUNT(*) AS total,
        ROUND(SUM(pnl) FILTER (WHERE pnl IS NOT NULL), 2) AS pnl
       FROM trades
       WHERE user_id = $1
         AND trade_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
       GROUP BY DATE_TRUNC('month', trade_date)
       ORDER BY DATE_TRUNC('month', trade_date)`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Equity curve — cumulative P&L per trade
router.get('/stats/equity', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        trade_date::text AS date,
        asset,
        result,
        pnl,
        ROUND(SUM(pnl) OVER (ORDER BY trade_date, created_at ROWS UNBOUNDED PRECEDING), 2) AS cumulative_pnl
       FROM trades
       WHERE user_id = $1 AND pnl IS NOT NULL
       ORDER BY trade_date, created_at`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Analyze chart screenshot with AI vision
router.post('/analyze-chart', auth, async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: `Analyze this trading chart screenshot and extract all visible trade information.
Return ONLY a valid JSON object with these exact fields (use null for anything not clearly visible):
{
  "asset": "the trading instrument e.g. EURUSD, BTCUSDT, AAPL, NAS100, XAUUSD",
  "direction": "long" or "short" or null,
  "entry_price": number or null,
  "exit_price": number or null,
  "stop_loss": number or null,
  "take_profit": number or null,
  "result": "win" or "loss" or "breakeven" or null,
  "setup_type": "e.g. Breakout, Reversal, Order Block, Supply/Demand, Trend Continuation" or null,
  "session": "london" or "new_york" or "asian" or "overlap" or null,
  "platform": "e.g. TradingView, MT4, MT5, cTrader" or null
}
Return ONLY the JSON object, nothing else.`
          }
        ]
      }],
      max_tokens: 400,
      temperature: 0.1,
    });

    const text = completion.choices[0].message.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const detected = JSON.parse(jsonMatch[0]);
    res.json(detected);
  } catch (err) {
    console.error('Chart analysis error:', err.message);
    res.status(500).json({ error: 'Could not analyze chart' });
  }
});

module.exports = router;
