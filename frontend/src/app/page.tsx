"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import TabNav from "@/components/layout/TabNav";
import ServerWakeup from "@/components/layout/ServerWakeup";
import { DEFAULT_TAB, type TabId } from "@/lib/tab-config";

const TraduceriPage = dynamic(() => import("./traduceri/page"), { ssr: false });
const ConvertorPage = dynamic(() => import("./convertor/page"), { ssr: false });
const HistoryList = dynamic(() => import("@/components/history/HistoryList"), { ssr: false });

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
