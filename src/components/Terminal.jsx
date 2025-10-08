import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { X, Maximize2, Minimize2 } from 'lucide-react';

const Terminal = ({ onClose }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const currentLineRef = useRef('');

  useEffect(() => {
    // Wait for container to be ready
    if (!terminalRef.current) return;

    let term = null;
    let fitAddon = null;
    let mounted = true;

    // Initialize terminal with a small delay
    const initTimer = setTimeout(() => {
      if (!mounted || !terminalRef.current) return;

      try {
        // Initialize xterm
        term = new XTerm({
          cursorBlink: true,
          cursorStyle: 'block',
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: 14,
          theme: {
            background: '#1e1e1e',
            foreground: '#cccccc',
            cursor: '#ffffff',
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#ffffff',
          },
          scrollback: 1000,
          tabStopWidth: 4,
          allowProposedApi: true,
        });

        // Add addons
        fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        
        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        
        // Open terminal
        term.open(terminalRef.current);
        
        // Fit terminal after opening
        setTimeout(() => {
          if (fitAddon && mounted) {
            try {
              fitAddon.fit();
            } catch (e) {
              console.warn('Fit error:', e);
            }
          }
        }, 50);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        setIsReady(true);

        // Welcome message
        term.writeln('\x1b[1;32m╔════════════════════════════════════════╗\x1b[0m');
        term.writeln('\x1b[1;32m║  Welcome to Web Terminal (Browser)    ║\x1b[0m');
        term.writeln('\x1b[1;32m╚════════════════════════════════════════╝\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[33mNote: This is a browser-based terminal simulator.\x1b[0m');
        term.writeln('\x1b[33mLimited commands available: help, clear, echo, date, pwd, ls\x1b[0m');
        term.writeln('');
        writePrompt(term);

        // Command handling
        term.onKey(({ key, domEvent }) => {
          const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

          if (domEvent.keyCode === 13) { // Enter
            term.writeln('');
            if (currentLineRef.current.trim()) {
              executeCommand(term, currentLineRef.current.trim());
              commandHistoryRef.current.push(currentLineRef.current.trim());
              historyIndexRef.current = -1;
            }
            currentLineRef.current = '';
            writePrompt(term);
          } else if (domEvent.keyCode === 8) { // Backspace
            if (currentLineRef.current.length > 0) {
              currentLineRef.current = currentLineRef.current.slice(0, -1);
              term.write('\b \b');
            }
          } else if (domEvent.keyCode === 38) { // Up arrow
            if (commandHistoryRef.current.length > 0) {
              const newIndex = historyIndexRef.current === -1 
                ? commandHistoryRef.current.length - 1 
                : Math.max(0, historyIndexRef.current - 1);
              
              // Clear current line
              for (let i = 0; i < currentLineRef.current.length; i++) {
                term.write('\b \b');
              }
              
              currentLineRef.current = commandHistoryRef.current[newIndex];
              term.write(currentLineRef.current);
              historyIndexRef.current = newIndex;
            }
          } else if (domEvent.keyCode === 40) { // Down arrow
            if (historyIndexRef.current !== -1) {
              // Clear current line
              for (let i = 0; i < currentLineRef.current.length; i++) {
                term.write('\b \b');
              }
              
              const newIndex = historyIndexRef.current + 1;
              if (newIndex >= commandHistoryRef.current.length) {
                currentLineRef.current = '';
                historyIndexRef.current = -1;
              } else {
                currentLineRef.current = commandHistoryRef.current[newIndex];
                historyIndexRef.current = newIndex;
              }
              term.write(currentLineRef.current);
            }
          } else if (printable) {
            currentLineRef.current += key;
            term.write(key);
          }
        });

      } catch (error) {
        console.error('Terminal initialization error:', error);
      }
    }, 100);

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          console.warn('Resize error:', e);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      mounted = false;
      clearTimeout(initTimer);
      window.removeEventListener('resize', handleResize);
      if (term) {
        try {
          term.dispose();
        } catch (e) {
          console.warn('Dispose error:', e);
        }
      }
    };
  }, []);

  const writePrompt = (term) => {
    term.write('\x1b[1;36muser@webterm\x1b[0m:\x1b[1;34m~/project\x1b[0m$ ');
  };

  const executeCommand = (term, command) => {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd.toLowerCase()) {
      case 'help':
        term.writeln('\x1b[1;33mAvailable Commands:\x1b[0m');
        term.writeln('  \x1b[32mhelp\x1b[0m      - Show this help message');
        term.writeln('  \x1b[32mclear\x1b[0m     - Clear the terminal');
        term.writeln('  \x1b[32mecho\x1b[0m      - Echo text (e.g., echo Hello)');
        term.writeln('  \x1b[32mdate\x1b[0m      - Show current date and time');
        term.writeln('  \x1b[32mpwd\x1b[0m       - Print working directory');
        term.writeln('  \x1b[32mls\x1b[0m        - List files (simulated)');
        term.writeln('  \x1b[32mwhoami\x1b[0m    - Display current user');
        term.writeln('  \x1b[32muname\x1b[0m     - Print system information');
        term.writeln('  \x1b[32mcalc\x1b[0m      - Simple calculator (e.g., calc 5 + 3)');
        break;
      
      case 'clear':
        term.clear();
        break;
      
      case 'echo':
        term.writeln(args.join(' '));
        break;
      
      case 'date':
        term.writeln(new Date().toString());
        break;
      
      case 'pwd':
        term.writeln('/home/user/project');
        break;
      
      case 'ls':
        term.writeln('\x1b[1;34msrc\x1b[0m     \x1b[1;34mpublic\x1b[0m     \x1b[37mpackage.json\x1b[0m     \x1b[37mREADME.md\x1b[0m');
        break;
      
      case 'whoami':
        term.writeln('user');
        break;
      
      case 'uname':
        if (args[0] === '-a') {
          term.writeln('WebTerminal 1.0.0 Browser-Based Terminal Emulator');
        } else {
          term.writeln('WebTerminal');
        }
        break;
      
      case 'calc':
        try {
          const expression = args.join(' ');
          // Simple eval for basic math (be careful with this in production!)
          const result = Function('"use strict"; return (' + expression + ')')();
          term.writeln(`Result: ${result}`);
        } catch (e) {
          term.writeln('\x1b[31mError: Invalid expression\x1b[0m');
        }
        break;
      
      default:
        term.writeln(`\x1b[31mbash: ${cmd}: command not found\x1b[0m`);
        term.writeln('Type \x1b[33mhelp\x1b[0m for available commands');
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    setTimeout(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          console.warn('Fit error:', e);
        }
      }
    }, 100);
  };

  return (
    <div 
      className={`bg-gray-900 border-t border-gray-700 flex flex-col ${
        isMaximized ? 'fixed inset-0 z-50' : 'h-64'
      }`}
    >
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-gray-400 ml-2">Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMaximize}
            className="text-gray-400 hover:text-white p-1"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 p-1"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2 overflow-hidden bg-gray-900"
        style={{ 
          minHeight: isMaximized ? 'calc(100vh - 48px)' : '200px',
          height: '100%'
        }}
      />
    </div>
  );
};

export default Terminal;