"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import TabNav from "@/components/layout/TabNav";
import TraduceriPage from "./traduceri/page";
import ConvertorPage from "./convertor/page";
import HistoryList from "@/components/history/HistoryList";
import { DEFAULT_TAB, type TabId } from "@/lib/tab-config";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "traduceri" && <TraduceriPage />}
        {activeTab === "convertor" && <ConvertorPage />}
        {activeTab === "istoric" && <HistoryList />}
      </div>
    </main>
  );
}
