import { nanoid } from 'nanoid';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const CANVASES_FILE = join(DATA_DIR, 'canvases.json');

export interface CanvasEntry {
  id: string;
  title: string;
  code: string;
  language: string;
  source: string;
  createdAt: string;
  views: number;
}

interface CanvasStore {
  canvases: Record<string, CanvasEntry>;
}

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readStore(): Promise<CanvasStore> {
  try {
    await ensureDataDir();
    const data = await readFile(CANVASES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { canvases: {} };
  }
}

async function writeStore(store: CanvasStore): Promise<void> {
  await ensureDataDir();
  await writeFile(CANVASES_FILE, JSON.stringify(store, null, 2));
}

export async function createCanvas(
  code: string, 
  title: string, 
  language: string = 'tsx',
  source: string = 'gemini-canvas'
): Promise<CanvasEntry> {
  const store = await readStore();
  
  const id = nanoid(10);
  const entry: CanvasEntry = {
    id,
    title: title || 'Untitled Canvas',
    code,
    language,
    source,
    createdAt: new Date().toISOString(),
    views: 0
  };

  store.canvases[id] = entry;
  await writeStore(store);
  
  return entry;
}

export async function getCanvas(id: string): Promise<CanvasEntry | null> {
  const store = await readStore();
  const entry = store.canvases[id];
  
  if (entry) {
    entry.views++;
    store.canvases[id] = entry;
    await writeStore(store);
  }
  
  return entry || null;
}

export async function getAllCanvases(): Promise<CanvasEntry[]> {
  const store = await readStore();
  return Object.values(store.canvases).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
