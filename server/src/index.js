require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const noteRoutes = require('./routes/noteRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database (with automatic local fallback)
connectDB();

// Middleware
const allowedOrigin = process.env.CLIENT_URL || true;
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BookMind AI Server is operational.' });
});

// Serve frontend in production (monolith / single container deployment)
// if (process.env.NODE_ENV === 'production') {
//   const clientDist = path.join(__dirname, '../../client/dist');
//   app.use(express.static(clientDist));
//   app.get('*', (req, res, next) => {
//     if (req.path.startsWith('/api')) return next();
//     res.sendFile(path.join(clientDist, 'index.html'));
//   });
// }

// 404 Handler for API
app.use((req, res) => {
  res.status(404).json({ message: 'Requested API endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 BookMind AI Server listening on port ${PORT}`);
});
