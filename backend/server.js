require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/pip', require('./routes/pip'));
app.use('/api/profile', require('./routes/profile'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', mascot: 'Pip is watching your charts 🐾' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PipLog server running on port ${PORT}`));
