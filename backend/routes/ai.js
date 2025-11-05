// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Rate limiting
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many AI requests, please try again later.'
});

// Apply rate limiting to all AI routes
router.use(aiLimiter);

// Generate ideation from user prompt
router.post('/ideation', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is too long (max 1000 characters)'
      });
    }

    console.log('🧠 Generating ideation for:', prompt.substring(0, 50) + '...');

    const ideation = await aiService.generateIdeation(prompt);

    res.json({
      success: true,
      data: ideation
    });

  } catch (error) {
    console.error('Ideation generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate ideation'
    });
  }
});

// Generate code from ideation
router.post('/generate-code', async (req, res) => {
  try {
    const { ideation, prompt } = req.body;

    if (!ideation || !ideation.projectName) {
      return res.status(400).json({
        success: false,
        error: 'Valid ideation is required'
      });
    }

    console.log('💻 Generating code for:', ideation.projectName);

    const codeStructure = await aiService.generateCode(ideation, prompt);

    res.json({
      success: true,
      data: codeStructure
    });

  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate code',
      fallback: true // Signal frontend to use fallback
    });
  }
});

// Generate documentation
router.post('/generate-docs', async (req, res) => {
  try {
    const { ideation, projectAnalysis } = req.body;

    if (!ideation || !projectAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Ideation and project analysis are required'
      });
    }

    console.log('📚 Generating documentation for:', ideation.projectName);

    const documentation = await aiService.generateDocumentation(projectAnalysis, ideation);

    res.json({
      success: true,
      data: documentation
    });

  } catch (error) {
    console.error('Documentation generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate documentation'
    });
  }
});

// Health check for AI service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'AI service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

// Add to backend/server.js:
// const aiRoutes = require('./routes/ai');
// app.use('/api/ai', aiRoutes);