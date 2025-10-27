const mongoose = require('mongoose');

const SampleSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true, required: true },
  timestamp: { type: Date, index: true, required: true },
  hr: { type: Number, required: true },
  ax: { type: Number, required: true },
  ay: { type: Number, required: true },
  az: { type: Number, required: true }
}, { versionKey: false });

module.exports = mongoose.model('Sample', SampleSchema);
