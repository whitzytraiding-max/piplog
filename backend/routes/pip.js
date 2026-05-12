const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const pool = require('../db');
const auth = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PIP_SYSTEM_PROMPT = `You are Pip, a wise and witty trading cat who has seen every chart pattern known to humankind.
You help traders improve by analyzing their journal entries and spotting patterns they might miss.

Your personality:
- You speak with feline confidence and occasional cat puns ("paws before revenge trading", "let that trade breathe")
- You're honest and direct — you call out bad habits without sugar-coating
- You care deeply about your trader's growth and mental discipline
- You keep responses concise and actionable

When given trade data, you look for:
- Emotional trading patterns (FOMO, revenge trading, overtrading)
- Consistency with their stated setup/strategy
- Risk management issues
- Session-based performance patterns
- What separates their winning trades from losing ones

Always end with one specific, actionable tip the trader can apply immediately.`;

// Get chat history
router.get('/messages', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pip_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message to Pip
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;
  try {
    // Save user message
    await pool.query(
      'INSERT INTO pip_messages (user_id, role, content) VALUES ($1, $2, $3)',
      [req.user.id, 'user', message]
    );

    // Get recent trade context
    const tradesResult = await pool.query(
      `SELECT asset, direction, result, rr_actual, pnl, emotional_state, setup_type, post_note, trade_date
       FROM trades WHERE user_id = $1 ORDER BY trade_date DESC LIMIT 10`,
      [req.user.id]
    );

    // Get recent chat history for context
    const historyResult = await pool.query(
      'SELECT role, content FROM pip_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    const history = historyResult.rows.reverse();

    const tradeContext = tradesResult.rows.length > 0
      ? `\n\nTrader's recent trades:\n${JSON.stringify(tradesResult.rows, null, 2)}`
      : '';

    const messages = [
      ...history.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message + tradeContext },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: PIP_SYSTEM_PROMPT }, ...messages],
      max_tokens: 500,
      temperature: 0.8,
    });

    const reply = completion.choices[0].message.content;

    // Save Pip's reply
    await pool.query(
      'INSERT INTO pip_messages (user_id, role, content) VALUES ($1, $2, $3)',
      [req.user.id, 'assistant', reply]
    );

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Pip is napping. Try again in a moment.' });
  }
});

// Pip's weekly analysis (called on demand)
router.get('/weekly', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT asset, direction, result, rr_actual, pnl, emotional_state, setup_type, pre_note, post_note, trade_date
       FROM trades WHERE user_id = $1 AND trade_date >= NOW() - INTERVAL '7 days'
       ORDER BY trade_date DESC`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ analysis: "Mrrrow... I see no trades this week. Pip cannot analyze what does not exist. Get out there and journal your trades! 🐾" });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: PIP_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Give me a weekly trading analysis based on these trades from the past 7 days.
Be specific about patterns you see. Include stats (win rate, avg R:R, total P&L).
Trades: ${JSON.stringify(result.rows, null, 2)}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    res.json({ analysis: completion.choices[0].message.content, trades: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
