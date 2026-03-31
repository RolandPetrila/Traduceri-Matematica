"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import TabNav from "@/components/layout/TabNav";
import ServerWakeup from "@/components/layout/ServerWakeup";
import TraduceriPage from "./traduceri/page";
import ConvertorPage from "./convertor/page";
import HistoryList from "@/components/history/HistoryList";
import { DEFAULT_TAB, type TabId } from "@/lib/tab-config";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("activeTab") as TabId;
      if (saved && ["traduceri", "convertor", "istoric"].includes(saved)) {
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
    <ServerWakeup>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Header />
        <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="mt-6">
          <div style={{ display: activeTab === "traduceri" ? "block" : "none" }}>
            <TraduceriPage />
          </div>
          <div style={{ display: activeTab === "convertor" ? "block" : "none" }}>
            <ConvertorPage />
          </div>
          <div style={{ display: activeTab === "istoric" ? "block" : "none" }}>
            <HistoryList />
          </div>
        </div>
      </main>
    </ServerWakeup>
  );
}
