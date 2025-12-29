"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to email service
    console.log("Email submitted:", email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="text-white">Blank</span>
            <span className="text-emerald-400">Pop</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#products" className="hover:text-white transition">Products</a>
            <a href="#waitlist" className="hover:text-white transition">Join waitlist</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm">
            Coming soon to ChatGPT
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Start blank.<br />
            <span className="text-emerald-400">Make it yours.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Design custom merchandise with AI in ChatGPT.
            Describe your vision, we&apos;ll create it, you buy it—all without leaving the chat.
          </p>
          <a
            href="#waitlist"
            className="inline-block px-8 py-4 bg-emerald-400 text-black font-semibold rounded-full hover:bg-emerald-300 transition text-lg"
          >
            Join the waitlist
          </a>
        </div>
      </section>

      {/* Mockup placeholder */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-8 md:p-12">
            <div className="bg-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-400 flex-shrink-0"></div>
                <div>
                  <p className="text-zinc-300">&quot;Design a minimalist mountain landscape with a sunset, geometric style&quot;</p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-600 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-zinc-300 mb-4">Here&apos;s your design on a premium t-shirt:</p>
                  <div className="rounded-lg aspect-square max-w-xs overflow-hidden">
                    <img src="/images/tshirt-white.svg" alt="T-shirt preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="px-6 py-2 bg-emerald-400 text-black rounded-full font-medium text-sm">
                      Buy now - $29
                    </button>
                    <button className="px-6 py-2 bg-zinc-700 text-white rounded-full font-medium text-sm">
                      Try another style
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-2xl font-bold text-emerald-400 mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Describe your design</h3>
              <p className="text-zinc-400">
                Tell ChatGPT what you want. A cosmic cat? Minimalist waves? Your imagination is the limit.
              </p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-2xl font-bold text-emerald-400 mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Preview on products</h3>
              <p className="text-zinc-400">
                See your design on t-shirts, hoodies, mugs, and more. Tweak until it&apos;s perfect.
              </p>
            </div>
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-2xl font-bold text-emerald-400 mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Buy instantly</h3>
              <p className="text-zinc-400">
                Checkout right in ChatGPT. We print and ship directly to you. No apps, no hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Premium products
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            High-quality blanks, printed on demand, shipped worldwide.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "T-Shirts", price: "from $29", image: "/images/tshirt-white.svg" },
              { name: "Hoodies", price: "from $49", image: "/images/hoodie-black.svg" },
              { name: "Mugs", price: "from $18", image: "/images/mug-white.svg" },
              { name: "Posters", price: "from $20", image: "/images/poster.svg" },
            ].map((product) => (
              <div key={product.name} className="bg-zinc-900 rounded-xl border border-white/10 p-6 text-center hover:border-emerald-400/50 transition">
                <div className="aspect-square rounded-lg mb-4 overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-sm text-zinc-400">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Be the first to create
          </h2>
          <p className="text-zinc-400 mb-8">
            Join the waitlist and get early access when we launch on ChatGPT.
          </p>
          {submitted ? (
            <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-6">
              <p className="text-emerald-400 font-medium">You&apos;re on the list! We&apos;ll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-6 py-4 bg-zinc-800 border border-white/10 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-emerald-400 text-black font-semibold rounded-full hover:bg-emerald-300 transition"
              >
                Join waitlist
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-bold">
            <span className="text-white">Blank</span>
            <span className="text-emerald-400">Pop</span>
          </div>
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} BlankPop. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="/privacy" className="hover:text-white transition">Privacy</a>
            <a href="/terms" className="hover:text-white transition">Terms</a>
            <a href="mailto:support@formpop.online" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
