'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface PullRequest {
  number: number;
  title: string;
  url: string;
  author: string;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [selectedPrUrl, setSelectedPrUrl] = useState('');
  
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  
  const [review, setReview] = useState('');
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleFetchPRs = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPrs(true);
    setError('');
    setReview('');
    setPrs([]);
    setSelectedPrUrl('');
    setHasSearched(false);

    try {
      const response = await fetch('http://localhost:5000/api/fetch-prs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch PRs');

      setPrs(data.prs || []);
      if (data.prs && data.prs.length > 0) {
        setSelectedPrUrl(data.prs[0].url);
      }
      setHasSearched(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error scanning repository';
      setError(msg);
    } finally {
      setLoadingPrs(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrUrl) return;
    
    setLoadingReview(true);
    setError('');
    setReview('');

    try {
      const response = await fetch('http://localhost:5000/api/review-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl: selectedPrUrl }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      setReview(data.review);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch review';
      setError(msg);
    } finally {
      setLoadingReview(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 flex flex-col items-center selection:bg-white selection:text-black">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header Section */}
        <header className="text-center space-y-2 py-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-mono uppercase">
            Git-Pulse
          </h1>
          <p className="text-zinc-500 text-sm tracking-wider uppercase font-mono">
            Automated PR Review System
          </p>
        </header>

        {/* Control Center Container */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-6">
          
          {/* Repository Input Form */}
          <form onSubmit={handleFetchPRs} className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
              Target Repository
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
                disabled={loadingPrs}
                className="bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-black disabled:text-zinc-500 px-6 py-2.5 rounded text-sm font-mono font-bold transition-all uppercase tracking-wider whitespace-nowrap disabled:cursor-not-allowed"
              >
                {loadingPrs ? 'Scanning...' : 'Scan'}
              </button>
            </div>
          </form>

          {/* Conditional PR Selection Dropdown */}
          {hasSearched && prs.length > 0 && (
            <form onSubmit={handleReviewSubmit} className="space-y-2 pt-4 border-t border-zinc-900 duration-300 animate-in fade-in-50">
              <label className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
                Active Pull Requests ({prs.length})
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedPrUrl}
                  onChange={(e) => setSelectedPrUrl(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-all font-mono max-w-full overflow-hidden text-ellipsis cursor-pointer"
                >
                  {prs.map((pr) => (
                    <option key={pr.number} value={pr.url}>
                      #{pr.number} — {pr.title}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loadingReview}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:border-zinc-800 text-white disabled:text-zinc-600 px-6 py-2.5 rounded text-sm font-mono transition-all uppercase tracking-wider whitespace-nowrap disabled:cursor-not-allowed"
                >
                  {loadingReview ? 'Analyzing...' : 'Review'}
                </button>
              </div>
            </form>
          )}

          {/* Empty State Notification */}
          {hasSearched && prs.length === 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 p-4 rounded-lg text-center text-sm font-mono">
              {"Zero open pull requests identified for this repository."}
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 p-4 rounded-lg text-sm font-mono">
              <span className="text-white font-bold uppercase mr-2">[!] Error:</span> {error}
            </div>
          )}
        </div>

        {/* Monochrome Markdown Review Output */}
        {review && (
          <div className="bg-zinc-950 p-6 md:p-8 rounded-xl border border-zinc-800 shadow-2xl duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                {"PR Review Summary"}
              </h2>
              <span className="text-[10px] font-mono uppercase bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 tracking-wider">
                Report Generated
              </span>
            </div>
            
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
                {review}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}