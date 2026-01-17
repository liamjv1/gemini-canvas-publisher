import { getCanvas } from '@/lib/store';
import { notFound } from 'next/navigation';
import { CanvasViewer } from './canvas-viewer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CanvasPage({ params }: PageProps) {
  const { id } = await params;
  const canvas = await getCanvas(id);

  if (!canvas) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <CanvasViewer canvas={canvas} />
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const canvas = await getCanvas(id);

  if (!canvas) {
    return { title: 'Canvas Not Found' };
  }

  return {
    title: canvas.title,
    description: `Published from ${canvas.source}`,
  };
}
