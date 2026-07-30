"use client";

/**
 * IframeModule — generic wrapper for static self-contained modules (the
 * "iframe-module" convention; see docs/PLAN_MASTER.md).
 *
 * A module marked `"kind": "iframe"` in tabs.json is served from
 * public/<id>/index.html and embedded same-origin here. Adding such a module
 * is drop-in: drop the folder in public/<id>/ + one tabs.json entry — no new
 * React file and no shell edits (the shell renders this component for every
 * kind:iframe tab automatically).
 *
 * Mirrors the isolation of app/editor/page.tsx (R-EXT: separate module, does
 * not touch the translation/OCR pipeline). Same-origin iframing requires
 * X-Frame-Options: SAMEORIGIN + CSP frame-ancestors 'self' (see next.config.js;
 * the global block already covers /<id>/).
 */
export default function IframeModule({
  tabId,
  label,
  icon,
  description,
  allow,
}: {
  tabId: string;
  label: string;
  icon: string;
  description?: string;
  allow?: string;
}) {
  const src = `/${tabId}/index.html`;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold chalk-text">
            <span className="text-chalk-yellow mr-1">{icon}</span>
            {label}
          </h2>
          {description && <p className="text-sm opacity-60">{description}</p>}
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="chalk-btn text-sm whitespace-nowrap"
          title="Deschide modulul intr-o fereastra separata (ecran complet)"
        >
          &#x26F6; Deschide in fereastra noua
        </a>
      </div>

      <div
        className="rounded-lg overflow-hidden border-2 border-chalk-white/20 bg-white"
        style={{ height: "calc(100vh - 230px)", minHeight: "560px" }}
      >
        <iframe
          src={src}
          title={label}
          className="block w-full h-full"
          style={{ border: "none" }}
          allow={allow}
        />
      </div>
    </div>
  );
}
