const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  color: { type: String, default: '#4f8ff7' },
  embedding: { type: [Number], default: [] },
  canvasId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canvas', required: true },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  pinned: { type: Boolean, default: false },
}, { timestamps: true });

noteSchema.index({ canvasId: 1 });
module.exports = mongoose.model('Note', noteSchema);
