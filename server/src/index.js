require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB, getStorageModeInfo, closeDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const noteRoutes = require('./routes/noteRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows Vite SPA scripts and OpenLibrary image assets
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration - Explicit Allowlist
const rawClientUrls = process.env.CLIENT_URL || '';
const configuredOrigins = rawClientUrls
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultDevOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];
const allowedOrigins = [...new Set([...configuredOrigins, ...(!isProduction ? defaultDevOrigins : [])])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.length === 0 || allowedOrigins.includes(cleanOrigin) || (!isProduction && /^http:\/\/localhost:\d+$/.test(cleanOrigin))) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS request from disallowed origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

// Request Body Limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Lightweight Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI queries per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit reached. Please pause a moment before asking again.' }
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

// Health & Readiness Endpoints
app.get('/api/health', (req, res) => {
  const storageInfo = getStorageModeInfo();
  res.json({
    status: 'ok',
    service: 'BookMind AI Backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    storage: {
      mode: storageInfo.mode,
      connected: storageInfo.isMongoConnected
    }
  });
});

app.get('/api/ready', (req, res) => {
  const storageInfo = getStorageModeInfo();
  if (isProduction && !storageInfo.isMongoConnected) {
    return res.status(503).json({
      ready: false,
      message: 'Database connection is not operational.',
      storage: storageInfo
    });
  }
  return res.json({
    ready: true,
    storage: storageInfo
  });
});

// Serve frontend in production (monolith / single container deployment)
if (isProduction) {
  const fs = require('fs');
  const clientDist = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

// 404 Handler for API
app.use((req, res) => {
  res.status(404).json({ message: 'Requested API endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('Unhandled server error:', err.message || err);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

// Start Server after DB initialization
let server = null;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      const storageInfo = getStorageModeInfo();
      console.log(`🚀 BookMind AI Server running on port ${PORT} [Env: ${process.env.NODE_ENV || 'development'}, Storage: ${storageInfo.mode}]`);
    });
  } catch (err) {
    console.error('FATAL: Server startup aborted due to initialization failure:', err.message);
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down BookMind AI server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await closeDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
