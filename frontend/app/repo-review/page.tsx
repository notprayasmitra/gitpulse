'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function RepoReview() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentation, setDocumentation] = useState('');
  const [error, setError] = useState('');

  const handleGenerateDocumentation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDocumentation('');

    try {
      const response = await fetch('http://localhost:5000/api/review-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze repository blueprint.');

      setDocumentation(data.documentation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing comprehensive codebase document.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 flex flex-col items-center selection:bg-white selection:text-black">
      <Link href="/" className="text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mb-4 inline-block">
        &larr; Return to Central Hub
      </Link>      
      <div className="text-center w-full max-w-3xl space-y-8">
        <header className="space-y-2 py-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
            Repository Review System
          </h1>
          <p className="text-zinc-500 text-sm tracking-wider uppercase font-mono">
            Full codebase audit and review
          </p>
        </header>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl">
          <form onSubmit={handleGenerateDocumentation} className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
              Paste Target Repository URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
                autoComplete="off"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-black disabled:text-zinc-500 px-6 py-2.5 rounded text-sm font-mono font-bold transition-all uppercase tracking-wider whitespace-nowrap disabled:cursor-not-allowed"
              >
                {loading ? 'Compiling Document...' : 'Generate Documentation'}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 p-4 rounded-lg text-sm font-mono mt-4">
              <span className="text-white font-bold uppercase mr-2">[!] Failure:</span> {error}
            </div>
          )}
        </div>

        {documentation && (
          <div className="bg-zinc-950 p-6 md:p-8 rounded-xl border border-zinc-800 shadow-2xl duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                {"// System Architecture Specification Document"}
              </h2>
              <span className="text-[10px] font-mono uppercase bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 tracking-wider">
                Full-Suite Output
              </span>
            </div>
            
            {/* Styled Technical Markdown View Container */}
            <div className="text-zinc-300 leading-relaxed font-sans text-sm space-y-4 max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white font-mono border-b border-zinc-900 pb-1 mt-6 mb-3 uppercase tracking-wide" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold text-zinc-200 font-mono mt-5 mb-2 uppercase" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-zinc-300 font-mono mt-4 mb-1" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-sm font-semibold text-zinc-400 font-mono mt-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 my-2 text-zinc-400" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 my-2 text-zinc-400" {...props} />,
                  li: ({node, ...props}) => <li className="text-zinc-300 marker:text-zinc-600" {...props} />,
                  code: ({node, ...props}) => <code className="bg-zinc-900 text-zinc-100 px-1.5 py-0.5 rounded font-mono text-xs border border-zinc-800" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-zinc-900/40 p-4 rounded-lg overflow-x-auto my-4 border border-zinc-800 font-mono text-xs text-zinc-400 leading-normal" {...props} />,
                }}
              >
                {documentation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}