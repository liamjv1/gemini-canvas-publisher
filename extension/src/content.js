(() => {
  const CONFIG_URL = 'http://localhost:3000/api/extension-config';
  const CONFIG_CACHE_KEY = 'gcp_config';
  const CONFIG_CACHE_TTL_MS = 3600000;
  const BUTTON_ID = 'gcp-publish-button';
  const CHECK_INTERVAL = 2000;
  const MAX_RETRIES = 5;

  const DEFAULT_CONFIG = {
    version: 1,
    enabled: true,
    serverUrl: 'http://localhost:3000',
    publishEndpoint: '/api/publish'
  };

  let config = null;
  let buttonInjected = false;
  let checkInterval = null;
  let retryCount = 0;

  async function getConfig() {
    try {
      const result = await chrome.storage.local.get(CONFIG_CACHE_KEY);
      const cached = result[CONFIG_CACHE_KEY];
      
      if (cached && Date.now() - cached.timestamp < CONFIG_CACHE_TTL_MS) {
        return cached.config;
      }

      const response = await fetch(CONFIG_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Config fetch failed');

      const remoteConfig = await response.json();
      await chrome.storage.local.set({
        [CONFIG_CACHE_KEY]: { config: remoteConfig, timestamp: Date.now() }
      });
      return { ...DEFAULT_CONFIG, ...remoteConfig };
    } catch (error) {
      console.log('[GCP] Using default config:', error.message);
      return DEFAULT_CONFIG;
    }
  }

  function checkMonaco() {
    try {
      return typeof monaco !== 'undefined' && 
             typeof monaco.editor !== 'undefined' &&
             typeof monaco.editor.getEditors === 'function';
    } catch {
      return false;
    }
  }

  function checkCanvasPanel() {
    const selectors = [
      '[data-canvas-panel]',
      '.canvas-container',
      '[role="tabpanel"][aria-label*="Canvas"]',
      'div:has(> [roledescription="editor"])'
    ];

    return selectors.some(sel => {
      try {
        return document.querySelector(sel) !== null;
      } catch {
        return false;
      }
    });
  }

  function extractCode() {
    try {
      if (typeof monaco !== 'undefined' && monaco.editor) {
        const editors = monaco.editor.getEditors();
        if (editors.length > 0) {
          return editors[0].getValue();
        }
      }

      const viewLines = document.querySelector('.monaco-editor .view-lines');
      if (viewLines) {
        return viewLines.textContent;
      }

      return null;
    } catch (error) {
      console.error('[GCP] Code extraction failed:', error);
      return null;
    }
  }

  function getCanvasTitle() {
    try {
      const titleSelectors = [
        '[data-canvas-title]',
        '.canvas-header h2',
        'h2[class*="canvas"]',
        '.canvas-panel h2'
      ];

      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent) {
          return el.textContent.trim();
        }
      }

      const code = extractCode();
      if (code) {
        const firstLine = code.split('\n')[0].slice(0, 50);
        return firstLine || 'Untitled Canvas';
      }

      return 'Untitled Canvas';
    } catch {
      return 'Untitled Canvas';
    }
  }

  async function detect() {
    const hasMonaco = checkMonaco();
    const hasCanvas = checkCanvasPanel();
    const code = extractCode();
    const canExtractCode = code !== null && code.length > 0;
    
    return {
      available: hasMonaco && hasCanvas && canExtractCode,
      checks: { hasMonaco, hasCanvas, canExtractCode }
    };
  }

  function findInjectionPoint() {
    const actionButtonSelectors = [
      'button[aria-label*="Share and export"]',
      'button[aria-label*="export"]',
      '[data-canvas-actions]',
      '.canvas-toolbar'
    ];

    for (const sel of actionButtonSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        return el.parentElement || el;
      }
    }

    const canvasHeader = document.querySelector('.canvas-header, [data-canvas-header]');
    if (canvasHeader) {
      return canvasHeader;
    }

    return null;
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) {
      buttonInjected = true;
      return;
    }

    const injectionPoint = findInjectionPoint();
    if (!injectionPoint) {
      console.log('[GCP] Could not find injection point');
      return;
    }

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'gcp-publish-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
      <span>Publish</span>
    `;
    button.title = 'Publish to shareable URL';
    button.addEventListener('click', handlePublish);

    injectionPoint.insertAdjacentElement('beforebegin', button);
    buttonInjected = true;
    console.log('[GCP] Publish button injected');
  }

  function removeButton() {
    const button = document.getElementById(BUTTON_ID);
    if (button) {
      button.remove();
      buttonInjected = false;
      console.log('[GCP] Publish button removed (canvas not available)');
    }
  }

  async function handlePublish() {
    const button = document.getElementById(BUTTON_ID);
    if (!button) return;

    const originalContent = button.innerHTML;
    
    try {
      button.disabled = true;
      button.innerHTML = '<span class="gcp-spinner"></span><span>Publishing...</span>';

      const code = extractCode();
      if (!code) {
        throw new Error('Could not extract code from canvas');
      }

      const title = getCanvasTitle();
      
      const response = await fetch(`${config.serverUrl}${config.publishEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          title,
          language: 'tsx',
          source: 'gemini-canvas'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Publish failed');
      }

      const result = await response.json();
      
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Copied!</span>
      `;
      button.classList.add('gcp-success');

      await navigator.clipboard.writeText(result.url);

      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('gcp-success');
        button.disabled = false;
      }, 3000);

    } catch (error) {
      console.error('[GCP] Publish failed:', error);
      
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>Failed</span>
      `;
      button.classList.add('gcp-error');

      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('gcp-error');
        button.disabled = false;
      }, 3000);
    }
  }

  function startDetectionLoop() {
    checkInterval = setInterval(async () => {
      const result = await detect();
      
      if (result.available && !buttonInjected) {
        injectButton();
        retryCount = 0;
      } else if (!result.available && buttonInjected) {
        removeButton();
      } else if (!result.available) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          console.log('[GCP] Canvas not detected, will keep checking...');
        }
      }
    }, CHECK_INTERVAL);
  }

  async function init() {
    config = await getConfig();
    
    if (!config.enabled) {
      console.log('[GCP] Extension disabled via remote config');
      return;
    }

    startDetectionLoop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  });
})();
