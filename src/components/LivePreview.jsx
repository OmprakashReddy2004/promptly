import React, { useState, useEffect, useRef } from 'react';
import { Eye, Code, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

const LivePreview = ({ fileSystem, activeFile }) => {
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const iframeRef = useRef(null);

  // Extract all files from file system
  const extractFiles = (node, path = '') => {
    const files = {};
    const currentPath = path ? `${path}/${node.name}` : node.name;

    if (node.type === 'file') {
      files[currentPath] = node.content || '';
    }

    if (node.type === 'folder' && node.children) {
      node.children.forEach(child => {
        Object.assign(files, extractFiles(child, currentPath));
      });
    }

    return files;
  };

  // Generate preview HTML
  const generatePreview = () => {
    setIsRefreshing(true);
    setError(null);
    setDebugInfo('');

    try {
      const files = extractFiles(fileSystem);
      console.log('📁 All files:', Object.keys(files));
      
      // Try multiple possible paths for App file
      const possibleAppPaths = [
        'src/App.jsx',
        'src/App.js',
        'project-root/src/App.jsx',
        'project-root/src/App.js',
      ];
      
      let appFile = null;
      let appPath = null;
      
      for (const path of possibleAppPaths) {
        if (files[path]) {
          appFile = files[path];
          appPath = path;
          break;
        }
      }
      
      // If not found in standard paths, search all files
      if (!appFile) {
        const appFileEntry = Object.entries(files).find(([path, content]) => 
          (path.includes('App.jsx') || path.includes('App.js')) && content && content.length > 0
        );
        
        if (appFileEntry) {
          appPath = appFileEntry[0];
          appFile = appFileEntry[1];
        }
      }

      if (!appFile) {
        setDebugInfo(`Available files: ${Object.keys(files).join(', ')}`);
        throw new Error('No App.jsx or App.js file found in the project');
      }

      console.log('✅ Found App file at:', appPath);
      console.log('📄 App content length:', appFile.length);
      
      // Find CSS files
      const appCss = files['src/App.css'] || files['project-root/src/App.css'] || '';
      const indexCss = files['src/index.css'] || files['project-root/src/index.css'] || '';

      // Clean up the component code - MORE AGGRESSIVE CLEANING
      let componentCode = appFile;
      
      // Remove ALL import statements
      componentCode = componentCode.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*/g, '');
      componentCode = componentCode.replace(/import\s+['"][^'"]+['"];?\s*/g, '');
      
      // Remove export statements
      componentCode = componentCode.replace(/export\s+default\s+\w+;?\s*/g, '');
      componentCode = componentCode.replace(/export\s+{[^}]*};?\s*/g, '');
      
      // Remove any duplicate hook declarations if they exist
      componentCode = componentCode.replace(/const\s+{\s*useState[^}]*}\s*=\s*React;?\s*/g, '');
      
      console.log('🔧 Cleaned component (first 300 chars):', componentCode.substring(0, 300));

      // Create preview HTML - FIXED BABEL ISSUE
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    #root {
      min-height: 100vh;
    }
    ${indexCss}
    ${appCss}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="text/babel" data-type="module">
    // Get React hooks from the global React object
    const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext } = React;
    
    // Your component code
    ${componentCode}

    // Mount the component
    const rootElement = document.getElementById('root');
    if (rootElement) {
      try {
        const root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(App, null));
        console.log('✅ App mounted successfully');
      } catch (err) {
        console.error('❌ Error mounting App:', err);
        rootElement.innerHTML = \`
          <div style="padding: 40px; font-family: monospace; background: #fee; border-left: 4px solid #f44; margin: 20px;">
            <h3 style="color: #c00; margin-bottom: 10px;">⚠️ Preview Error</h3>
            <p style="color: #600; margin-bottom: 10px;">\${err.message}</p>
            <pre style="background: #fff; padding: 10px; overflow: auto; font-size: 12px;">\${err.stack}</pre>
          </div>
        \`;
      }
    }
  </script>
  
  <script>
    // Global error handler
    window.addEventListener('error', function(event) {
      console.error('Preview Runtime Error:', event.error);
      const rootElement = document.getElementById('root');
      if (rootElement && !rootElement.innerHTML) {
        rootElement.innerHTML = \`
          <div style="padding: 40px; font-family: monospace; background: #fee; border-left: 4px solid #f44; margin: 20px;">
            <h3 style="color: #c00; margin-bottom: 10px;">⚠️ Runtime Error</h3>
            <p style="color: #600;">\${event.error.message}</p>
          </div>
        \`;
      }
    });
  </script>
</body>
</html>`;

      setPreviewHtml(html);
      setDebugInfo(`✅ Preview generated from ${appPath}`);
      console.log('🎉 Preview HTML generated successfully');
    } catch (err) {
      console.error('❌ Preview generation error:', err);
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate preview on mount and when files change
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [fileSystem]);

  // Refresh iframe
  const handleRefresh = () => {
    generatePreview();
  };

  // Open in new tab
  const openInNewTab = () => {
    const newWindow = window.open();
    newWindow.document.write(previewHtml);
    newWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Preview Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Live Preview</span>
          {isRefreshing && (
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
          )}
          {debugInfo && (
            <span className="text-xs text-green-400 ml-2">{debugInfo}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          
          <button
            onClick={openInNewTab}
            disabled={!previewHtml}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Open in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {error ? (
          <div className="h-full flex items-center justify-center bg-red-50">
            <div className="text-center p-8 max-w-2xl">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Preview Error
              </h3>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              {debugInfo && (
                <p className="text-xs text-gray-600 mb-4 font-mono bg-gray-100 p-3 rounded text-left whitespace-pre-wrap">
                  {debugInfo}
                </p>
              )}
              <button
                onClick={generatePreview}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : !previewHtml ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Generating preview...</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            title="Live Preview"
          />
        )}
      </div>

      {/* Preview Info Footer */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Preview updates automatically when files change</span>
          <span className="flex items-center gap-1">
            <Code className="w-3 h-3" />
            React 18 • Babel • Tailwind CSS
          </span>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;