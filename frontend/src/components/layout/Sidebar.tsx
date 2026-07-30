"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TABS, type TabId } from "@/lib/tab-config";
import VersionBadge from "./VersionBadge";

// Icon-rail colapsabil (tiparul Mösslein, adaptat la tema cretă). Înlocuiește
// bara de module de sus (`TopBar`) — modulul selectat ocupă tot restul ecranului.
// Persistă starea în localStorage sub aceeași cheie ca referința.
const STORAGE_KEY = "mosslein:sidebar:collapsed";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  // Init DEFAULT (extins) = identic SSR ↔ prima randare client → FĂRĂ hydration
  // mismatch (capcana care rupea comutarea taburilor, cf. finding hydration).
  // Restaurăm preferința / aplicăm default-ul pe breakpoint DUPĂ hidratare.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setCollapsed(saved === "1");
      } else {
        // Fără preferință salvată: pe mobil (<768px) default colapsat, desktop extins.
        setCollapsed(window.matchMedia("(max-width: 767px)").matches);
      }
    } catch {
      /* localStorage indisponibil → rămânem pe DEFAULT (extins) */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <aside
      aria-label="Navigare module"
      className={`${
        collapsed ? "w-14" : "w-60"
      } shrink-0 flex flex-col bg-chalkboard-dark border-r border-chalk-white/20 transition-[width] duration-200 ease-out`}
    >
      {/* Header: brand + colapsare */}
      <div
        className={`flex items-center border-b border-chalk-white/20 py-3 ${
          collapsed ? "justify-center px-2" : "gap-2 px-3"
        }`}
      >
        <span
          className="shrink-0 chalk-text text-xl font-bold leading-none text-chalk-yellow"
          title="Sistem Traduceri"
          aria-label="Sistem Traduceri"
        >
          &#x2211;
          {!collapsed && <span className="ml-0.5">&#x25B3;</span>}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 chalk-text text-sm font-bold tracking-wide truncate">
              Sistem Traduceri
            </span>
            <button
              type="button"
              onClick={toggle}
              className="shrink-0 text-chalk-white/50 transition-colors hover:text-chalk-white"
              aria-label="Colapsează meniul"
              title="Colapsează"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={toggle}
          className="flex justify-center border-b border-chalk-white/20 py-2 text-chalk-white/50 transition-colors hover:text-chalk-white"
          aria-label="Extinde meniul"
          title="Extinde"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Module (taburi) — comutare de stare, NU rute (păstrează montarea simultană) */}
      <nav
        aria-label="Module"
        className="flex-1 overflow-y-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center border-l-4 transition-colors ${
                collapsed
                  ? "justify-center px-3 py-3"
                  : "gap-3 px-4 py-2.5 text-sm"
              } ${
                isActive
                  ? "border-chalk-yellow bg-chalk-yellow/15 font-bold text-chalk-yellow"
                  : "border-transparent text-chalk-white/70 hover:bg-white/5 hover:text-chalk-white"
              }`}
            >
              <span
                className="shrink-0 text-lg leading-none"
                aria-hidden="true"
              >
                {tab.icon}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1 truncate text-left">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: diagnostic + versiune */}
      <div
        className={`flex border-t border-chalk-white/20 py-2 ${
          collapsed
            ? "flex-col items-center gap-2 px-2"
            : "items-center justify-between px-3"
        }`}
      >
        <Link
          href="/diagnostics"
          title="Diagnosticare & Log-uri"
          className="text-base opacity-60 transition-all hover:text-chalk-yellow hover:opacity-100"
        >
          &#x2699;
        </Link>
        {!collapsed && <VersionBadge />}
      </div>
    </aside>
  );
}
