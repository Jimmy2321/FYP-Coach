import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rehearsal · AI Interview Prep",
  description: "AI interview rehearsal and personal statement review for graduating students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-navy-900">
        {/* Background decoration: soft radial glows */}
        <div aria-hidden className="pointer-events-none fixed inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[480px] glow-navy" />
          <div className="absolute top-1/3 -right-48 w-[560px] h-[560px] glow-coral" />
        </div>
        <header className="border-b border-navy-100/60 bg-white/70 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 no-underline group">
              <div className="w-9 h-9 rounded-lg bg-navy-800 flex items-center justify-center text-cream font-display text-lg group-hover:bg-navy-900 transition-colors">
                R
              </div>
              <div>
                <div className="font-display text-lg leading-none text-navy-900">Rehearsal</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-navy-400 mt-1">AI Interview Prep</div>
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-7 text-sm text-navy-600">
              {[
                { href: "/", label: "Home" },
                { href: "/resume", label: "Job Seeking" },
                { href: "/study-abroad", label: "Study Abroad" },
                { href: "/profile", label: "Profile" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="relative hover:text-navy-900 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-coral-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main className="relative max-w-6xl mx-auto px-6 py-10">{children}</main>
        <footer className="relative border-t border-navy-100/60 mt-20 py-10 text-center text-xs text-navy-400">
          <div className="ornament mb-5">
            <span className="text-[10px]">✦</span>
          </div>
          <p className="font-display italic">Rehearsal · AI Venture Studio</p>
          <p className="mt-1">Final Year Project · For academic use only</p>
        </footer>
      </body>
    </html>
  );
}
