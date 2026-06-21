const Note = require('../models/Note');
const Edge = require('../models/Edge');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

/**
 * Generate an embedding vector for a given text using Google Gemini API.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} The embedding vector, or empty array on failure.
 */
async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    console.log('⚠️  embeddingService.generateEmbedding: empty text, returning []');
    return [];
  }

  if (!GEMINI_API_KEY) {
    console.warn('⚠️  embeddingService.generateEmbedding: GEMINI_API_KEY not set');
    return [];
  }

  try {
    console.log(`🔄 embeddingService.generateEmbedding: generating embedding for "${text.substring(0, 60)}..."`);

    const response = await fetch(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ embeddingService.generateEmbedding: API returned ${response.status}: ${errorBody}`);
      return [];
    }

    const data = await response.json();
    const values = data?.embedding?.values;

    if (!Array.isArray(values) || values.length === 0) {
      console.warn('⚠️  embeddingService.generateEmbedding: no values in API response');
      return [];
    }

    console.log(`✅ embeddingService.generateEmbedding: got ${values.length}-dim embedding`);
    return values;
  } catch (err) {
    console.error(`❌ embeddingService.generateEmbedding: ${err.message}`);
    return [];
  }
}

/**
 * Compute the cosine similarity between two vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Cosine similarity in [-1, 1], or 0 if either vector is empty.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  if (vecA.length !== vecB.length) {
    console.warn(`⚠️  cosineSimilarity: dimension mismatch (${vecA.length} vs ${vecB.length})`);
    return 0;
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct / (magA * magB);
}

/**
 * Find notes similar to a given note within the same canvas.
 * @param {string} noteId - The ID of the target note.
 * @param {string} canvasId - The canvas to search within.
 * @param {number} threshold - Minimum cosine similarity to include (default 0.3).
 * @returns {Promise<Array<{note: object, similarity: number}>>} Sorted descending by similarity.
 */
async function findSimilarNotes(noteId, canvasId, threshold = 0.3) {
  try {
    console.log(`🔍 embeddingService.findSimilarNotes: noteId=${noteId}, canvasId=${canvasId}, threshold=${threshold}`);

    const targetNote = await Note.findById(noteId);
    if (!targetNote) {
      console.warn(`⚠️  findSimilarNotes: note ${noteId} not found`);
      return [];
    }

    if (!targetNote.embedding || targetNote.embedding.length === 0) {
      console.warn(`⚠️  findSimilarNotes: note ${noteId} has no embedding`);
      return [];
    }

    // Find all edges that involve the target note (meaning they are already connected)
    const connectedEdges = await Edge.find({
      canvasId,
      $or: [
        { source: noteId },
        { target: noteId }
      ]
    });

    // Collect the IDs of connected notes
    const connectedNoteIds = new Set(
      connectedEdges.map(edge => {
        const src = edge.source.toString();
        const tgt = edge.target.toString();
        return src === noteId ? tgt : src;
      })
    );

    // Fetch all other notes in the same canvas that have embeddings and are NOT already connected
    const otherNotes = await Note.find({
      canvasId: canvasId,
      _id: { 
        $ne: noteId, 
        $nin: Array.from(connectedNoteIds) 
      },
      embedding: { $exists: true, $not: { $size: 0 } },
    });

    // Filter out notes that are empty/untitled
    const filteredOtherNotes = otherNotes.filter(n => {
      const isDefaultUntitled = !n.title || n.title.trim() === 'Untitled Note';
      const isContentEmpty = !n.content || !n.content.trim();
      return !(isDefaultUntitled && isContentEmpty);
    });

    console.log(`📊 findSimilarNotes: comparing against ${filteredOtherNotes.length} notes with embeddings`);

    const results = [];
    for (const note of filteredOtherNotes) {
      const similarity = cosineSimilarity(targetNote.embedding, note.embedding);
      if (similarity >= threshold) {
        results.push({ note, similarity });
      }
    }

    // Sort descending by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ findSimilarNotes: found ${results.length} similar notes above threshold ${threshold}`);
    return results;
  } catch (err) {
    console.error(`❌ findSimilarNotes: ${err.message}`);
    return [];
  }
}

module.exports = {
  generateEmbedding,
  cosineSimilarity,
  findSimilarNotes,
};
