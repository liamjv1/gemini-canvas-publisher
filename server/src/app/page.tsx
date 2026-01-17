import { getAllCanvases } from '@/lib/store';
import Link from 'next/link';

export default async function Home() {
  const canvases = await getAllCanvases();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold">Gemini Canvas Publisher</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Share your Gemini Canvas creations with a simple link
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <section className="mb-12">
          <h2 className="text-lg font-medium mb-4">How it works</h2>
          <ol className="space-y-3 text-zinc-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-sm">1</span>
              <span>Install the browser extension</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-sm">2</span>
              <span>Open a Gemini Canvas with code</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-sm">3</span>
              <span>Click the &quot;Publish&quot; button</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-sm">4</span>
              <span>Share the URL with anyone</span>
            </li>
          </ol>
        </section>

        {canvases.length > 0 && (
          <section>
            <h2 className="text-lg font-medium mb-4">Recent Canvases</h2>
            <div className="grid gap-4">
              {canvases.slice(0, 10).map((canvas) => (
                <Link
                  key={canvas.id}
                  href={`/canvas/${canvas.id}`}
                  className="block p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{canvas.title}</h3>
                    <span className="text-xs text-zinc-500">
                      {new Date(canvas.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                    <span>{canvas.language}</span>
                    <span>{canvas.views} views</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {canvases.length === 0 && (
          <section className="text-center py-12 text-zinc-500">
            <p>No canvases published yet</p>
            <p className="text-sm mt-1">Install the extension and publish your first canvas</p>
          </section>
        )}
      </main>
    </div>
  );
}
