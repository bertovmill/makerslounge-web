"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      router.push(`/matches?name=${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-center max-w-3xl leading-tight mb-6">
          Find your matches
        </h1>

        <p className="text-lg text-gray-600 text-center max-w-xl mb-12">
          Enter your name to see who you&apos;ve been matched with for speed networking.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="w-full max-w-xl">
          <div className="flex items-center bg-white rounded-full shadow-lg p-2">
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-6 py-4 text-lg bg-transparent outline-none"
            />
            <button
              type="submit"
              className="bg-[#1a1a1a] text-white px-8 py-4 rounded-full font-medium hover:bg-[#333] transition-colors flex items-center gap-2"
            >
              Search
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </main>

      {/* Stats Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-12">
          Making meaningful connections happen
        </h2>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <div className="border border-gray-200 rounded-xl px-8 py-6 text-center bg-white">
            <p className="text-3xl md:text-4xl font-serif font-bold">119</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Attendees</p>
          </div>
          <div className="border border-gray-200 rounded-xl px-8 py-6 text-center bg-white">
            <p className="text-3xl md:text-4xl font-serif font-bold">4</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Rounds</p>
          </div>
          <div className="border border-gray-200 rounded-xl px-8 py-6 text-center bg-white">
            <p className="text-3xl md:text-4xl font-serif font-bold">100%</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Coverage</p>
          </div>
        </div>
      </section>

      {/* Rounds Cards */}
      <section className="px-4 md:px-8 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-[#F9A8D4] rounded-2xl p-6 aspect-square flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Round 1</span>
              <span className="text-2xl">🤝</span>
            </div>
            <div>
              <p className="text-sm opacity-80">Complementary</p>
              <p className="text-xs opacity-60 mt-1">Skills meet needs</p>
            </div>
          </div>

          <div className="bg-[#FDBA74] rounded-2xl p-6 aspect-square flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Round 2</span>
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <p className="text-sm opacity-80">Complementary</p>
              <p className="text-xs opacity-60 mt-1">Skills meet needs</p>
            </div>
          </div>

          <div className="bg-[#86EFAC] rounded-2xl p-6 aspect-square flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Round 3</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <p className="text-sm opacity-80">Similarity</p>
              <p className="text-xs opacity-60 mt-1">Similar projects</p>
            </div>
          </div>

          <div className="bg-[#C4B5FD] rounded-2xl p-6 aspect-square flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Round 4</span>
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <p className="text-sm opacity-80">Similarity</p>
              <p className="text-xs opacity-60 mt-1">Similar projects</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Attendees Section */}
      <section className="py-16 bg-gradient-to-b from-[#FAF9F6] to-[#FFF5E6]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-center mb-4">
            Connecting makers with complementary skills
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our AI matches you with people who have what you need, and need what you have.
          </p>

          {/* Scrolling cards */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4 min-w-max">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-5 shadow-sm w-48 flex-shrink-0 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                  VS
                </div>
                <p className="font-semibold text-sm">Viraj Shah</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">AI</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Sales</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-5 shadow-sm w-48 flex-shrink-0 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                  HY
                </div>
                <p className="font-semibold text-sm">Hossein Yousefi</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">AI</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Community</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-5 shadow-sm w-48 flex-shrink-0 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                  AK
                </div>
                <p className="font-semibold text-sm">Alok Kumar</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">E-commerce</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Finance</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-2xl p-5 shadow-sm w-48 flex-shrink-0 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                  ED
                </div>
                <p className="font-semibold text-sm">Eduardo</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">UX/UI</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Web Dev</span>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-white rounded-2xl p-5 shadow-sm w-48 flex-shrink-0 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                  GC
                </div>
                <p className="font-semibold text-sm">Gursimran Chadha</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Podcasting</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Events</span>
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-white rounded-2xl p-5 shadow-sm w-48 flex-shrink-0 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mb-3 flex items-center justify-center text-white font-bold">
                  RA
                </div>
                <p className="font-semibold text-sm">Ravi Amin</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Pitching</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Web Dev</span>
                </div>
              </div>

              {/* More indicator */}
              <div className="bg-[#F4A261]/20 rounded-2xl p-5 w-48 flex-shrink-0 flex items-center justify-center">
                <p className="text-[#c77f4a] font-medium text-sm">+113 more makers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orange section with illustration style */}
      <div className="bg-[#F4A261] mx-4 md:mx-8 rounded-3xl h-64 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white font-serif text-2xl md:text-4xl font-bold text-center px-8 z-10">
            Built with AI-powered matching
          </p>
        </div>
        {/* Decorative wave pattern at bottom */}
        <svg className="absolute bottom-0 left-0 right-0 text-[#c77f4a]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z" fill="currentColor" opacity="0.3"/>
        </svg>
        {/* Decorative stars */}
        <svg className="absolute top-6 left-8 w-6 h-6 text-white/30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L9 9H2l6 5-2 8 6-4 6 4-2-8 6-5h-7z"/>
        </svg>
        <svg className="absolute bottom-16 right-16 w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L9 9H2l6 5-2 8 6-4 6 4-2-8 6-5h-7z"/>
        </svg>
        <svg className="absolute top-10 right-8 w-10 h-10 text-white/20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L9 9H2l6 5-2 8 6-4 6 4-2-8 6-5h-7z"/>
        </svg>
        <svg className="absolute bottom-20 left-16 w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L9 9H2l6 5-2 8 6-4 6 4-2-8 6-5h-7z"/>
        </svg>
      </div>
    </div>
  );
}
