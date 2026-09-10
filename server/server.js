require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { ready } = require('./db');
const { ensureDefaultTemplates } = require('./services/docxService');

const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const noteRoutes = require('./routes/notes');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directories for uploads/templates
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Clinical Notes & Coupled Drug Sheet Templating System',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);

// If client build exists, serve it
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Fallback message if client not built yet
      res.status(200).send('API Server is running. Client build in progress.');
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize and start
async function startServer() {
  try {
    await ready;
    await ensureDefaultTemplates();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Clinical Notes & Drug Sheet API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
