"use client";

/**
 * ServerWakeup — NON-BLOCKING.
 *
 * Istoric: pe Render (free tier) serverul avea cold-start de 30-90s după pauză,
 * deci un ecran „Se pregătește aplicația..." bloca UI-ul până răspundea
 * `/api/health`. Pe Vercel (serverless/Fluid Compute) NU există cold-start de
 * genul ăsta — health-ul răspunde în ~300ms — așa că gate-ul care bloca TOATĂ
 * aplicația devenise un punct unic de eșec total: dacă health-ul eșua pe un
 * device (ex. mobil), utilizatorul rămânea blocat pe ecranul de „încărcare" și
 * NU putea intra deloc — nici în modulele care nu au nevoie de backend
 * (Planșe / Editor / Asistent, care rulează 100% în browser).
 *
 * De aceea acum randăm aplicația IMEDIAT. Fluxul de traducere își face oricum
 * apelurile la API la nevoie, cu error-handling propriu (coduri E-*). Nu mai e
 * niciun gate care să blocheze pornirea.
 */
export default function ServerWakeup({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
