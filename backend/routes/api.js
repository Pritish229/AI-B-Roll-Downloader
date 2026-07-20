const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const projectController = require('../controllers/projectController');

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.srt') {
      return cb(new Error('Only .srt files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for SRT (subtitles are text, usually under 100KB)
  }
});

// Upload route
router.post('/upload', (req, res, next) => {
  upload.single('srtFile')(req, res, err => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, (req, res) => projectController.uploadSrt(req, res));

// Retrieve script
router.get('/script/:projectId', (req, res) => projectController.getScript(req, res));

// Transcribe raw text script (Premiere Pro style)
router.post('/transcribe', (req, res) => projectController.transcribeScript(req, res));

// Generate cinematic story
router.post('/story/generate', (req, res) => projectController.generateStory(req, res));

// Generate cinematic tags
router.post('/tags/generate', (req, res) => projectController.generateTags(req, res));

// Download and package assets
router.post('/assets/download', (req, res) => projectController.downloadAssets(req, res));

// Check download progress
router.get('/assets/progress/:projectId', (req, res) => projectController.getProgress(req, res));

// Download complete zip
router.get('/download/:projectId', (req, res) => projectController.downloadZip(req, res));

// Quick delete project files
router.post('/cleanup/:projectId', (req, res) => projectController.quickDelete(req, res));

// Open folder browser dialog (Windows native)
router.post('/select-folder', (req, res) => projectController.selectFolder(req, res));

// Open generated folder in Windows Explorer
router.post('/open-folder', (req, res) => projectController.openFolder(req, res));

// Pinterest: test access token connection
router.get('/pinterest/test', async (req, res) => {
  const pinterestService = require('../services/pinterestService');
  const result = await pinterestService.testConnection();
  return res.status(result.success ? 200 : 401).json(result);
});

// Pinterest: search pins by keyword
router.get('/pinterest/search', async (req, res) => {
  const pinterestService = require('../services/pinterestService');
  const { query, limit, aspectRatio } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }
  try {
    const results = await pinterestService.searchImages(
      query,
      parseInt(limit, 10) || 5,
      aspectRatio || '16:9'
    );
    return res.status(200).json({ query, count: results.length, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
