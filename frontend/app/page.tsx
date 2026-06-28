'use client';

import Link from 'next/link';

export default function Home() {
  const tools = [
    {
      title: "PR Review",
      desc: "Scan repositories and extract all active pull requests for a further analysis using AI.",
      path: "/pr-review",
      tag: "Active Pipeline"
    },
    {
      title: "Repository Review",
      desc: "Lorem ipsum...",
      path: "/repo-review",
      tag: "Demo Mode"
    },
    {
      title: "User Review",
      desc: "Lorem ipsum...",
      path: "/user-review",
      tag: "Demo Mode"
    }
  ];

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 flex flex-col justify-center items-center selection:bg-white selection:text-black">
      <div className="w-full max-w-4xl space-y-12">
        
        {/* Hub Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-widest text-white font-mono uppercase">
            Git-Pulse Central Hub
          </h1>
          <p className="text-zinc-500 text-sm tracking-wider uppercase font-mono">
            Select  utility module
          </p>
        </header>

        {/* 3 Square Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool, idx) => (
            <Link 
              key={idx} 
              href={tool.path}
              className="group relative flex flex-col justify-between aspect-square p-6 bg-zinc-950 border border-zinc-800 hover:border-zinc-400 rounded-xl transition-all duration-300 shadow-2xl cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    [ 0{idx + 1} ]
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {tool.tag}
                  </span>
                </div>
                <h2 className="text-xl font-bold font-mono tracking-tight text-white group-hover:translate-x-1 transition-transform duration-300">
                  {tool.title}
                </h2>
                <p className="text-zinc-500 group-hover:text-zinc-400 transition-colors text-xs font-sans leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="text-right text-xs font-mono uppercase tracking-widest text-zinc-600 group-hover:text-white transition-colors pt-4">
                Execute &rarr;
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}