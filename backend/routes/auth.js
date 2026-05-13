const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const pool = require('../db');

const client = new OAuth2Client();

// Ensure new columns exist
pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT').catch(() => {});
pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT').catch(() => {});

const makeToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Google OAuth — accepts both web and iOS client tokens
router.post('/google', async (req, res) => {
  const { token } = req.body;
  try {
    const audiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
    ].filter(Boolean);
    const ticket = await client.verifyIdToken({ idToken: token, audience: audiences });
    const { sub: google_id, email, name, picture: avatar } = ticket.getPayload();

    let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [google_id]);
    let user = result.rows[0];

    if (!user) {
      result = await pool.query(
        'INSERT INTO users (google_id, email, name, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
        [google_id, email, name, avatar]
      );
      user = result.rows[0];
    }

    res.json({ token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Google auth failed' });
  }
});

// Apple Sign-In
router.post('/apple', async (req, res) => {
  const { identityToken, firstName, lastName, email: appleEmail } = req.body;
  if (!identityToken) return res.status(400).json({ error: 'identityToken required' });
  try {
    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: 'com.piplog.app',
      ignoreExpiration: true,
    });
    const apple_id = payload.sub;
    const email = payload.email || appleEmail || null;
    const name = [firstName, lastName].filter(Boolean).join(' ') || email?.split('@')[0] || 'Trader';

    // Find by apple_id first, then by email (link accounts)
    let result = await pool.query('SELECT * FROM users WHERE apple_id = $1', [apple_id]);
    let user = result.rows[0];

    if (!user && email) {
      result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    }

    if (user) {
      if (!user.apple_id) {
        await pool.query('UPDATE users SET apple_id = $1 WHERE id = $2', [apple_id, user.id]);
        user.apple_id = apple_id;
      }
    } else {
      result = await pool.query(
        'INSERT INTO users (apple_id, email, name) VALUES ($1, $2, $3) RETURNING *',
        [apple_id, email, name]
      );
      user = result.rows[0];
    }

    res.json({ token: makeToken(user), user });
  } catch (err) {
    console.error('Apple auth error:', err.message);
    res.status(400).json({ error: `Apple sign-in failed: ${err.message}` });
  }
});

// Email register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) return res.status(400).json({ error: 'An account with that email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const displayName = name?.trim() || email.split('@')[0];
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [email.toLowerCase().trim(), displayName, hash]
    );
    const user = result.rows[0];
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Email login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];
    if (!user || !user.password_hash) return res.status(401).json({ error: 'No account found with that email' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    res.json({ token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
