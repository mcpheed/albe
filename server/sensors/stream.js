const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

function setupStream({ wss }) {
  const path = process.env.SERIAL_PATH || '/dev/ttyACM0'; // e.g. COM3 on Windows
  const baud = parseInt(process.env.SERIAL_BAUD || '115200', 10);

  let port;
  try {
    port = new SerialPort({ path, baudRate: baud, autoOpen: true });
    console.log(`[SERIAL] opened ${path} @ ${baud}`);
  } catch (e) {
    console.error('[SERIAL] open failed:', e.message);
    return;
  }

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    try {
      const obj = JSON.parse(line);
      const payload = JSON.stringify(obj);
      wss.clients.forEach((ws) => {
        if (ws.readyState === 1) ws.send(payload);
      });
      if (process.env.LOG_STREAM === '1') console.log('[STREAM]', payload);
    } catch (e) {
      if (process.env.LOG_PARSE_ERRORS === '1') {
        console.warn('[PARSE]', e.message, 'line=', line);
      }
    }
  });

  port.on('error', (e) => console.error('[SERIAL] error:', e.message));
}

module.exports = { setupStream };
