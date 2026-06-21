const express = require('express');
const router = express.Router();
const Canvas = require('../models/Canvas');
const Note = require('../models/Note');
const Edge = require('../models/Edge');

const { generateEmbedding } = require('../services/embeddingService');

// Helper function to create note and generate embedding from title + content
async function createNoteWithEmbedding(data) {
  const text = [data.title, data.content].filter(Boolean).join(' — ');
  let embedding = [];
  if (text.trim()) {
    try {
      embedding = await generateEmbedding(text);
    } catch (err) {
      console.error(`❌ Failed to generate embedding during seeding: ${err.message}`);
    }
  }
  return new Note({ ...data, embedding }).save();
}

// Helper function to seed default welcome canvases
async function seedDefaultCanvas() {
  try {
    console.log('🌱 Seeding default welcome canvases into MongoDB Atlas with Gemini embeddings...');

    // 1. Welcome Canvas
    const canvas1 = await new Canvas({
      name: 'Welcome & Quick Start Guide',
      description: 'Learn how to use Mindflow and explore its core features including note creation, connection mapping, and AI assistance.',
      author: 'Mindflow Team'
    }).save();

    const c1_note1 = await createNoteWithEmbedding({
      title: '👋 Welcome to Mindflow',
      content: `Mindflow is an AI-powered spatial workspace for brainstorming, organizing research, and building an interconnected knowledge graph.

💡 **Quick Tips:**
• **Double-Click:** Click anywhere on the blank canvas to create a new note!
• **Drag & Arrange:** Drag any note card by its header to reposition it.
• **Zoom & Pan:** Use your mouse scroll or pinch-to-zoom to navigate the canvas freely.
• **Select & Edit:** Click any note to edit its content, tags, or colors in real-time.`,
      tags: ['welcome', 'quickstart'],
      color: '#4f8ff7',
      canvasId: canvas1._id,
      position: { x: 150, y: 150 }
    });

    const c1_note2 = await createNoteWithEmbedding({
      title: '🔗 Interactive Knowledge Graph',
      content: `Behind your notes is a powerful, interactive visual graph!

💡 **Connecting Notes:**
1. Click the 'Link' button on a note's menu.
2. Click any other note to create a visual link.
3. Observe how they connect in the "Knowledge Graph" sidebar tab!

Building visual relations makes organizing complex topics effortless.`,
      tags: ['features', 'graph'],
      color: '#34d399',
      canvasId: canvas1._id,
      position: { x: 550, y: 50 }
    });

    const c1_note3 = await createNoteWithEmbedding({
      title: '✨ Google Gemini AI Power',
      content: `Mindflow integrates the advanced Google Gemini model to supercharge your workflow.

💡 **AI Features to Explore:**
• **Auto-Tagging:** Type your note and AI will instantly suggest context-aware tags!
• **Expand Concept:** Select a note and click "Ask Gemini" to generate child nodes and discover new relationships.
• **Semantic Search:** Find notes by meaning rather than just exact keywords.`,
      tags: ['ai', 'gemini'],
      color: '#a78bfa',
      canvasId: canvas1._id,
      position: { x: 550, y: 400 }
    });

    await Promise.all([
      new Edge({ source: c1_note1._id, target: c1_note2._id, canvasId: canvas1._id, type: 'manual', label: 'explains' }).save(),
      new Edge({ source: c1_note1._id, target: c1_note3._id, canvasId: canvas1._id, type: 'manual', label: 'explains' }).save()
    ]);

    // 2. AI Research Notes Canvas
    const canvas2 = await new Canvas({
      name: '🔬 AI Research Notes',
      description: 'An example board showcasing how to organize machine learning papers, transformer architectures, and training techniques into a connected knowledge graph.',
      author: 'Mindflow Team'
    }).save();

    const c2_note1 = await createNoteWithEmbedding({
      title: '🧠 Transformer Architectures',
      content: `Transformer models process input sequences in parallel using self-attention mechanisms, replacing recurrence (RNNs) and convolution (CNNs).

Key Components:
- Multi-Head Self-Attention
- Positional Encodings
- Layer Normalization & Residual Connections

Used in state-of-the-art LLMs like Google Gemini.`,
      tags: ['ai', 'transformers', 'architecture'],
      color: '#a78bfa',
      canvasId: canvas2._id,
      position: { x: 150, y: 150 }
    });

    const c2_note2 = await createNoteWithEmbedding({
      title: '⚡ LLM Fine-Tuning (PEFT)',
      content: `Parameter-Efficient Fine-Tuning (PEFT) methods adapt pre-trained language models to downstream tasks without training all parameters.

Techniques:
- LoRA (Low-Rank Adaptation)
- QLoRA (Quantized LoRA)
- Prefix Tuning

This drastically reduces GPU memory overhead while maintaining high model performance.`,
      tags: ['ai', 'finetuning', 'lora'],
      color: '#f472b6',
      canvasId: canvas2._id,
      position: { x: 550, y: 50 }
    });

    const c2_note3 = await createNoteWithEmbedding({
      title: '📊 Self-Attention Mechanics',
      content: `Self-attention allows each token in a sequence to attend to every other token.

Mathematical Formula:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

Computes relationships between queries, keys, and values.`,
      tags: ['ai', 'math', 'attention'],
      color: '#60a5fa',
      canvasId: canvas2._id,
      position: { x: 550, y: 350 }
    });

    await Promise.all([
      new Edge({ source: c2_note1._id, target: c2_note2._id, canvasId: canvas2._id, type: 'manual', label: 'applied to' }).save(),
      new Edge({ source: c2_note1._id, target: c2_note3._id, canvasId: canvas2._id, type: 'manual', label: 'uses' }).save()
    ]);

    // 3. Study Guide — Data Structures Canvas
    const canvas3 = await new Canvas({
      name: '📚 Study Guide — Data Structures',
      description: 'Organize CS concepts like arrays, trees, graphs, and sorting algorithms. AI automatically links related topics like "Binary Search Tree" ↔ "AVL Rotations".',
      author: 'Mindflow Team'
    }).save();

    const c3_note1 = await createNoteWithEmbedding({
      title: '🌳 Binary Search Trees (BST)',
      content: `A node-based binary tree data structure with the following properties:
- The left subtree of a node contains only nodes with keys less than the parent node.
- The right subtree contains only nodes with keys greater.
- Left and right subtrees must also be binary search trees.

Time Complexity:
- Search: O(log N) average, O(N) worst case.`,
      tags: ['cs', 'trees', 'bst'],
      color: '#34d399',
      canvasId: canvas3._id,
      position: { x: 150, y: 150 }
    });

    const c3_note2 = await createNoteWithEmbedding({
      title: '⚖️ AVL Trees (Self-Balancing)',
      content: `An AVL tree is a self-balancing binary search tree where the heights of the two child subtrees of any node differ by at most one.

Balancing operations:
- Single rotation (L, R)
- Double rotation (LR, RL)

Ensures O(log N) search, insertion, and deletion times in the worst case.`,
      tags: ['cs', 'balancing', 'avl'],
      color: '#fb7185',
      canvasId: canvas3._id,
      position: { x: 550, y: 100 }
    });

    const c3_note3 = await createNoteWithEmbedding({
      title: '📉 Graph Representations',
      content: `Graphs can be represented in memory using two primary data structures:
- **Adjacency Matrix**: A 2D array where cell (i, j) indicates an edge between node i and j. Good for dense graphs.
- **Adjacency List**: An array of lists where index i contains a list of neighbors of node i. Good for sparse graphs.`,
      tags: ['cs', 'graphs', 'theory'],
      color: '#f59e0b',
      canvasId: canvas3._id,
      position: { x: 550, y: 350 }
    });

    await Promise.all([
      new Edge({ source: c3_note1._id, target: c3_note2._id, canvasId: canvas3._id, type: 'manual', label: 'extends' }).save()
    ]);

    // 4. Product Roadmap Canvas
    const canvas4 = await new Canvas({
      name: '🚀 Product Roadmap',
      description: 'Use Mindflow to map product features, user stories, and technical specs. Semantic search finds related items across sprints instantly.',
      author: 'Mindflow Team'
    }).save();

    const c4_note1 = await createNoteWithEmbedding({
      title: '📍 Milestone 1: MVP Launch',
      content: `Goal: Release core node-canvas and visual graph layout to early alpha testers.

Deliverables:
- Infinite canvas panning and zoom
- Custom Markdown editor panel
- Custom color tagging and node styling`,
      tags: ['product', 'milestone', 'mvp'],
      color: '#60a5fa',
      canvasId: canvas4._id,
      position: { x: 150, y: 200 }
    });

    const c4_note2 = await createNoteWithEmbedding({
      title: '🤖 Gemini Integration',
      content: `Goal: Integrate Gemini API to automatically generate embeddings for note content and suggest semantic relations.

Deliverables:
- Set up Gemini API client in Node.js
- Store 768-dimensional float arrays in MongoDB
- Implement local cosine similarity scoring`,
      tags: ['product', 'ai', 'gemini'],
      color: '#a78bfa',
      canvasId: canvas4._id,
      position: { x: 550, y: 50 }
    });

    const c4_note3 = await createNoteWithEmbedding({
      title: '🎨 Premium UI/UX Design',
      content: `Goal: Build a high-fidelity visual design system with dark-mode aesthetic.

Deliverables:
- Interactive particle backgrounds
- Glassmorphism UI containers
- Neon styling accents and smooth transitions`,
      tags: ['product', 'design', 'ui'],
      color: '#f472b6',
      canvasId: canvas4._id,
      position: { x: 550, y: 350 }
    });

    await Promise.all([
      new Edge({ source: c4_note1._id, target: c4_note2._id, canvasId: canvas4._id, type: 'manual', label: 'includes' }).save(),
      new Edge({ source: c4_note1._id, target: c4_note3._id, canvasId: canvas4._id, type: 'manual', label: 'includes' }).save(),
      new Edge({ source: c4_note2._id, target: c4_note3._id, canvasId: canvas4._id, type: 'manual', label: 'guides' }).save()
    ]);

    console.log('✅ Seeding of all 4 default canvases complete!');
    return canvas1;
  } catch (err) {
    console.error('❌ Error seeding default canvases:', err.message);
  }
}

// GET /api/canvases — List all canvases, sorted by updatedAt desc
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/canvases — listing all canvases');
    let canvases = await Canvas.find().sort({ updatedAt: -1 });
    
    // Seed default welcome canvases if database is completely empty
    if (canvases.length === 0) {
      await seedDefaultCanvas();
      canvases = await Canvas.find().sort({ updatedAt: -1 });
    }
    
    console.log(`✅ Found ${canvases.length} canvases`);
    res.json(canvases);
  } catch (err) {
    console.error(`❌ GET /api/canvases error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch canvases', details: err.message });
  }
});

// GET /api/canvases/:id — Get single canvas
router.get('/:id', async (req, res) => {
  try {
    console.log(`📋 GET /api/canvases/${req.params.id}`);
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) {
      console.warn(`⚠️  Canvas ${req.params.id} not found`);
      return res.status(404).json({ error: 'Canvas not found' });
    }
    res.json(canvas);
  } catch (err) {
    console.error(`❌ GET /api/canvases/:id error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch canvas', details: err.message });
  }
});

// POST /api/canvases — Create new canvas
router.post('/', async (req, res) => {
  try {
    const { name, description, author } = req.body;
    console.log(`➕ POST /api/canvases — creating canvas: "${name || 'My Canvas'}"`);
    const canvas = new Canvas({ name, description, author });
    const saved = await canvas.save();
    console.log(`✅ Canvas created: ${saved._id}`);
    res.status(201).json(saved);
  } catch (err) {
    console.error(`❌ POST /api/canvases error: ${err.message}`);
    res.status(500).json({ error: 'Failed to create canvas', details: err.message });
  }
});

// PUT /api/canvases/:id — Update canvas
router.put('/:id', async (req, res) => {
  try {
    console.log(`✏️  PUT /api/canvases/${req.params.id}`);
    const canvas = await Canvas.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!canvas) {
      console.warn(`⚠️  Canvas ${req.params.id} not found for update`);
      return res.status(404).json({ error: 'Canvas not found' });
    }
    console.log(`✅ Canvas updated: ${canvas._id}`);
    res.json(canvas);
  } catch (err) {
    console.error(`❌ PUT /api/canvases/:id error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update canvas', details: err.message });
  }
});

// DELETE /api/canvases/:id — Delete canvas + all its notes + all its edges
router.delete('/:id', async (req, res) => {
  try {
    const canvasId = req.params.id;
    console.log(`🗑️  DELETE /api/canvases/${canvasId} — deleting canvas and all related data`);

    const canvas = await Canvas.findById(canvasId);
    if (!canvas) {
      console.warn(`⚠️  Canvas ${canvasId} not found for deletion`);
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const [notesResult, edgesResult] = await Promise.all([
      Note.deleteMany({ canvasId }),
      Edge.deleteMany({ canvasId }),
    ]);

    await Canvas.findByIdAndDelete(canvasId);

    console.log(`✅ Canvas ${canvasId} deleted — removed ${notesResult.deletedCount} notes, ${edgesResult.deletedCount} edges`);
    res.json({
      message: 'Canvas and all related data deleted',
      deletedNotes: notesResult.deletedCount,
      deletedEdges: edgesResult.deletedCount,
    });
  } catch (err) {
    console.error(`❌ DELETE /api/canvases/:id error: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete canvas', details: err.message });
  }
});

module.exports = router;
