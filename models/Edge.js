const mongoose = require('mongoose');

const edgeSchema = new mongoose.Schema({
  source: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  canvasId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canvas', required: true },
  type: { type: String, enum: ['manual', 'ai'], default: 'manual' },
  similarity: { type: Number, default: 0 },
  label: { type: String, default: '' },
}, { timestamps: true });

edgeSchema.index({ canvasId: 1 });
edgeSchema.index({ source: 1, target: 1 }, { unique: true });
module.exports = mongoose.model('Edge', edgeSchema);
