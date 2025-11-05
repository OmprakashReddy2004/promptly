// backend/services/aiService.js
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

class AIService {
  constructor() {
    // ⭐ FIX: Don't throw error in constructor - just warn
    if (!GEMINI_API_KEY) {
      console.warn('⚠️  WARNING: GEMINI_API_KEY is not set in environment variables');
      console.warn('⚠️  AI features will not work until you set the API key');
      console.warn('⚠️  Create backend/.env file and add: GEMINI_API_KEY=your-key');
    } else {
      console.log('✅ Gemini API key loaded successfully');
    }
  }

  // Helper method to check if API key is available
  _checkApiKey() {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please add it to backend/.env file');
    }
  }

  async generateIdeation(userPrompt) {
    this._checkApiKey(); // Check before making API call

    const prompt = `You are a product ideation specialist. Based on the following user prompt, create a detailed project ideation plan.

User Prompt: "${userPrompt}"

CRITICAL: Return ONLY valid JSON (no markdown, no explanations, no code blocks).

EXACT FORMAT:
{
  "projectName": "A catchy name for the project",
  "description": "2-3 sentence description of what the project does",
  "features": [
    "Feature 1 with brief description",
    "Feature 2 with brief description",
    "Feature 3 with brief description",
    "Feature 4 with brief description"
  ],
  "techStack": {
    "frontend": ["React", "Tailwind CSS"],
    "backend": ["Node.js", "Express"],
    "database": ["MongoDB"],
    "other": []
  },
  "colorScheme": {
    "primary": "#6366f1",
    "secondary": "#8b5cf6",
    "accent": "#ec4899",
    "background": "#ffffff",
    "text": "#1f2937",
    "description": "Modern and professional"
  },
  "styleGuidelines": {
    "layout": "Clean and minimal",
    "typography": "Inter font family",
    "iconography": "Line icons",
    "animation": "Subtle transitions"
  },
  "userFlow": ["Step 1", "Step 2", "Step 3"],
  "targetAudience": "Who is this app for",
  "uniqueSellingPoint": "What makes this project special"
}`;

    try {
      const response = await fetch(`${GEMINI_API_URL}/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]) {
        throw new Error('Invalid response from Gemini API');
      }

      const content = data.candidates[0].content.parts[0].text;
      return this.parseJSONSafely(content);

    } catch (error) {
      console.error('Ideation generation error:', error);
      throw error;
    }
  }

  async generateCode(ideation, userPrompt) {
    this._checkApiKey();

    const prompt = `Generate a complete React application file structure based on this ideation:

${JSON.stringify(ideation, null, 2)}

Original user request: "${userPrompt}"

Requirements:
1. Return ONLY valid JSON
2. Create a functional React app with working features
3. Include complete, runnable code in each file
4. Use modern React patterns (hooks, functional components)
5. Style with Tailwind CSS inline classes
6. Make it production-ready

Return format:
{
  "name": "project-root",
  "type": "folder",
  "children": [
    {
      "name": "src",
      "type": "folder",
      "children": [
        {
          "name": "App.jsx",
          "type": "file",
          "content": "// Complete working React component code here"
        }
      ]
    }
  ]
}`;

    try {
      const response = await fetch(`${GEMINI_API_URL}/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192
          }
        })
      });

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      return this.parseJSONSafely(content);

    } catch (error) {
      console.error('Code generation error:', error);
      throw error;
    }
  }

  async generateDocumentation(projectAnalysis, ideation) {
    this._checkApiKey();

    const analyses = {
      readme: await this.generateREADME(ideation, projectAnalysis),
      apiDocs: await this.generateAPIDocs(projectAnalysis),
      componentDocs: await this.generateComponentDocs(projectAnalysis),
      setupGuide: await this.generateSetupGuide(ideation, projectAnalysis)
    };

    return analyses;
  }

  async generateREADME(ideation, analysis) {
    const prompt = `Generate a professional README.md for this project:

Project: ${JSON.stringify(ideation, null, 2)}
Analysis: ${JSON.stringify(analysis, null, 2)}

Create sections: Title, Description, Features, Tech Stack, Installation, Usage, Structure, Contributing, License

Return ONLY markdown content.`;

    return await this.callGemini(prompt, 4096);
  }

  async generateAPIDocs(analysis) {
    if (!analysis.backendFiles || analysis.backendFiles.length === 0) {
      return null;
    }

    const prompt = `Generate API documentation for these backend files:

${JSON.stringify(analysis.backendFiles, null, 2)}

Include: Base URL, Authentication, Endpoints (method, path, params, response), Error codes

Return ONLY markdown.`;

    return await this.callGemini(prompt, 4096);
  }

  async generateComponentDocs(analysis) {
    if (!analysis.components || analysis.components.length === 0) {
      return null;
    }

    const prompt = `Document these React components:

${JSON.stringify(analysis.components, null, 2)}

For each: Name, Purpose, Props, State, Methods, Usage example

Return ONLY markdown.`;

    return await this.callGemini(prompt, 4096);
  }

  async generateSetupGuide(ideation, analysis) {
    const prompt = `Create setup guide for:

Project: ${ideation.projectName}
Stack: ${JSON.stringify(ideation.techStack)}
Dependencies: ${analysis.dependencies?.join(', ')}

Include: Prerequisites, Installation, Environment setup, Development, Build, Deployment, Troubleshooting

Return ONLY markdown.`;

    return await this.callGemini(prompt, 4096);
  }

  async callGemini(prompt, maxTokens = 2048) {
    this._checkApiKey();

    try {
      const response = await fetch(`${GEMINI_API_URL}/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: maxTokens
          }
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  parseJSONSafely(content) {
    // Remove markdown code blocks
    content = content
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    // Try direct parse
    try {
      return JSON.parse(content);
    } catch (e) {
      // Extract JSON object
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {
          // Last attempt: fix common issues
          let fixed = match[0]
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/[\u0000-\u001F]+/g, ''); // Remove control chars
          
          return JSON.parse(fixed);
        }
      }
    }

    throw new Error('Failed to parse JSON from AI response');
  }
}

module.exports = new AIService();