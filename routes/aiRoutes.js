const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { generateEmbedding, cosineSimilarity, findSimilarNotes } = require('../services/embeddingService');

// POST /api/ai/suggest-links/:noteId — Find similar notes and return suggestions
router.post('/suggest-links/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { canvasId } = req.query;

    console.log(`🤖 POST /api/ai/suggest-links/${noteId} — canvasId=${canvasId}`);

    if (!canvasId) {
      return res.status(400).json({ error: 'canvasId query parameter is required' });
    }

    const results = await findSimilarNotes(noteId, canvasId);

    const suggestions = results.map(({ note, similarity }) => ({
      note: {
        _id: note._id,
        title: note.title,
        tags: note.tags,
        color: note.color,
      },
      similarity: Math.round(similarity * 1000) / 1000,
    }));

    console.log(`✅ suggest-links: returning ${suggestions.length} suggestions`);
    res.json(suggestions);
  } catch (err) {
    console.error(`❌ POST /api/ai/suggest-links error: ${err.message}`);
    res.status(500).json({ error: 'Failed to suggest links', details: err.message });
  }
});

// POST /api/ai/search — Semantic search across notes in a canvas
router.post('/search', async (req, res) => {
  try {
    const { query, canvasId } = req.body;

    console.log(`🔍 POST /api/ai/search — query="${query}", canvasId=${canvasId}`);

    if (!query || !canvasId) {
      return res.status(400).json({ error: 'query and canvasId are required' });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length === 0) {
      console.warn('⚠️  Could not generate embedding for search query');
      return res.json([]);
    }

    // Fetch all notes in the canvas with embeddings
    const notes = await Note.find({
      canvasId,
      embedding: { $exists: true, $not: { $size: 0 } },
    });

    console.log(`📊 search: comparing query against ${notes.length} embedded notes`);

    // Compute similarity for each note
    const scored = notes.map(note => ({
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        position: note.position,
      },
      similarity: Math.round(cosineSimilarity(queryEmbedding, note.embedding) * 1000) / 1000,
    }));

    // Sort descending and return top 10
    scored.sort((a, b) => b.similarity - a.similarity);
    const top10 = scored.slice(0, 10);

    console.log(`✅ search: returning top ${top10.length} results`);
    res.json(top10);
  } catch (err) {
    console.error(`❌ POST /api/ai/search error: ${err.message}`);
    res.status(500).json({ error: 'Failed to perform search', details: err.message });
  }
});

// POST /api/ai/embed-note/:noteId — Force re-embed a single note
router.post('/embed-note/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    console.log(`🔄 POST /api/ai/embed-note/${noteId} — force re-embedding`);

    const note = await Note.findById(noteId);
    if (!note) {
      console.warn(`⚠️  Note ${noteId} not found`);
      return res.status(404).json({ error: 'Note not found' });
    }

    const text = [note.title, note.content].filter(Boolean).join(' — ');
    if (!text.trim()) {
      console.warn(`⚠️  Note ${noteId} has no text to embed`);
      return res.status(400).json({ error: 'Note has no text content to embed' });
    }

    const embedding = await generateEmbedding(text);
    if (embedding.length === 0) {
      return res.status(502).json({ error: 'Failed to generate embedding from Gemini API' });
    }

    await Note.findByIdAndUpdate(noteId, { embedding });

    console.log(`✅ Note ${noteId} re-embedded successfully (${embedding.length} dims)`);
    res.json({
      message: 'Note embedding updated',
      noteId,
      dimensions: embedding.length,
    });
  } catch (err) {
    console.error(`❌ POST /api/ai/embed-note error: ${err.message}`);
    res.status(500).json({ error: 'Failed to embed note', details: err.message });
  }
});

module.exports = router;
