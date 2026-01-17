'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CanvasEntry } from '@/lib/store';

interface CanvasViewerProps {
  canvas: CanvasEntry;
}

function transformImports(code: string) {
  return code
    .replace(/import\s+React[^;]*from\s+['"]react['"];?/g, '')
    .replace(/import\s+\{[^}]*\}\s+from\s+['"]react['"];?/g, '')
    .replace(/import\s+ReactDOM[^;]*from\s+['"]react-dom['"];?/g, '')
    .replace(/import\s+\{([^}]*)\}\s+from\s+['"]lucide-react['"];?/g, (_, imports) => {
      const iconNames = imports.split(',').map((s: string) => s.trim()).filter(Boolean);
      return `const { ${iconNames.join(', ')} } = LucideReact || {};`;
    })
    .replace(/export\s+default\s+/g, 'const App = ');
}

function generatePreviewHtml(code: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">
    {
      "imports": {
        "lucide-react": "https://esm.sh/lucide-react@0.263.1?external=react"
      }
    }
  </script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    ${transformImports(code)}
    
    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
}

export function CanvasViewer({ canvas }: CanvasViewerProps) {
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const renderPreview = useCallback(() => {
    if (!iframeRef.current) return;

    const html = generatePreviewHtml(canvas.code);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;
    
    iframeRef.current.onload = () => {
      URL.revokeObjectURL(url);
    };

    iframeRef.current.onerror = () => {
      setError('Failed to render preview');
    };
  }, [canvas.code]);

  useEffect(() => {
    if (view === 'preview' && iframeRef.current) {
      renderPreview();
    }
  }, [view, renderPreview]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(canvas.code);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-white">{canvas.title}</h1>
          <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
            {canvas.language}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setView('preview')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'preview' 
                  ? 'bg-zinc-700 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setView('code')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'code' 
                  ? 'bg-zinc-700 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Code
            </button>
          </div>
          
          <button
            type="button"
            onClick={copyCode}
            className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Copy
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        {view === 'preview' ? (
          <>
            {error ? (
              <div className="flex items-center justify-center h-full text-red-400">
                {error}
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts"
                title="Canvas Preview"
              />
            )}
          </>
        ) : (
          <pre className="h-full overflow-auto p-4 bg-zinc-900 text-zinc-100 text-sm font-mono">
            <code>{canvas.code}</code>
          </pre>
        )}
      </div>

      <footer className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
        <span>Published from {canvas.source}</span>
        <span>{canvas.views} views</span>
      </footer>
    </div>
  );
}
