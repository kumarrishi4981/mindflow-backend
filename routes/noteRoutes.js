const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Edge = require('../models/Edge');
const { generateEmbedding } = require('../services/embeddingService');

/**
 * Generate embedding text from a note's title and content.
 */
function getEmbeddingText(note) {
  const parts = [];
  if (note.title) parts.push(note.title);
  if (note.content) parts.push(note.content);
  return parts.join(' — ');
}

/**
 * Background embedding generation for a note.
 * Updates the note's embedding field in the database.
 */
async function embedNoteInBackground(noteId) {
  try {
    const note = await Note.findById(noteId);
    if (!note) {
      console.warn(`⚠️  embedNoteInBackground: note ${noteId} not found`);
      return;
    }

    const isDefaultUntitled = !note.title || note.title.trim() === 'Untitled Note';
    const isContentEmpty = !note.content || !note.content.trim();

    // If it's a default Untitled Note with no content, do not generate embeddings
    // and clear any pre-existing embedding.
    if (isDefaultUntitled && isContentEmpty) {
      console.log(`⚠️  embedNoteInBackground: note ${noteId} is empty/untitled. Clearing embedding.`);
      await Note.findByIdAndUpdate(noteId, { embedding: [] });
      return;
    }

    const text = getEmbeddingText(note);
    if (!text.trim()) {
      console.log(`⚠️  embedNoteInBackground: note ${noteId} has no text to embed. Clearing embedding.`);
      await Note.findByIdAndUpdate(noteId, { embedding: [] });
      return;
    }

    const embedding = await generateEmbedding(text);
    if (embedding.length > 0) {
      await Note.findByIdAndUpdate(noteId, { embedding });
      console.log(`✅ embedNoteInBackground: note ${noteId} embedding updated (${embedding.length} dims)`);
    }
  } catch (err) {
    console.error(`❌ embedNoteInBackground error for note ${noteId}: ${err.message}`);
  }
}

// GET /api/notes?canvasId=X — List all notes for a canvas
router.get('/', async (req, res) => {
  try {
    const { canvasId } = req.query;
    if (!canvasId) {
      return res.status(400).json({ error: 'canvasId query parameter is required' });
    }
    console.log(`📋 GET /api/notes — listing notes for canvas ${canvasId}`);
    const notes = await Note.find({ canvasId }).sort({ updatedAt: -1 });
    console.log(`✅ Found ${notes.length} notes for canvas ${canvasId}`);
    res.json(notes);
  } catch (err) {
    console.error(`❌ GET /api/notes error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
});

// GET /api/notes/:id — Get single note
router.get('/:id', async (req, res) => {
  try {
    console.log(`📋 GET /api/notes/${req.params.id}`);
    const note = await Note.findById(req.params.id);
    if (!note) {
      console.warn(`⚠️  Note ${req.params.id} not found`);
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    console.error(`❌ GET /api/notes/:id error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch note', details: err.message });
  }
});

// POST /api/notes — Create note, trigger embedding in background
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, color, canvasId, position } = req.body;
    console.log(`➕ POST /api/notes — creating note: "${title}" in canvas ${canvasId}`);

    if (!canvasId) {
      return res.status(400).json({ error: 'canvasId is required' });
    }

    const note = new Note({ title, content, tags, color, canvasId, position });
    const saved = await note.save();
    console.log(`✅ Note created: ${saved._id}`);

    // Trigger embedding generation in the background (don't await)
    embedNoteInBackground(saved._id).then(() => {
      console.log(`🔄 Background embedding complete for note ${saved._id}`);
    }).catch(err => {
      console.error(`❌ Background embedding failed for note ${saved._id}: ${err.message}`);
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error(`❌ POST /api/notes error: ${err.message}`);
    res.status(500).json({ error: 'Failed to create note', details: err.message });
  }
});

// PUT /api/notes/:id — Update note, re-embed if title or content changed
router.put('/:id', async (req, res) => {
  try {
    console.log(`✏️  PUT /api/notes/${req.params.id}`);

    const existingNote = await Note.findById(req.params.id);
    if (!existingNote) {
      console.warn(`⚠️  Note ${req.params.id} not found for update`);
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if title or content is changing
    const titleChanged = req.body.title !== undefined && req.body.title !== existingNote.title;
    const contentChanged = req.body.content !== undefined && req.body.content !== existingNote.content;

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    console.log(`✅ Note updated: ${updatedNote._id}`);

    // Re-generate embedding if content or title changed
    if (titleChanged || contentChanged) {
      console.log(`🔄 Title/content changed — re-embedding note ${updatedNote._id}`);
      embedNoteInBackground(updatedNote._id).then(() => {
        console.log(`🔄 Background re-embedding complete for note ${updatedNote._id}`);
      }).catch(err => {
        console.error(`❌ Background re-embedding failed for note ${updatedNote._id}: ${err.message}`);
      });
    }

    res.json(updatedNote);
  } catch (err) {
    console.error(`❌ PUT /api/notes/:id error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update note', details: err.message });
  }
});

// DELETE /api/notes/:id — Delete note + all connected edges
router.delete('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    console.log(`🗑️  DELETE /api/notes/${noteId}`);

    const note = await Note.findById(noteId);
    if (!note) {
      console.warn(`⚠️  Note ${noteId} not found for deletion`);
      return res.status(404).json({ error: 'Note not found' });
    }

    // Delete all edges where this note is source or target
    const edgesResult = await Edge.deleteMany({
      $or: [{ source: noteId }, { target: noteId }],
    });

    await Note.findByIdAndDelete(noteId);

    console.log(`✅ Note ${noteId} deleted — removed ${edgesResult.deletedCount} connected edges`);
    res.json({
      message: 'Note and connected edges deleted',
      deletedEdges: edgesResult.deletedCount,
    });
  } catch (err) {
    console.error(`❌ DELETE /api/notes/:id error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete note', details: err.message });
  }
});

module.exports = router;
