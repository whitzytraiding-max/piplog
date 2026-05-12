CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar VARCHAR(500),
  trading_style VARCHAR(50),
  markets TEXT[],
  risk_percent DECIMAL(5,2),
  account_balance DECIMAL(15,2),
  broker VARCHAR(255),
  trading_rules TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  rr_planned DECIMAL(8,2),
  rr_actual DECIMAL(8,2),
  result VARCHAR(20) CHECK (result IN ('win', 'loss', 'breakeven')),
  pnl DECIMAL(15,2),
  session VARCHAR(20) CHECK (session IN ('london', 'new_york', 'asian', 'overlap')),
  setup_type VARCHAR(100),
  emotional_state VARCHAR(50),
  pre_note TEXT,
  post_note TEXT,
  screenshots JSONB DEFAULT '[]',
  trade_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pip_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades(trade_date);
CREATE INDEX IF NOT EXISTS idx_pip_messages_user_id ON pip_messages(user_id);
