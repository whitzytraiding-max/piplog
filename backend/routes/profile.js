const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get profile
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/', auth, async (req, res) => {
  const { trading_style, markets, risk_percent, account_balance, broker, trading_rules } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        trading_style=$1, markets=$2, risk_percent=$3,
        account_balance=$4, broker=$5, trading_rules=$6
       WHERE id=$7 RETURNING *`,
      [trading_style, markets, risk_percent, account_balance, broker, trading_rules, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
