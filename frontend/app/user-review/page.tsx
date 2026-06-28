import Link from 'next/link';

export default function UserReview() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8 flex flex-col items-center justify-center font-mono selection:bg-white selection:text-black">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 p-8 rounded-xl space-y-4 text-center">
        <div className="text-zinc-600 tracking-widest uppercase text-xs">[ Module 03 // User Profile Review ]</div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">System Offline</h1>
        <p className="text-sm text-zinc-500 font-sans leading-relaxed">
          Contributor identity analysis engine requires elevated API telemetry validation levels. Access restricted in sandbox deployment configurations.
        </p>
        <div className="pt-4 border-t border-zinc-900">
          <Link href="/" className="inline-block bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}