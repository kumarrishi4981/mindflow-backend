const express = require('express');
const router = express.Router();
const Edge = require('../models/Edge');

// GET /api/edges?canvasId=X — List all edges for a canvas
router.get('/', async (req, res) => {
  try {
    const { canvasId } = req.query;
    if (!canvasId) {
      return res.status(400).json({ error: 'canvasId query parameter is required' });
    }
    console.log(`📋 GET /api/edges — listing edges for canvas ${canvasId}`);
    const edges = await Edge.find({ canvasId });
    console.log(`✅ Found ${edges.length} edges for canvas ${canvasId}`);
    res.json(edges);
  } catch (err) {
    console.error(`❌ GET /api/edges error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch edges', details: err.message });
  }
});

// POST /api/edges — Create edge (source !== target check)
router.post('/', async (req, res) => {
  try {
    const { source, target, canvasId, type, similarity, label } = req.body;
    console.log(`➕ POST /api/edges — creating edge: ${source} → ${target} in canvas ${canvasId}`);

    if (!source || !target || !canvasId) {
      return res.status(400).json({ error: 'source, target, and canvasId are required' });
    }

    if (source === target) {
      console.warn('⚠️  Cannot create self-referencing edge');
      return res.status(400).json({ error: 'source and target must be different notes' });
    }

    // Check if an edge already exists in either direction
    const existingEdge = await Edge.findOne({
      canvasId,
      $or: [
        { source, target },
        { source: target, target: source }
      ]
    });

    if (existingEdge) {
      console.warn('⚠️  Duplicate edge (either direction) — already exists');
      return res.status(409).json({ error: 'An edge between these two notes already exists' });
    }

    const edge = new Edge({ source, target, canvasId, type, similarity, label });
    const saved = await edge.save();
    console.log(`✅ Edge created: ${saved._id}`);
    res.status(201).json(saved);
  } catch (err) {
    // Handle duplicate edge index errors
    if (err.code === 11000) {
      console.warn('⚠️  Duplicate edge index error — already exists');
      return res.status(409).json({ error: 'An edge between these two notes already exists' });
    }
    console.error(`❌ POST /api/edges error: ${err.message}`);
    res.status(500).json({ error: 'Failed to create edge', details: err.message });
  }
});

// DELETE /api/edges/:id — Delete an edge
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️  DELETE /api/edges/${req.params.id}`);
    const edge = await Edge.findByIdAndDelete(req.params.id);
    if (!edge) {
      console.warn(`⚠️  Edge ${req.params.id} not found for deletion`);
      return res.status(404).json({ error: 'Edge not found' });
    }
    console.log(`✅ Edge ${req.params.id} deleted`);
    res.json({ message: 'Edge deleted' });
  } catch (err) {
    console.error(`❌ DELETE /api/edges/:id error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete edge', details: err.message });
  }
});

module.exports = router;
