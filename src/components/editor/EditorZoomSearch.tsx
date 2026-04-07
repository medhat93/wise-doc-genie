import { useState, useRef, useEffect, useCallback } from "react";
import { Minus, Plus, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 175, 200];

interface EditorZoomSearchProps {
  zoom: number;
  onZoomChange: (z: number) => void;
  searchOpen: boolean;
  onSearchToggle: () => void;
}

/* ── Zoom bar (bottom-right floating) ── */
export const ZoomBar = ({ zoom, onZoomChange, onSearchToggle }: EditorZoomSearchProps) => (
  <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1 bg-card border rounded-lg shadow-sm px-2 py-1">
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onSearchToggle}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Search size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Find in document (⌘F)</TooltipContent>
    </Tooltip>

    <div className="w-px h-4 bg-border mx-0.5" />

    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          disabled={zoom <= 50}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30"
        >
          <Minus size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Zoom out (⌘−)</TooltipContent>
    </Tooltip>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-11 text-center text-xs font-mono text-foreground hover:bg-accent rounded px-1 py-0.5 transition-colors cursor-pointer">
          {zoom}%
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" className="min-w-[120px]">
        {ZOOM_PRESETS.map((z) => (
          <DropdownMenuItem key={z} onClick={() => onZoomChange(z)} className="text-xs justify-center font-mono">
            {z}%
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => onZoomChange(100)} className="text-xs justify-center border-t">
          Fit to width
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          disabled={zoom >= 200}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Zoom in (⌘+)</TooltipContent>
    </Tooltip>
  </div>
);

/* ── Search bar (top floating) ── */
interface SearchBarProps {
  open: boolean;
  onClose: () => void;
}

export const SearchBar = ({ open, onClose }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    if (!open) { setQuery(""); clearHighlights(); }
  }, [open]);

  const clearHighlights = useCallback(() => {
    document.querySelectorAll("mark[data-search-hl]").forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el);
        parent.normalize();
      }
    });
    setTotalMatches(0);
    setMatchIndex(0);
  }, []);

  const doSearch = useCallback((q: string) => {
    clearHighlights();
    if (!q.trim()) return;

    const container = document.querySelector("[data-editor-canvas]");
    if (!container) return;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

    let count = 0;
    const lowerQ = q.toLowerCase();

    for (const node of textNodes) {
      const text = node.textContent || "";
      const lowerText = text.toLowerCase();
      const idx = lowerText.indexOf(lowerQ);
      if (idx === -1) continue;

      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + q.length);
      const after = text.slice(idx + q.length);

      const mark = document.createElement("mark");
      mark.setAttribute("data-search-hl", String(count));
      mark.className = count === 0 ? "bg-orange-300 rounded-sm px-px" : "bg-yellow-200 rounded-sm px-px";
      mark.textContent = match;

      const parent = node.parentNode;
      if (!parent) continue;

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(mark);
      if (after) frag.appendChild(document.createTextNode(after));
      parent.replaceChild(frag, node);
      count++;
    }

    setTotalMatches(count);
    setMatchIndex(count > 0 ? 0 : -1);
    if (count > 0) {
      document.querySelector("mark[data-search-hl='0']")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [clearHighlights]);

  const goToMatch = useCallback((idx: number) => {
    document.querySelectorAll("mark[data-search-hl]").forEach((el) => {
      (el as HTMLElement).className = "bg-yellow-200 rounded-sm px-px";
    });
    const target = document.querySelector(`mark[data-search-hl='${idx}']`) as HTMLElement | null;
    if (target) {
      target.className = "bg-orange-300 rounded-sm px-px";
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setMatchIndex(idx);
  }, []);

  const next = () => { if (totalMatches > 0) goToMatch((matchIndex + 1) % totalMatches); };
  const prev = () => { if (totalMatches > 0) goToMatch((matchIndex - 1 + totalMatches) % totalMatches); };

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
      }
      if (open && e.key === "Escape") onClose();
      if (open && e.key === "Enter") { e.shiftKey ? prev() : next(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, matchIndex, totalMatches]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-card border shadow-md rounded-lg px-3 py-2 max-w-md"
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find in document..."
        className="flex-1 h-8 text-sm border rounded-md px-2 bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring min-w-[180px]"
      />
      <span className="text-xs text-muted-foreground w-16 text-center shrink-0">
        {query ? `${totalMatches > 0 ? matchIndex + 1 : 0} of ${totalMatches}` : "0 of 0"}
      </span>
      <button onClick={prev} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
        <ChevronUp size={14} />
      </button>
      <button onClick={next} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
        <ChevronDown size={14} />
      </button>
      <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
        <X size={14} />
      </button>
    </motion.div>
  );
};
