require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db/memory');
const dataRoutes = require('./routes/data');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  const app = express();

  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json({ limit: '5mb' }));

  app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use('/api', dataRoutes);

  app.listen(PORT, () => console.log(`Albe server listening on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

