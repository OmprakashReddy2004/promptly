import { useState, useCallback } from 'react';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key-here';

export const useTestingAgent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testProgress, setTestProgress] = useState(null);
  const [testResults, setTestResults] = useState(null);

  // Analyze code for testing
  const analyzeCodeForTesting = useCallback((fileStructure) => {
    const analysis = {
      components: [],
      utilities: [],
      apis: [],
      hooks: [],
      testableFiles: []
    };

    const traverse = (node, path = '') => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        const ext = node.name.split('.').pop();
        const content = node.content || '';
        
        if (!['js', 'jsx', 'ts', 'tsx'].includes(ext)) return;

        const fileInfo = {
          name: node.name,
          path: currentPath,
          content,
          type: 'unknown'
        };

        // Identify file type
        if (content.includes('function') && content.includes('return') && content.includes('React')) {
          fileInfo.type = 'component';
          analysis.components.push(fileInfo);
        } else if (content.includes('export') && !content.includes('default') && !content.includes('React')) {
          fileInfo.type = 'utility';
          analysis.utilities.push(fileInfo);
        } else if (content.includes('fetch') || content.includes('axios') || content.includes('api')) {
          fileInfo.type = 'api';
          analysis.apis.push(fileInfo);
        } else if (content.includes('use') && content.includes('function')) {
          fileInfo.type = 'hook';
          analysis.hooks.push(fileInfo);
        }

        if (fileInfo.type !== 'unknown') {
          analysis.testableFiles.push(fileInfo);
        }
      }

      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };

    traverse(fileStructure);
    return analysis;
  }, []);

  // Generate tests for a file
  const generateTestsForFile = async (fileInfo) => {
    try {
      const prompt = `Generate comprehensive Jest tests for this ${fileInfo.type}:

File: ${fileInfo.name}
Type: ${fileInfo.type}
Code:
${fileInfo.content}

Generate tests that include:
1. Unit tests for all functions/methods
2. Edge cases and error handling
3. Mock implementations for external dependencies
4. Integration tests if applicable
5. Proper setup and teardown

Return ONLY the test code with proper Jest syntax. Include imports and describe blocks.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096
            }
          })
        }
      );

      const data = await response.json();
      let testCode = data.candidates[0].content.parts[0].text.trim();
      
      // Clean up code blocks
      testCode = testCode.replace(/```javascript\n?/g, '').replace(/```jsx\n?/g, '').replace(/```\n?/g, '');
      
      return testCode;
    } catch (error) {
      console.error('Test generation error:', error);
      return generateFallbackTest(fileInfo);
    }
  };

  // Generate test suite
  const generateTestSuite = useCallback(async (fileStructure) => {
    setIsGenerating(true);
    setTestProgress({ stage: 'analyzing', progress: 10 });

    try {
      const analysis = analyzeCodeForTesting(fileStructure);
      
      if (analysis.testableFiles.length === 0) {
        setIsGenerating(false);
        return {
          success: false,
          message: 'No testable files found'
        };
      }

      const tests = {};
      const totalFiles = analysis.testableFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = analysis.testableFiles[i];
        
        setTestProgress({
          stage: 'generating',
          progress: 10 + (70 * (i / totalFiles)),
          current: file.name,
          total: totalFiles
        });

        const testCode = await generateTestsForFile(file);
        const testFileName = file.name.replace(/\.(jsx?|tsx?)$/, '.test.$1');
        const testPath = file.path.replace(file.name, `__tests__/${testFileName}`);
        
        tests[testPath] = {
          name: testFileName,
          path: testPath,
          content: testCode,
          originalFile: file.path
        };
      }

      // Generate test configuration
      setTestProgress({ stage: 'config', progress: 85 });
      const testConfig = generateTestConfig();
      
      setTestProgress({ stage: 'complete', progress: 100 });
      setIsGenerating(false);

      return {
        success: true,
        tests,
        config: testConfig,
        summary: {
          totalTests: Object.keys(tests).length,
          components: analysis.components.length,
          utilities: analysis.utilities.length,
          apis: analysis.apis.length,
          hooks: analysis.hooks.length
        }
      };

    } catch (error) {
      console.error('Test suite generation error:', error);
      setIsGenerating(false);
      setTestProgress(null);
      return {
        success: false,
        error: error.message
      };
    }
  }, [analyzeCodeForTesting]);

  // Run static analysis
  const runStaticAnalysis = useCallback(async (fileContent, filePath) => {
    const issues = [];

    // Check for common issues
    const checks = [
      {
        pattern: /console\.log/g,
        severity: 'warning',
        message: 'Console.log statement found'
      },
      {
        pattern: /debugger/g,
        severity: 'error',
        message: 'Debugger statement found'
      },
      {
        pattern: /var\s+/g,
        severity: 'warning',
        message: 'Use const or let instead of var'
      },
      {
        pattern: /==\s*[^=]/g,
        severity: 'warning',
        message: 'Use === instead of =='
      },
      {
        pattern: /catch\s*\(\s*\)\s*{/g,
        severity: 'warning',
        message: 'Empty catch block'
      }
    ];

    checks.forEach(check => {
      const matches = fileContent.match(check.pattern);
      if (matches) {
        issues.push({
          file: filePath,
          severity: check.severity,
          message: check.message,
          count: matches.length
        });
      }
    });

    // Check complexity
    const lines = fileContent.split('\n');
    if (lines.length > 500) {
      issues.push({
        file: filePath,
        severity: 'warning',
        message: `File is too large (${lines.length} lines). Consider splitting it.`
      });
    }

    // Check cyclomatic complexity (simplified)
    const complexity = (fileContent.match(/if|else|for|while|case|catch|\?\?|\|\||&&/g) || []).length;
    if (complexity > 50) {
      issues.push({
        file: filePath,
        severity: 'warning',
        message: `High cyclomatic complexity (${complexity}). Consider refactoring.`
      });
    }

    return issues;
  }, []);

  // Analyze entire codebase
  const analyzeCodebase = useCallback(async (fileStructure) => {
    const allIssues = [];
    const metrics = {
      totalFiles: 0,
      totalLines: 0,
      testCoverage: 0,
      codeQuality: 0
    };

    const traverse = async (node, path = '') => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        const ext = node.name.split('.').pop();
        if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
          metrics.totalFiles++;
          metrics.totalLines += (node.content || '').split('\n').length;
          
          const issues = await runStaticAnalysis(node.content || '', currentPath);
          allIssues.push(...issues);
        }
      }

      if (node.type === 'folder' && node.children) {
        for (const child of node.children) {
          await traverse(child, currentPath);
        }
      }
    };

    await traverse(fileStructure);

    // Calculate quality score
    const errorCount = allIssues.filter(i => i.severity === 'error').length;
    const warningCount = allIssues.filter(i => i.severity === 'warning').length;
    metrics.codeQuality = Math.max(0, 100 - (errorCount * 10 + warningCount * 2));

    return {
      issues: allIssues,
      metrics
    };
  }, [runStaticAnalysis]);

  // Generate fallback test
  const generateFallbackTest = (fileInfo) => {
    const testName = fileInfo.name.replace(/\.(jsx?|tsx?)$/, '');
    
    return `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ${testName} from './${fileInfo.name}';

describe('${testName}', () => {
  it('should render without crashing', () => {
    render(<${testName} />);
  });

  it('should match snapshot', () => {
    const { container } = render(<${testName} />);
    expect(container).toMatchSnapshot();
  });

  // Add more tests here
});`;
  };

  // Generate test configuration
  const generateTestConfig = () => {
    return {
      'jest.config.js': `module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};`,
      'package.json.additions': {
        scripts: {
          test: 'jest',
          'test:watch': 'jest --watch',
          'test:coverage': 'jest --coverage'
        },
        devDependencies: {
          '@testing-library/react': '^13.4.0',
          '@testing-library/jest-dom': '^5.16.5',
          '@testing-library/user-event': '^14.4.3',
          jest: '^29.5.0',
          'jest-environment-jsdom': '^29.5.0'
        }
      }
    };
  };

  // Add tests to file structure
  const addTestsToFileStructure = useCallback((fileStructure, testSuite) => {
    const newFileStructure = JSON.parse(JSON.stringify(fileStructure));

    // Find or create src folder
    let srcFolder = newFileStructure.children?.find(c => c.name === 'src' && c.type === 'folder');
    
    if (!srcFolder) {
      return newFileStructure;
    }

    // Add __tests__ folder
    let testsFolder = srcFolder.children?.find(c => c.name === '__tests__' && c.type === 'folder');
    
    if (!testsFolder) {
      testsFolder = {
        name: '__tests__',
        type: 'folder',
        children: []
      };
      srcFolder.children.push(testsFolder);
    }

    // Add test files
    Object.values(testSuite.tests).forEach(test => {
      const exists = testsFolder.children.some(c => c.name === test.name);
      if (!exists) {
        testsFolder.children.push({
          name: test.name,
          type: 'file',
          content: test.content
        });
      }
    });

    // Add jest config to root
    if (!newFileStructure.children) newFileStructure.children = [];
    
    const jestConfigExists = newFileStructure.children.some(c => c.name === 'jest.config.js');
    if (!jestConfigExists) {
      newFileStructure.children.push({
        name: 'jest.config.js',
        type: 'file',
        content: testSuite.config['jest.config.js']
      });
    }

    return newFileStructure;
  }, []);

  return {
    generateTestSuite,
    analyzeCodebase,
    addTestsToFileStructure,
    isGenerating,
    testProgress,
    testResults,
    setTestResults
  };
};

// Testing Agent Modal Component
export const TestingModal = ({ isOpen, onClose, progress, results }) => {
  if (!isOpen) return null;

  const getProgressColor = () => {
    if (!progress) return 'bg-purple-500';
    if (progress.progress >= 85) return 'bg-green-500';
    if (progress.progress >= 50) return 'bg-blue-500';
    return 'bg-purple-500';
  };

  const getStageText = () => {
    if (!progress) return 'Initializing...';
    switch (progress.stage) {
      case 'analyzing': return 'Analyzing codebase...';
      case 'generating': return `Generating tests (${progress.current || ''})...`;
      case 'config': return 'Creating test configuration...';
      case 'complete': return 'Tests generated successfully!';
      default: return 'Processing...';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full border-2 border-blue-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {progress?.stage === 'complete' ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Testing Agent</h2>
          <p className="text-gray-400">{getStageText()}</p>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-6">
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
                style={{ width: `${progress.progress || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>Progress</span>
              <span>{progress.progress || 0}%</span>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {results && (
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Test Suite Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/20 rounded p-3">
                  <div className="text-2xl font-bold text-blue-400">{results.summary?.totalTests || 0}</div>
                  <div className="text-sm text-gray-300">Total Tests</div>
                </div>
                <div className="bg-green-500/20 rounded p-3">
                  <div className="text-2xl font-bold text-green-400">{results.summary?.components || 0}</div>
                  <div className="text-sm text-gray-300">Components</div>
                </div>
                <div className="bg-purple-500/20 rounded p-3">
                  <div className="text-2xl font-bold text-purple-400">{results.summary?.utilities || 0}</div>
                  <div className="text-sm text-gray-300">Utilities</div>
                </div>
                <div className="bg-cyan-500/20 rounded p-3">
                  <div className="text-2xl font-bold text-cyan-400">{results.summary?.hooks || 0}</div>
                  <div className="text-sm text-gray-300">Hooks</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Generated Files:</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                {Object.keys(results.tests || {}).slice(0, 5).map((path, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="font-mono">{path.split('/').pop()}</span>
                  </li>
                ))}
                {Object.keys(results.tests || {}).length > 5 && (
                  <li className="text-gray-500">
                    ... and {Object.keys(results.tests).length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {progress?.stage === 'complete' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                Add Tests to Project
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </>
          )}
          {!progress || progress.stage !== 'complete' && (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default useTestingAgent;