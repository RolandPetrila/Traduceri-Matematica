"use client";

export default function Header() {
  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl md:text-5xl font-bold chalk-text tracking-wide">
        <span className="text-chalk-yellow">&#x2211;</span>{" "}
        Sistem Traduceri{" "}
        <span className="text-chalk-yellow">&#x25B3;</span>
      </h1>
      <p className="mt-2 text-lg opacity-70">
        Traducere documente matematica cu AI &mdash; RO, SK, EN
      </p>
      <div className="mt-3 flex justify-center gap-4 text-sm opacity-50">
        <span>&#x222B; f(x)dx</span>
        <span>&middot;</span>
        <span>&#x2220; 60&deg;</span>
        <span>&middot;</span>
        <span>&#x03C0; &middot; r&sup2;</span>
        <span>&middot;</span>
        <span>a&sup2; + b&sup2; = c&sup2;</span>
      </div>
    </header>
  );
}
