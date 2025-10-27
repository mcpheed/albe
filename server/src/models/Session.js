const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
  hr_avg: Number,
  hrv_sdnn_ms: Number,
  motion_rms: Number,
  sleep_score: Number,
  computedAt: Date
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  label: { type: String, default: 'Demo Session' },
  summary: { type: SummarySchema, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
