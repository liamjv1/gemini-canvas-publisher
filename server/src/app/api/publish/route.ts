import { NextRequest, NextResponse } from 'next/server';
import { createCanvas } from '@/lib/store';

const MAX_CODE_SIZE = 500000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, title, language, source } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    if (code.length > MAX_CODE_SIZE) {
      return NextResponse.json(
        { error: 'Code exceeds maximum size limit' },
        { status: 400 }
      );
    }

    const entry = await createCanvas(code, title, language, source);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/canvas/${entry.id}`;

    return NextResponse.json({
      success: true,
      id: entry.id,
      url,
      createdAt: entry.createdAt
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish canvas' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://gemini.google.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
