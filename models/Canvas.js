const mongoose = require('mongoose');

const canvasSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'My Canvas', trim: true },
  description: { type: String, default: '' },
  author: { type: String, default: 'Anonymous' },
}, { timestamps: true });

module.exports = mongoose.model('Canvas', canvasSchema);
