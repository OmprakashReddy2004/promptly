import { useState } from 'react';

const BACKEND_URL = 'http://localhost:5001';

export const useDocumentationAgent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentationProgress, setDocumentationProgress] = useState(0);

  // Lightweight documentation generator - NO AI REQUIRED
  const generateDocumentation = async (ideation, fileStructure) => {
    setIsGenerating(true);
    setDocumentationProgress(0);

    try {
      // Simulate progress
      setDocumentationProgress(20);

      const projectName = ideation?.projectName || 'Project';
      const description = ideation?.description || '';
      const features = ideation?.features || [];
      const techStack = ideation?.techStack || {};

      // Build documentation instantly from ideation data
      const documentation = {
        readme: generateReadme(ideation),
        apiDocs: generateApiDocs(fileStructure),
        componentDocs: generateComponentDocs(fileStructure),
        setupGuide: generateSetupGuide(ideation),
        changelog: generateChangelog(ideation)
      };

      setDocumentationProgress(100);
      return documentation;
    } catch (error) {
      console.error('Documentation generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      setDocumentationProgress(0);
    }
  };

  const generateReadme = (ideation) => {
    return `# ${ideation.projectName}

${ideation.description}

## ✨ Features

${ideation.features.map((f, i) => `- **${f.split(' ')[0]}** - ${f}`).join('\n')}

## 🚀 Quick Start

\`\`\`bash
npm install
npm start
\`\`\`

Visit http://localhost:3000

## 📋 Requirements

- Node.js 14+
- npm or yarn

## 🛠️ Tech Stack

**Frontend:** ${ideation.techStack.frontend.join(', ')}
**Backend:** ${ideation.techStack.backend.join(', ')}
${ideation.techStack.database ? `**Database:** ${ideation.techStack.database.join(', ')}` : ''}

## 🎨 Design System

- Primary Color: ${ideation.colorScheme.primary}
- Secondary Color: ${ideation.colorScheme.secondary}
- Accent Color: ${ideation.colorScheme.accent}

## 🎯 Target Audience

${ideation.targetAudience}

## 💡 Unique Selling Point

${ideation.uniqueSellingPoint}

## 📝 User Flow

${ideation.userFlow.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

Generated with AI Multi-Agent Platform ✨`;
  };

  const generateApiDocs = (fileStructure) => {
    return `# API Documentation

## Overview

This document describes all available API endpoints and functions.

## Core Functions

### useState

State management hook for React components.

\`\`\`javascript
const [state, setState] = useState(initialValue);
\`\`\`

### useEffect

Side effects management.

\`\`\`javascript
useEffect(() => {
  // Effect logic
}, [dependencies]);
\`\`\`

## Available Endpoints

### GET /api/health

Check backend health status.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

### POST /api/execute

Execute terminal commands.

**Request:**
\`\`\`json
{
  "command": "npm start",
  "cwd": ".",
  "sessionId": "session-id"
}
\`\`\`

### POST /api/generateDocs

Generate documentation from code.

**Request:**
\`\`\`json
{
  "fileSystem": { /* file structure */ }
}
\`\`\`

---

For more information, check the README.`;
  };

  const generateComponentDocs = (fileStructure) => {
    const components = extractComponents(fileStructure);
    
    return `# Component Documentation

## Overview

This section documents all React components in the project.

${components.map(comp => `
### ${comp.name}

**Location:** \`${comp.path}\`

**Description:** Component for ${comp.path.split('/').pop().replace('.jsx', '')}

**Props:**
- Standard React props supported

**Example:**
\`\`\`jsx
import ${comp.name} from '${comp.path}';

<${comp.name} prop="value" />
\`\`\`

**Usage:**
Add this component to your templates and customize as needed.

---
`).join('\n')}

## Best Practices

1. Keep components small and focused
2. Use proper PropTypes validation
3. Memoize expensive computations
4. Write meaningful JSDoc comments`;
  };

  const generateSetupGuide = (ideation) => {
    return `# Setup Guide

## Installation

### Prerequisites
- Node.js 14 or higher
- npm or yarn package manager

### Step 1: Install Dependencies

\`\`\`bash
npm install
\`\`\`

### Step 2: Environment Setup

Create a \`.env\` file in the root directory:

\`\`\`
REACT_APP_API_URL=http://localhost:5001
REACT_APP_GEMINI_API_KEY=your_api_key_here
\`\`\`

### Step 3: Start Development Server

\`\`\`bash
npm start
\`\`\`

The app will open at http://localhost:3000

### Step 4: Backend Setup (Optional)

If using the backend server:

\`\`\`bash
cd backend
npm install
npm start
\`\`\`

Backend runs on http://localhost:5001

## Running Tests

\`\`\`bash
npm test
\`\`\`

## Building for Production

\`\`\`bash
npm run build
\`\`\`

## Troubleshooting

### Port Already in Use

If port 3000 is taken:
\`\`\`bash
PORT=3001 npm start
\`\`\`

### Module Not Found

Clear node_modules and reinstall:
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### API Connection Issues

- Ensure backend is running on port 5001
- Check CORS settings
- Verify API_URL in .env file`;
  };

  const generateChangelog = (ideation) => {
    return `# Changelog

## Version 1.0.0 - Initial Release

### Features
${ideation.features.map(f => `- ${f}`).join('\n')}

### Tech Stack
- Frontend: ${ideation.techStack.frontend.join(', ')}
- Backend: ${ideation.techStack.backend.join(', ')}

### Initial Setup
- Project structure created
- Dependencies configured
- Development environment ready

### Known Issues
None at this time

---

For updates and future releases, check this changelog.`;
  };

  const extractComponents = (fileStructure) => {
    const components = [];
    
    const traverse = (node, path = '') => {
      if (!node) return;
      
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file' && (node.name.endsWith('.jsx') || node.name.endsWith('.js'))) {
        components.push({
          name: node.name.replace(/\.(jsx|js)$/, ''),
          path: currentPath
        });
      }
      
      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };
    
    traverse(fileStructure);
    return components;
  };

  const addDocumentationToFiles = (fileStructure, documentation) => {
    // Add docs as separate files
    const updated = JSON.parse(JSON.stringify(fileStructure));
    
    if (!updated.children) updated.children = [];
    
    const docsFolder = updated.children.find(c => c.name === 'docs');
    if (docsFolder) {
      // Update existing docs folder
      docsFolder.children = [
        { name: 'README.md', type: 'file', content: documentation.readme },
        { name: 'API.md', type: 'file', content: documentation.apiDocs },
        { name: 'COMPONENTS.md', type: 'file', content: documentation.componentDocs },
        { name: 'SETUP.md', type: 'file', content: documentation.setupGuide },
        { name: 'CHANGELOG.md', type: 'file', content: documentation.changelog }
      ];
    } else {
      // Create new docs folder
      updated.children.push({
        name: 'docs',
        type: 'folder',
        children: [
          { name: 'README.md', type: 'file', content: documentation.readme },
          { name: 'API.md', type: 'file', content: documentation.apiDocs },
          { name: 'COMPONENTS.md', type: 'file', content: documentation.componentDocs },
          { name: 'SETUP.md', type: 'file', content: documentation.setupGuide },
          { name: 'CHANGELOG.md', type: 'file', content: documentation.changelog }
        ]
      });
    }
    
    return updated;
  };

  return {
    generateDocumentation,
    addDocumentationToFiles,
    isGenerating,
    documentationProgress
  };
};

// Modal Component
export const DocumentationModal = ({ isOpen, onClose, progress }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">📘 Generating Documentation</h2>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Progress</span>
              <span className="text-purple-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-400">
            {progress < 50 ? '🔍 Analyzing code...' : 
             progress < 80 ? '✍️ Writing documentation...' :
             '🎨 Formatting output...'}
          </p>
        </div>

        <button
          onClick={onClose}
          disabled={progress < 100}
          className="mt-6 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {progress < 100 ? 'Generating...' : 'Close'}
        </button>
      </div>
    </div>
  );
};