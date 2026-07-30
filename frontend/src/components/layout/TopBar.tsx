"use client";

import Link from "next/link";
import { logAction } from "@/lib/monitoring";
import { TABS, type TabId } from "@/lib/tab-config";
import VersionBadge from "./VersionBadge";

interface TopBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

/**
 * Bară slim unică (decizie Roland 2026-07-26) — înlocuiește vechiul antet mare
 * (titlu + subtitlu + rândul decorativ) + `TabNav` cu UN SINGUR rând subțire:
 * brand mic · taburi (iconițe; etichete pe desktop) · diagnostic · versiune.
 *
 * Scop: funcția activă primește tot spațiul vertical (~200px recuperați), la
 * FIECARE tab. Taburile rămân mereu la un click (scroll orizontal pe mobil).
 */
export default function TopBar({ activeTab, onTabChange }: TopBarProps) {
  return (
    <header className="mb-3 flex items-center gap-2 border-b border-chalk-white/20 pb-1.5">
      {/* Brand compact (fără titlu mare) */}
      <span
        className="shrink-0 chalk-text text-lg font-bold tracking-wide"
        title="Sistem Traduceri"
        aria-label="Sistem Traduceri"
      >
        <span className="text-chalk-yellow">&#x2211;</span>
        <span className="ml-0.5 hidden text-chalk-yellow sm:inline">
          &#x25B3;
        </span>
      </span>

      {/* Taburi — un singur rând, scrollabil pe mobil (icon + etichetă pe desktop) */}
      <nav className="tab-scroll flex flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              logAction(`Navigare: ${tab.label}`, { tab: tab.id });
              onTabChange(tab.id);
            }}
            title={tab.label}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-chalk-yellow/15 text-chalk-yellow"
                : "opacity-60 hover:bg-white/5 hover:opacity-90"
            }`}
          >
            <span className="md:mr-1.5">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Dreapta: diagnostic + versiune */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/diagnostics"
          title="Diagnosticare & Log-uri"
          className="text-base opacity-60 transition-all hover:text-chalk-yellow hover:opacity-100"
        >
          &#x2699;
        </Link>
        <span className="hidden sm:inline">
          <VersionBadge />
        </span>
      </div>
    </header>
  );
}
