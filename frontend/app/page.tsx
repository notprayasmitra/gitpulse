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
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-center text-indigo-400">GitPulse</h1>
        <p className="text-slate-400 text-center mb-8">AI-Powered Senior Engineer Code Reviews</p>

        <form onSubmit={handleFetchPRs} className="bg-slate-800 p-6 rounded-lg shadow-xl mb-6">
          <label className="block text-sm font-medium mb-2 text-slate-300">GitHub Repository URL</label>
          <div className="flex gap-3">
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              autoComplete="off"
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loadingPrs}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 px-6 py-2 rounded font-medium transition-colors"
            >
              {loadingPrs ? 'Scanning...' : 'Scan Repository'}
            </button>
          </div>
        </form>

        {hasSearched && prs.length > 0 && (
          <form onSubmit={handleReviewSubmit} className="bg-slate-800 p-6 rounded-lg shadow-xl mb-6 border border-indigo-500/20 animate-fadeIn">
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Select an Active Pull Request ({prs.length} found)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedPrUrl}
                onChange={(e) => setSelectedPrUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 max-w-full overflow-hidden text-ellipsis"
              >
                {prs.map((pr) => (
                  <option key={pr.number} value={pr.url}>
                    #{pr.number} - {pr.title} (by @{pr.author})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loadingReview}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 px-6 py-2 rounded font-medium transition-colors whitespace-nowrap"
              >
                {loadingReview ? 'Analyzing Code...' : 'Generate Review'}
              </button>
            </div>
          </form>
        )}

        {hasSearched && prs.length === 0 && (
          <div className="bg-amber-950/40 border border-amber-600/50 text-amber-200 p-4 rounded mb-6 text-center">
            No open pull requests found for this repository. Everything looks completely up to date!
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {review && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-indigo-300 border-b border-slate-700 pb-2">Senior Engineer Assessment</h2>
            <div className="text-slate-300 leading-relaxed font-sans space-y-4 prose prose-invert max-w-none text-sm">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-indigo-400 mt-6 mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-indigo-300 mt-4 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-medium text-slate-200 mt-3 mb-1" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-base font-medium text-slate-300 mt-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 my-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 my-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                  code: ({node, ...props}) => <code className="bg-slate-950 px-1.5 py-0.5 rounded text-pink-400 font-mono text-xs" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto my-3 border border-slate-800" {...props} />,
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