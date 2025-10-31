const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { setupStream } = require('../sensors/stream');

const app = express();
app.use(cors());
app.get('/', (_req, res) => res.send('ALBAE server up'));

const server = http.createServer(app);

// WebSocket on /ws
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ ts_ms: Date.now(), event: 'connected' }));
  console.log('[WS] client connected');
});

setupStream({ wss });

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`ALBAE server listening on http://localhost:${PORT}`);
});
