"use client";

import { logAction } from "@/lib/monitoring";
import { TABS, type TabId } from "@/lib/tab-config";

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex gap-1 border-b border-chalk-white/20 pb-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => { logAction(`Navigare: ${tab.label}`, { tab: tab.id }); onTabChange(tab.id); }}
          className={`px-6 py-3 text-lg font-bold transition-all duration-200 rounded-t-lg ${
            activeTab === tab.id
              ? "tab-active bg-white/5"
              : "opacity-60 hover:opacity-80 hover:bg-white/3"
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
