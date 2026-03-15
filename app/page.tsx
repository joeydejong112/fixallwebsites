export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6">
        <span className="text-[#eeeaf8]">site</span><span className="text-[#7c6aff]">fix</span>
      </h1>
      <p className="max-w-xl text-[#eeeaf8]/55 text-xl font-medium mb-10 leading-relaxed">
        The all-in-one website health scanner. We check your SEO, security, speed, accessibility, and more.
      </p>
      <div className="flex gap-4">
        <a href="/sign-up" className="bg-[#7c6aff] hover:bg-[#a89dff] text-white px-8 py-3 rounded-lg font-semibold transition">
          Start Scanning
        </a>
        <a href="/sign-in" className="bg-[#131220] border border-white/5 hover:border-white/10 text-white px-8 py-3 rounded-lg font-semibold transition">
          Sign In
        </a>
      </div>
    </main>
  );
}
