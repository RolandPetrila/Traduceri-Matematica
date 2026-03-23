"use client";

interface TabNavProps {
  activeTab: "traduceri" | "convertor" | "istoric";
  onTabChange: (tab: "traduceri" | "convertor" | "istoric") => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const tabs = [
    { id: "traduceri" as const, label: "Traduceri", icon: "\u{1F4D0}" },
    { id: "convertor" as const, label: "Convertor Fisiere", icon: "\u{1F504}" },
    { id: "istoric" as const, label: "Istoric", icon: "\u{1F4CB}" },
  ];

  return (
    <nav className="flex gap-1 border-b border-chalk-white/20 pb-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
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
