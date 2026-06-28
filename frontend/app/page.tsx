'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState('');
  const [error, setError] = useState('');

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReview('');

    try {
      const response = await fetch('http://localhost:5000/api/review-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setReview(data.review);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-center text-indigo-400">GitPulse</h1>
        <p className="text-slate-400 text-center mb-8">AI-Powered GitHub PR Review Agent</p>

        <form onSubmit={handleReviewSubmit} className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8">
          <label className="block text-sm font-medium mb-2 text-slate-300">GitHub Pull Request URL</label>
          <div className="flex gap-3">
            <input
              type="url"
              placeholder="https://github.com/owner/repo/pull/1"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              required
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed px-6 py-2 rounded font-medium transition-colors"
            >
              {loading ? 'Reviewing...' : 'Review PR'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-8">
            <strong>Error:</strong> {error}
          </div>
        )}

        {review && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
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