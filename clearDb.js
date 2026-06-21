require('dotenv').config();
const mongoose = require('mongoose');
const Canvas = require('./models/Canvas');
const Note = require('./models/Note');
const Edge = require('./models/Edge');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB to clear collections...');
    const resultCanvases = await Canvas.deleteMany({});
    const resultNotes = await Note.deleteMany({});
    const resultEdges = await Edge.deleteMany({});
    console.log(`Cleared: ${resultCanvases.deletedCount} canvases, ${resultNotes.deletedCount} notes, ${resultEdges.deletedCount} edges.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to clear database:', err);
    process.exit(1);
  });
