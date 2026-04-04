import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DocTab {
  id: string;
  name: string;
  type: "primary" | "supplement" | "attachment";
}

const MOCK_TABS: DocTab[] = [
  { id: "1", name: "Master Services Agreement", type: "primary" },
  { id: "2", name: "Schedule A — Pricing", type: "supplement" },
  { id: "3", name: "Insurance Certificate", type: "attachment" },
];

const TYPE_DOT_COLORS: Record<string, string> = {
  primary: "bg-[hsl(var(--brand-indigo))]",
  supplement: "bg-amber-500",
  attachment: "bg-muted-foreground/50",
};

interface EditorDocumentTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const EditorDocumentTabs = ({ activeTab, onTabChange }: EditorDocumentTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <div className="relative h-11 border-b bg-muted/30 flex-shrink-0">
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
      )}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
      )}

      <div ref={scrollRef} className="flex items-end h-full overflow-x-auto scrollbar-none px-2 gap-0.5">
        {MOCK_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 h-9 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap flex-shrink-0",
                isActive
                  ? "bg-card text-foreground border border-b-0 border-border shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", TYPE_DOT_COLORS[tab.type])} />
              <span className="max-w-[160px] truncate">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EditorDocumentTabs;
