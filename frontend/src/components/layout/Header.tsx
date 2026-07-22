"use client";

import Link from "next/link";
import LanguageToggle from "./LanguageToggle";
import VersionBadge from "./VersionBadge";

export default function Header() {
  return (
    <header className="text-center mb-6 sm:mb-8">
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* left spacer only on desktop, to keep the title optically centered */}
        <div className="hidden sm:block w-32 shrink-0" />
        <h1 className="flex-1 text-2xl sm:text-4xl md:text-5xl font-bold chalk-text tracking-wide leading-tight">
          <span className="text-chalk-yellow">&#x2211;</span> Sistem Traduceri{" "}
          <span className="text-chalk-yellow">&#x25B3;</span>
        </h1>
        {/* language toggle is a flex sibling (never overlaps the title) */}
        <div className="shrink-0">
          <LanguageToggle />
        </div>
      </div>
      <p className="mt-1 text-sm sm:text-lg opacity-70 px-2">
        Traducere documente matematica cu AI &mdash; RO, SK, EN
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm opacity-50">
        {/* decorative math symbols: desktop only (clutter on phones) */}
        <span className="hidden sm:inline">&#x222B; f(x)dx</span>
        <span className="hidden sm:inline">&middot;</span>
        <span className="hidden sm:inline">&#x2220; 60&deg;</span>
        <span className="hidden sm:inline">&middot;</span>
        <span className="hidden sm:inline">&#x03C0; &middot; r&sup2;</span>
        <span className="hidden sm:inline">&middot;</span>
        <span className="hidden sm:inline">a&sup2; + b&sup2; = c&sup2;</span>
        <span className="hidden sm:inline">&middot;</span>
        <Link
          href="/diagnostics"
          className="hover:opacity-100 hover:text-chalk-yellow transition-all"
          title="Diagnosticare & Log-uri"
        >
          &#x2699; Diagnosticare
        </Link>
        <span>&middot;</span>
        <VersionBadge />
      </div>
    </header>
  );
}
