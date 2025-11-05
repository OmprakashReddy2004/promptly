// src/services/apiClient.js
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

class APIClient {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;

    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // AI Operations
  async generateIdeation(prompt) {
    return this.request('/api/ai/ideation', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
  }

  async generateCode(ideation, prompt) {
    return this.request('/api/ai/generate-code', {
      method: 'POST',
      body: JSON.stringify({ ideation, prompt })
    });
  }

  async generateDocumentation(ideation, projectAnalysis) {
    return this.request('/api/ai/generate-docs', {
      method: 'POST',
      body: JSON.stringify({ ideation, projectAnalysis })
    });
  }

  // File Operations
  async executeCommand(command, cwd = '.', sessionId) {
    return this.request('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ command, cwd, sessionId })
    });
  }

  async readFile(filePath) {
    return this.request('/api/readFile', {
      method: 'POST',
      body: JSON.stringify({ filePath })
    });
  }

  async writeFile(filePath, content) {
    return this.request('/api/writeFile', {
      method: 'POST',
      body: JSON.stringify({ filePath, content })
    });
  }

  async listDirectory(dirPath = '.') {
    return this.request('/api/listDir', {
      method: 'POST',
      body: JSON.stringify({ dirPath })
    });
  }

  async createDirectory(dirPath) {
    return this.request('/api/createDir', {
      method: 'POST',
      body: JSON.stringify({ dirPath })
    });
  }

  async deleteFile(filePath) {
    return this.request('/api/delete', {
      method: 'POST',
      body: JSON.stringify({ filePath })
    });
  }

  async killProcess(sessionId) {
    return this.request('/api/kill', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }

  async getWorkspacePath() {
    return this.request('/api/workspace', {
      method: 'GET'
    });
  }

  async healthCheck() {
    return this.request('/api/health', {
      method: 'GET'
    });
  }

  async aiHealthCheck() {
    return this.request('/api/ai/health', {
      method: 'GET'
    });
  }
}

export default new APIClient();