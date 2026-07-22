"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import TabNav from "@/components/layout/TabNav";
import IframeModule from "@/components/layout/IframeModule";
import { DEFAULT_TAB, TABS, type TabId } from "@/lib/tab-config";

const TraduceriPage = dynamic(() => import("./traduceri/page"), { ssr: false });
const ConvertorPage = dynamic(() => import("./convertor/page"), { ssr: false });
const EditorPage = dynamic(() => import("./editor/page"), { ssr: false });
const AsistentPage = dynamic(() => import("./asistent/page"), { ssr: false });
const HistoryList = dynamic(() => import("@/components/history/HistoryList"), {
  ssr: false,
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("activeTab") as TabId;
      // Validate against the live tab registry (derived from TABS) — adding a
      // tab no longer requires editing a hardcoded list here (§16.3).
      if (saved && TABS.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return DEFAULT_TAB;
  });

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
  };

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="mt-6">
        <div style={{ display: activeTab === "traduceri" ? "block" : "none" }}>
          <TraduceriPage />
        </div>
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
      </div>
    </main>
  );
}
