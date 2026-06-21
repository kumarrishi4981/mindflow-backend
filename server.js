require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const canvasRoutes = require('./routes/canvasRoutes');
const noteRoutes = require('./routes/noteRoutes');
const edgeRoutes = require('./routes/edgeRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/canvases', canvasRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/edges', edgeRoutes);
app.use('/api/ai', aiRoutes);

// Health endpoints
app.get('/', (req, res) => {
  res.json({ message: '🧠 Mindflow API is running!' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: isConnected ? 'connected' : 'disconnected',
  });
});

// MongoDB connection with graceful offline fallback
let isConnected = false;
mongoose.set('bufferCommands', false); // Fail fast when DB is offline
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 3000, // Fail fast instead of 30s default
})
  .then(() => {
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.warn(`⚠️  Failed to connect to MongoDB: ${err.message}`);
    console.log('⚡ Running in offline mode — some features may not work');
  });

// Handle MongoDB disconnection events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✅ MongoDB reconnected');
});

// Start server
app.listen(PORT, () => {
  console.log(`🧠 Mindflow API listening on port ${PORT}`);
  console.log(`📡 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT SET'}`);
});
