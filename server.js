import express from 'express';
import https from 'https';
import fs from 'fs';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config/env.js';
import { validateHeader, securityHeaders } from './middleware/auth.js';
import { saveFile, getFile, listFiles, deleteFile } from './utils/store.js';


const app = express();
const PORT = config.port || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

app.use(securityHeaders);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests'
});

app.use(limiter);

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(config.maxFileSize) || 100 * 1024 * 1024 // 100MB
  }
});

// Apply header validation to all routes
app.use(validateHeader);

// Serve static files
app.use(express.static('public'));

// API Routes

/**
 * Upload a file
 * @route POST /api/upload
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const metadata = await saveFile(req.file);
    res.json({
      success: true,
      file: {
        id: metadata.hashedName,
        name: metadata.originalName,
        size: metadata.size,
        uploadDate: metadata.uploadDate
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * List all files
 * @route GET /api/files
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
app.get('/api/files', async (req, res) => {
  try {
    const files = await listFiles();
    res.json({
      success: true,
      files: files.map(f => ({
        id: f.hashedName,
        name: f.originalName,
        size: f.size,
        uploadDate: f.uploadDate
      }))
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * Download a file
 * @route GET /api/download/:id
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
app.get('/api/download/:id', async (req, res) => {
  try {
    const { data, metadata } = await getFile(req.params.id);
    
    res.setHeader('Content-Type', metadata.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
    res.send(data);
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

/**
 * Delete a file
 * @route DELETE /api/files/:id
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
app.delete('/api/files/:id', async (req, res) => {
  try {
    await deleteFile(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// HTTPS Server
const httpsOptions = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem')
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`🔒 Secure file host running on https://localhost:${PORT}`);
  console.log(`Required header: ${config.secretHeaderName}`);
});