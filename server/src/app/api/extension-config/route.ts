import { NextResponse } from 'next/server';

const CONFIG = {
  version: 1,
  enabled: true,
  selectors: {
    canvasPanel: '[data-canvas-panel], .canvas-container',
    codeTab: 'radio[aria-label*="Code"], button[aria-label*="Code"]',
    shareButton: 'button[aria-label*="Share and export"]'
  },
  detection: {
    monacoCheck: true,
    canvasPanelCheck: true
  },
  serverUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  publishEndpoint: '/api/publish'
};

export async function GET() {
  return NextResponse.json(CONFIG, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
