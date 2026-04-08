import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Minus,
  Plus,
  List,
  ListOrdered,
  ListChecks,
  ListTree,
  IndentDecrease,
  IndentIncrease,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  Image,
  Link,
  MinusSquare,
  SeparatorHorizontal,
  Search,
  SpellCheck,
  Type,
  Highlighter,
  X,
  Pilcrow,
  Paintbrush,
  Eraser,
  BookOpen,
  Hash,
  TableOfContents,
  PanelTop,
  Omega,
  MoreHorizontal,
  MessageSquare,
  GitCompareArrows,
  Clock,
} from "lucide-react";
import EditorDocumentsPopover, { type EditorDocument } from "./EditorDocumentsPopover";

/* ── Toolbar button ── */
const TBtn = ({
  icon: Icon,
  label,
  active,
  onClick,
  onDoubleClick,
  className,
}: {
  icon: typeof Bold;
  label: string;
  active?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
}) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded transition-colors flex-shrink-0",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
      >
        <Icon size={14} />
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
  </Tooltip>
);

const Sep = () => <Separator orientation="vertical" className="h-5 mx-1 flex-shrink-0" />;

/* ── Color picker popover ── */
const PRESET_COLORS = [
  "#000000","#434343","#666666","#999999","#B7B7B7","#CCCCCC","#D9D9D9","#EFEFEF","#F3F3F3","#FFFFFF",
  "#980000","#FF0000","#FF9900","#FFFF00","#00FF00","#00FFFF","#4A86E8","#0000FF","#9900FF","#FF00FF",
];

const ColorPickerBtn = ({
  icon: Icon,
  label,
  defaultColor,
}: {
  icon: typeof Type;
  label: string;
  defaultColor: string;
}) => {
  const [color, setColor] = useState(defaultColor);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button className="h-7 w-7 flex flex-col items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground gap-0 flex-shrink-0">
              <Icon size={13} />
              <div className="w-3.5 h-1 rounded-sm mt-px" style={{ backgroundColor: color }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-10 gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={cn(
                "h-5 w-5 rounded-sm border border-border transition-transform hover:scale-125",
                color === c && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button className="w-full text-xs text-muted-foreground mt-2 hover:text-foreground text-center">
          Custom color…
        </button>
      </PopoverContent>
    </Popover>
  );
};

/* ── Table grid selector ── */
const TableGridSelector = () => {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span><TBtn icon={Table} label="Insert table" /></span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: "repeat(8, 1fr)" }}
          onMouseLeave={() => setHover({ r: 0, c: 0 })}
        >
          {Array.from({ length: 48 }, (_, i) => {
            const r = Math.floor(i / 8) + 1;
            const c = (i % 8) + 1;
            const active = r <= hover.r && c <= hover.c;
            return (
              <button
                key={i}
                className={cn(
                  "h-4 w-4 border rounded-[2px] transition-colors",
                  active ? "bg-primary/20 border-primary/50" : "border-border"
                )}
                onMouseEnter={() => setHover({ r, c })}
                onClick={() => toast(`Insert ${hover.c}×${hover.r} table`)}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1.5">
          {hover.c > 0 ? `Insert ${hover.c}×${hover.r} table` : "Select size"}
        </p>
      </PopoverContent>
    </Popover>
  );
};

/* ── Line spacing popover ── */
const LineSpacingBtn = () => {
  const [spacing, setSpacing] = useState("1.15");
  const [spaceBefore, setSpaceBefore] = useState(false);
  const [spaceAfter, setSpaceAfter] = useState(true);
  const opts = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span><TBtn icon={Pilcrow} label="Line & paragraph spacing" /></span>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-1 pb-1">Line spacing</p>
        {opts.map((o) => (
          <button
            key={o}
            className={cn(
              "w-full text-left text-sm px-3 py-1.5 rounded transition-colors hover:bg-accent",
              spacing === o && "bg-primary/10 text-primary font-medium"
            )}
            onClick={() => setSpacing(o)}
          >
            {o}
          </button>
        ))}
        <Separator className="my-1" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-1 pb-1">Paragraph spacing</p>
        <button
          className={cn("w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent", spaceBefore && "text-primary font-medium")}
          onClick={() => setSpaceBefore(!spaceBefore)}
        >
          {spaceBefore ? "✓ " : ""}Add space before paragraph
        </button>
        <button
          className={cn("w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent", spaceAfter && "text-primary font-medium")}
          onClick={() => setSpaceAfter(!spaceAfter)}
        >
          {spaceAfter ? "✓ " : ""}Add space after paragraph
        </button>
        <Separator className="my-1" />
        <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent text-muted-foreground">
          Custom spacing…
        </button>
      </PopoverContent>
    </Popover>
  );
};

/* ── Link insert popover ── */
const LinkInsertBtn = () => (
  <Popover>
    <PopoverTrigger asChild>
      <span><TBtn icon={Link} label="Insert link (⌘K)" /></span>
    </PopoverTrigger>
    <PopoverContent className="w-64 p-3" align="start">
      <div className="space-y-2">
        <Input placeholder="URL" className="h-7 text-xs" />
        <Input placeholder="Display text" className="h-7 text-xs" />
        <Button size="sm" className="h-7 text-xs w-full" onClick={() => toast("Link inserted")}>
          Insert
        </Button>
      </div>
    </PopoverContent>
  </Popover>
);

/* ── Content Library popover ── */
const CONTENT_BLOCKS = [
  { id: "1", title: "Standard Confidentiality Clause", category: "Standard clauses", preview: "The receiving party agrees to maintain strict confidentiality of all proprietary information..." },
  { id: "2", title: "Limitation of Liability", category: "Legal terms", preview: "In no event shall either party be liable for any indirect, incidental, consequential..." },
  { id: "3", title: "Force Majeure", category: "Legal terms", preview: "Neither party shall be liable for any failure or delay in performance under this agreement..." },
  { id: "4", title: "Indemnification Clause", category: "Legal terms", preview: "Each party shall indemnify and hold harmless the other party from any claims, damages..." },
  { id: "5", title: "Governing Law — Saudi Arabia", category: "Compliance", preview: "This agreement shall be governed by and construed in accordance with the laws of the Kingdom..." },
  { id: "6", title: "Termination for Convenience", category: "Standard clauses", preview: "Either party may terminate this agreement at any time by providing thirty (30) days written..." },
];

const ContentLibraryBtn = () => {
  const [search, setSearch] = useState("");
  const filtered = CONTENT_BLOCKS.filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
  );
  const categories = [...new Set(filtered.map(b => b.category))];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span><TBtn icon={BookOpen} label="Content library" /></span>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start" side="bottom">
        <div className="p-2 border-b">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-2">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">{cat}</p>
              {filtered.filter(b => b.category === cat).map(block => (
                <div
                  key={block.id}
                  className="rounded-md border p-2 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => toast.success("Clause inserted")}
                >
                  <p className="text-xs font-medium mb-0.5">{block.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{block.preview}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ── Special Characters popover ── */
const SPECIAL_CHARS = [
  { char: "§", name: "Section" }, { char: "¶", name: "Paragraph" },
  { char: "©", name: "Copyright" }, { char: "®", name: "Registered" },
  { char: "™", name: "Trademark" }, { char: "†", name: "Dagger" },
  { char: "‡", name: "Double dagger" }, { char: "•", name: "Bullet" },
  { char: "—", name: "Em dash" }, { char: "–", name: "En dash" },
  { char: "…", name: "Ellipsis" }, { char: "«»", name: "Guillemets" },
];

/* ── Find & Replace bar ── */
const FindReplaceBar = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-card border shadow-md rounded-b-lg p-2.5 flex items-center gap-2">
      <Input placeholder="Find" className="h-7 w-36 text-xs" />
      <Input placeholder="Replace" className="h-7 w-36 text-xs" />
      <div className="flex gap-0.5">
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2">Prev</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2">Next</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2">Replace</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2">All</Button>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
        <X size={12} />
      </Button>
    </div>
  );
};

/* ══════════ MAIN TOOLBAR ══════════ */
interface EditorToolbarProps {
  documents: EditorDocument[];
  activeDocId: string | null;
  onScrollToDoc: (id: string) => void;
  onOpenComments?: () => void;
  onOpenVersionHistory?: () => void;
}

const EditorToolbar = ({ documents, activeDocId, onScrollToDoc, onOpenComments, onOpenVersionHistory }: EditorToolbarProps) => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    bulletList: false,
    numberedList: false,
    checklist: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    justify: false,
    spellCheck: false,
    ltr: true,
    rtl: false,
    trackChanges: false,
  });

  const [font, setFont] = useState("Inter");
  const [fontSize, setFontSize] = useState("12");
  const [heading, setHeading] = useState("normal");
  const [findOpen, setFindOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Responsive collapse: measure toolbar width and hide groups progressively
  const [toolbarWidth, setToolbarWidth] = useState(2000);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setToolbarWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Collapse thresholds — groups disappear from main row into overflow
  const showDirection = toolbarWidth > 1050;
  const showAlignment = toolbarWidth > 950;
  const showInsert = toolbarWidth > 850;
  const showLists = toolbarWidth > 750;
  const showColors = toolbarWidth > 650;
  const hasCollapsed = !showDirection || !showAlignment || !showInsert || !showLists || !showColors;

  const toggle = (key: string) =>
    setToggles((p) => ({ ...p, [key]: !p[key] }));

  const setAlignment = (key: string) =>
    setToggles((p) => ({
      ...p,
      alignLeft: key === "alignLeft",
      alignCenter: key === "alignCenter",
      alignRight: key === "alignRight",
      justify: key === "justify",
    }));

  const setDirection = (key: string) =>
    setToggles((p) => ({
      ...p,
      ltr: key === "ltr",
      rtl: key === "rtl",
    }));

  return (
    <div className="relative flex-shrink-0">
      <div
        ref={scrollRef}
        className="h-11 border-b bg-card flex items-center px-3 gap-0.5 overflow-x-auto scrollbar-none"
      >
        {/* G0: Documents */}
        <EditorDocumentsPopover
          documents={documents}
          activeDocId={activeDocId}
          onScrollToDoc={onScrollToDoc}
        />
        <Sep />

        {/* G1: Undo / Redo */}
        <TBtn icon={Undo2} label="Undo (⌘Z)" />
        <TBtn icon={Redo2} label="Redo (⌘⇧Z)" />
        <Sep />

        {/* G2: Font */}
        <Select value={font} onValueChange={setFont}>
          <SelectTrigger className="h-7 w-[120px] text-xs border-input flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Inter", "Arial", "Times New Roman", "Georgia", "Courier New", "Helvetica", "Roboto", "Noto Sans Arabic"].map((f) => (
              <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fontSize} onValueChange={setFontSize}>
          <SelectTrigger className="h-7 w-[54px] text-xs border-input ml-1 flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["8","9","10","11","12","14","16","18","20","24","28","32","36","48","72"].map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sep />

        {/* G3: Core formatting */}
        <TBtn icon={Bold} label="Bold (⌘B)" active={toggles.bold} onClick={() => toggle("bold")} />
        <TBtn icon={Italic} label="Italic (⌘I)" active={toggles.italic} onClick={() => toggle("italic")} />
        <TBtn icon={Underline} label="Underline (⌘U)" active={toggles.underline} onClick={() => toggle("underline")} />
        <TBtn icon={Strikethrough} label="Strikethrough (⌘⇧X)" active={toggles.strikethrough} onClick={() => toggle("strikethrough")} />
        <Sep />

        {/* G4: Color — collapsible */}
        {showColors && (
          <>
            <ColorPickerBtn icon={Type} label="Text color" defaultColor="#000000" />
            <ColorPickerBtn icon={Highlighter} label="Highlight color" defaultColor="#FFFF00" />
            <Sep />
          </>
        )}

        {/* G5: Paragraph style & lists */}
        <Select value={heading} onValueChange={setHeading}>
          <SelectTrigger className="h-7 w-[96px] text-xs border-input flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: "normal", label: "Normal" },
              { value: "h1", label: "Heading 1" },
              { value: "h2", label: "Heading 2" },
              { value: "h3", label: "Heading 3" },
              { value: "h4", label: "Heading 4" },
              { value: "quote", label: "Quote" },
              { value: "code", label: "Code Block" },
            ].map((h) => (
              <SelectItem key={h.value} value={h.value} className="text-xs">{h.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showLists && (
          <>
            <TBtn icon={List} label="Bullet list (⌘⇧8)" active={toggles.bulletList} onClick={() => toggle("bulletList")} />
            <TBtn icon={ListOrdered} label="Numbered list (⌘⇧7)" active={toggles.numberedList} onClick={() => toggle("numberedList")} />
            <TBtn icon={IndentDecrease} label="Decrease indent (⌘[)" />
            <TBtn icon={IndentIncrease} label="Increase indent (⌘])" />
          </>
        )}
        <Sep />

        {/* G6: Alignment — collapsible */}
        {showAlignment && (
          <>
            <TBtn icon={AlignLeft} label="Align left (⌘⇧L)" active={toggles.alignLeft} onClick={() => setAlignment("alignLeft")} />
            <TBtn icon={AlignCenter} label="Align center (⌘⇧E)" active={toggles.alignCenter} onClick={() => setAlignment("alignCenter")} />
            <TBtn icon={AlignRight} label="Align right (⌘⇧R)" active={toggles.alignRight} onClick={() => setAlignment("alignRight")} />
            <TBtn icon={AlignJustify} label="Justify (⌘⇧J)" active={toggles.justify} onClick={() => setAlignment("justify")} />
            <Sep />
          </>
        )}

        {/* G7: Insert essentials — collapsible */}
        {showInsert && (
          <>
            <TableGridSelector />
            <TBtn icon={Image} label="Insert image" onClick={() => toast("Select an image to insert")} />
            <LinkInsertBtn />
            <Sep />
          </>
        )}

        {/* G9: Tools */}
        <TBtn icon={Clock} label="Version history (⌘⌥⇧H)" onClick={() => onOpenVersionHistory?.()} />
        <Sep />

        {/* G10: Direction — collapsible */}
        {showDirection && (
          <>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setDirection("ltr")}
                  className={cn(
                    "h-7 px-1.5 flex items-center justify-center rounded text-[10px] font-semibold transition-colors flex-shrink-0",
                    toggles.ltr ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  LTR
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Left to right</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setDirection("rtl")}
                  className={cn(
                    "h-7 px-1.5 flex items-center justify-center rounded text-[10px] font-semibold transition-colors flex-shrink-0",
                    toggles.rtl ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  RTL
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Right to left</TooltipContent>
            </Tooltip>
            <Sep />
          </>
        )}

        {/* G11: More tools toggle — auto-show when collapsed or manually toggled */}
        <TBtn
          icon={MoreHorizontal}
          label="More tools"
          active={moreOpen || hasCollapsed}
          onClick={() => setMoreOpen(prev => !prev)}
        />
      </div>

      {/* Secondary toolbar row — shows when "More" clicked OR when groups are collapsed */}
      <AnimatePresence>
        {(moreOpen || hasCollapsed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-b bg-card"
          >
            <div className="h-10 flex items-center px-3 gap-0.5 overflow-x-auto scrollbar-none">
              {/* Collapsed groups appear first */}
              {!showColors && (
                <>
                  <ColorPickerBtn icon={Type} label="Text color" defaultColor="#000000" />
                  <ColorPickerBtn icon={Highlighter} label="Highlight color" defaultColor="#FFFF00" />
                  <Sep />
                </>
              )}
              {!showLists && (
                <>
                  <TBtn icon={List} label="Bullet list (⌘⇧8)" active={toggles.bulletList} onClick={() => toggle("bulletList")} />
                  <TBtn icon={ListOrdered} label="Numbered list (⌘⇧7)" active={toggles.numberedList} onClick={() => toggle("numberedList")} />
                  <TBtn icon={IndentDecrease} label="Decrease indent (⌘[)" />
                  <TBtn icon={IndentIncrease} label="Increase indent (⌘])" />
                  <Sep />
                </>
              )}
              {!showAlignment && (
                <>
                  <TBtn icon={AlignLeft} label="Align left (⌘⇧L)" active={toggles.alignLeft} onClick={() => setAlignment("alignLeft")} />
                  <TBtn icon={AlignCenter} label="Align center (⌘⇧E)" active={toggles.alignCenter} onClick={() => setAlignment("alignCenter")} />
                  <TBtn icon={AlignRight} label="Align right (⌘⇧R)" active={toggles.alignRight} onClick={() => setAlignment("alignRight")} />
                  <TBtn icon={AlignJustify} label="Justify (⌘⇧J)" active={toggles.justify} onClick={() => setAlignment("justify")} />
                  <Sep />
                </>
              )}
              {!showInsert && (
                <>
                  <TableGridSelector />
                  <TBtn icon={Image} label="Insert image" onClick={() => toast("Select an image to insert")} />
                  <LinkInsertBtn />
                  <Sep />
                </>
              )}
              {!showDirection && (
                <>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setDirection("ltr")}
                        className={cn(
                          "h-7 px-1.5 flex items-center justify-center rounded text-[10px] font-semibold transition-colors flex-shrink-0",
                          toggles.ltr ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        LTR
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Left to right</TooltipContent>
                  </Tooltip>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setDirection("rtl")}
                        className={cn(
                          "h-7 px-1.5 flex items-center justify-center rounded text-[10px] font-semibold transition-colors flex-shrink-0",
                          toggles.rtl ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        RTL
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Right to left</TooltipContent>
                  </Tooltip>
                  <Sep />
                </>
              )}

              {/* Original overflow items */}
              <TBtn icon={Eraser} label="Clear formatting (⌘\)" onClick={() => toast("Formatting cleared")} />
              <TBtn icon={Subscript} label="Subscript" onClick={() => toast("Subscript toggled")} />
              <TBtn icon={Superscript} label="Superscript" onClick={() => toast("Superscript toggled")} />
              <TBtn icon={Paintbrush} label="Paint format" onClick={() => toast("Paint format: click text to apply")} />
              <Sep />

              <TBtn icon={ListChecks} label="Checklist" active={toggles.checklist} onClick={() => toggle("checklist")} />
              <Popover>
                <PopoverTrigger asChild>
                  <span><TBtn icon={ListTree} label="Clause numbering" /></span>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1" align="start">
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Applied: 1. / 1.1 / 1.1.1")}>1. / 1.1 / 1.1.1 — Decimal</button>
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Applied: I. / A. / 1.")}>I. / A. / 1. — Roman</button>
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Applied: Article I / Section 1")}>Article I / Section 1 / (a) — Legal</button>
                  <Separator className="my-1" />
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent text-muted-foreground" onClick={() => toast("Numbering removed")}>None</button>
                </PopoverContent>
              </Popover>
              <Sep />

              <TBtn icon={MinusSquare} label="Horizontal rule" onClick={() => toast("Horizontal rule inserted")} />
              <TBtn icon={SeparatorHorizontal} label="Page break" onClick={() => toast("Page break inserted")} />
              <TBtn icon={TableOfContents} label="Table of contents" onClick={() => toast("Table of contents inserted")} />
              <TBtn icon={Superscript} label="Footnote (⌘⌥F)" onClick={() => toast("Footnote inserted")} />

              <Popover>
                <PopoverTrigger asChild>
                  <span><TBtn icon={PanelTop} label="Headers & footers" /></span>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Edit header")}>Edit header</button>
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Edit footer")}>Edit footer</button>
                  <Separator className="my-1" />
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Page numbers: Top right")}>Page numbers — Top right</button>
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Page numbers: Bottom center")}>Page numbers — Bottom center</button>
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Page numbers: Bottom right")}>Page numbers — Bottom right</button>
                  <Separator className="my-1" />
                  <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent" onClick={() => toast("Document ID in footer")}>Document ID in footer</button>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <span><TBtn icon={Omega} label="Special characters" /></span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="grid grid-cols-6 gap-1">
                    {SPECIAL_CHARS.map(sc => (
                      <button
                        key={sc.char}
                        className="h-8 w-8 flex items-center justify-center rounded border border-border text-sm hover:bg-muted transition-colors font-mono"
                        onClick={() => toast(`Inserted: ${sc.char}`)}
                        title={sc.name}
                      >
                        {sc.char}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Sep />

              <TBtn icon={SpellCheck} label="Spell check" active={toggles.spellCheck} onClick={() => toggle("spellCheck")} />
              <Popover>
                <PopoverTrigger asChild>
                  <span><TBtn icon={Hash} label="Word count" /></span>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-1.5">
                    {[
                      { label: "Words", value: "2,847" },
                      { label: "Characters", value: "16,203" },
                      { label: "Paragraphs", value: "42" },
                      { label: "Pages", value: "~5" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium font-mono">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <LineSpacingBtn />
              <Sep />

              <TBtn icon={Pilcrow} label="Show formatting marks" onClick={() => toast("Formatting marks toggled")} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FindReplaceBar open={findOpen} onClose={() => setFindOpen(false)} />
    </div>
  );
};

export default EditorToolbar;
