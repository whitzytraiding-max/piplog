const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../db');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
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

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Google auth failed' });
  }
});

module.exports = router;
