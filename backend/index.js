const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

// Load environment variables (supports both root .env and backend/.env)
const rootEnvPath = path.join(__dirname, '..', '.env');
const localEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config({ path: localEnvPath });
}

const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // Allow all in dev, can restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure required directories exist at startup
const initializeDirs = async () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'downloads'),
    path.join(__dirname, 'temp')
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
  console.log('✓ Storage directories initialized.');
};

initializeDirs().catch(err => {
  console.error('Failed to initialize directories:', err);
});

// Serve static assets if needed
app.use('/static', express.static(path.join(__dirname, 'downloads')));

// Register router
app.use('/api', apiRouter);

// Serve frontend production build if available, or redirect root to dev server
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/static')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.redirect('http://localhost:3000');
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` AI B-Roll Downloader Server Initialized`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(`========================================`);
});
