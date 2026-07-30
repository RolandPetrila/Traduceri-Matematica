"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import IframeModule from "@/components/layout/IframeModule";
import { DEFAULT_TAB, TABS, type TabId } from "@/lib/tab-config";

const ConvertorPage = dynamic(() => import("./convertor/page"), { ssr: false });
const EditorPage = dynamic(() => import("./editor/page"), { ssr: false });
const AsistentPage = dynamic(() => import("./asistent/page"), { ssr: false });
const HistoryList = dynamic(() => import("@/components/history/HistoryList"), {
  ssr: false,
});

export default function Home() {
  // Pornim de la DEFAULT (identic SSR ↔ prima randare client → fără hydration
  // mismatch), apoi restaurăm tabul salvat pe client. Înainte, citirea din
  // localStorage direct în initializer diferea de SSR → „hydration mismatch"
  // + uneori tabul afișat nu era cel salvat.
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("activeTab") as TabId;
      // Validăm față de registrul viu de taburi (§16.3).
      if (saved && TABS.some((t) => t.id === saved)) setActiveTab(saved);
    } catch {
      /* localStorage indisponibil → rămânem pe DEFAULT */
    }
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    try {
      localStorage.setItem("activeTab", tab);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="min-w-0 flex-1 px-3 sm:px-4 py-2 sm:py-3">
        <div style={{ display: activeTab === "convertor" ? "block" : "none" }}>
          <ConvertorPage />
        </div>
        <div style={{ display: activeTab === "editor" ? "block" : "none" }}>
          <EditorPage />
        </div>
        <div style={{ display: activeTab === "asistent" ? "block" : "none" }}>
          <AsistentPage />
        </div>
        <div style={{ display: activeTab === "istoric" ? "block" : "none" }}>
          <HistoryList />
        </div>

        {/* Generic iframe-modules (§16.3): any tab marked kind:"iframe" in
              tabs.json is rendered here automatically — no per-module wiring.
              Existing tabs above (editor/asistent included) keep their own
              wrappers untouched; only new modules ride this convention. */}
        {TABS.filter((t) => t.kind === "iframe").map((t) => (
          <div
            key={t.id}
            style={{ display: activeTab === t.id ? "block" : "none" }}
          >
            <IframeModule
              tabId={t.id}
              label={t.label}
              icon={t.icon}
              description={t.description}
            />
          </div>
        ))}
      </main>
    </div>
  );
}
