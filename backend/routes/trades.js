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
  try {
    const result = await pool.query(
      `INSERT INTO trades
        (user_id, asset, direction, entry_price, exit_price, stop_loss, take_profit,
         rr_planned, rr_actual, result, pnl, session, setup_type, emotional_state,
         pre_note, post_note, screenshots, trade_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [req.user.id, asset, direction, entry_price, exit_price, stop_loss, take_profit,
       rr_planned, rr_actual, tradeResult, pnl, session, setup_type, emotional_state,
       pre_note, post_note, JSON.stringify(screenshots || []), trade_date]
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
  try {
    const result = await pool.query(
      `UPDATE trades SET
        asset=$1, direction=$2, entry_price=$3, exit_price=$4, stop_loss=$5,
        take_profit=$6, rr_planned=$7, rr_actual=$8, result=$9, pnl=$10,
        session=$11, setup_type=$12, emotional_state=$13, pre_note=$14,
        post_note=$15, screenshots=$16, trade_date=$17
       WHERE id=$18 AND user_id=$19 RETURNING *`,
      [asset, direction, entry_price, exit_price, stop_loss, take_profit,
       rr_planned, rr_actual, tradeResult, pnl, session, setup_type, emotional_state,
       pre_note, post_note, JSON.stringify(screenshots || []), trade_date,
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

module.exports = router;
