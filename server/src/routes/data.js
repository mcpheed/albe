const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Sample = require('../models/Sample');
const { analyze } = require('../util/py');

router.post('/demo/seed', async (req, res) => {
  try {
    const session = await Session.create({ label: 'Demo Session' });

    const now = Date.now();
    const start = now - 5 * 60 * 1000; // last 5 minutes
    const hz = 1;
    const dt = 1000 / hz;
    const samples = [];
    let hrBase = 60;

    for (let t = start; t <= now; t += dt) {
      hrBase += (Math.random() - 0.5) * 0.1;
      const hr = Math.max(45, Math.min(90, hrBase + (Math.random() - 0.5) * 2));

      const fidget = Math.random() < 0.02 ? (Math.random() * 0.6 + 0.2) : 0;
      const ax = (Math.random() - 0.5) * 0.04 + fidget;
      const ay = (Math.random() - 0.5) * 0.04 + (fidget ? (Math.random() - 0.5) * 0.3 : 0);
      const az = 1.0 + (Math.random() - 0.5) * 0.04;

      samples.push({
        sessionId: session._id,
        timestamp: new Date(t),
        hr: Math.round(hr * 10) / 10,
        ax, ay, az
      });
    }

    await Sample.insertMany(samples);
    res.json({ sessionId: session._id.toString(), inserted: samples.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'seed_failed', detail: e.message });
  }
});

router.post('/sessions/:id/samples', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { samples } = req.body;
    if (!Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({ error: 'invalid_samples' });
    }
    const docs = samples.map(s => ({
      sessionId,
      timestamp: new Date(s.timestamp),
      hr: s.hr, ax: s.ax, ay: s.ay, az: s.az
    }));
    const result = await Sample.insertMany(docs);
    res.json({ inserted: result.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'ingest_failed', detail: e.message });
  }
});

router.post('/analyze/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const samples = await Sample.find({ sessionId }).sort({ timestamp: 1 }).lean();
    if (!samples.length) return res.status(404).json({ error: 'no_samples' });

    const payload = samples.map(s => ({
      timestamp: new Date(s.timestamp).getTime(),
      hr: s.hr,
      ax: s.ax, ay: s.ay, az: s.az
    }));

    const result = await analyze(payload);
    await Session.findByIdAndUpdate(sessionId, {
      summary: { ...result.summary, computedAt: new Date() }
    });

    const series = payload.map(p => ({ t: p.timestamp, hr: p.hr }));
    res.json({ sessionId, summary: result.summary, series });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'analyze_failed', detail: e.message });
  }
});

router.get('/report/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).lean();
    if (!session || !session.summary) return res.status(404).json({ error: 'no_summary' });
    res.json({ sessionId: session._id.toString(), summary: session.summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'report_failed', detail: e.message });
  }
});

module.exports = router;
