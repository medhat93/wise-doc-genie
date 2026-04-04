import { useState, useRef } from "react";
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
  Printer,
  Type,
  Highlighter,
  X,
  Pilcrow,
} from "lucide-react";
import EditorDocumentsPopover, { type EditorDocument } from "./EditorDocumentsPopover";

/* ── Toolbar button ── */
const TBtn = ({
  icon: Icon,
  label,
  active,
  onClick,
  className,
}: {
  icon: typeof Bold;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
      >
        <Icon size={14} />
      </button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const Sep = () => <Separator orientation="vertical" className="h-5 mx-1" />;

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
            <button className="h-7 w-7 flex flex-col items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground gap-0">
              <Icon size={13} />
              <div className="w-3.5 h-1 rounded-sm mt-px" style={{ backgroundColor: color }} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
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
  const opts = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span><TBtn icon={Pilcrow} label="Line & paragraph spacing" /></span>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
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
        <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent text-muted-foreground">
          Add space before paragraph
        </button>
        <button className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-accent text-muted-foreground">
          Add space after paragraph
        </button>
      </PopoverContent>
    </Popover>
  );
};

/* ── Link insert popover ── */
const LinkInsertBtn = () => (
  <Popover>
    <PopoverTrigger asChild>
      <span><TBtn icon={Link} label="Insert link" /></span>
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
}

const EditorToolbar = ({ documents, activeDocId, onScrollToDoc }: EditorToolbarProps) => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    subscript: false,
    superscript: false,
    bulletList: false,
    numberedList: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    justify: false,
    spellCheck: false,
    ltr: true,
    rtl: false,
  });

  const [font, setFont] = useState("Inter");
  const [fontSize, setFontSize] = useState("12");
  const [heading, setHeading] = useState("normal");
  const [findOpen, setFindOpen] = useState(false);

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
      <div className="h-11 border-b bg-card flex items-center px-3 gap-0.5 overflow-x-auto scrollbar-none">
        {/* G0: Documents */}
        <EditorDocumentsPopover
          documents={documents}
          activeDocId={activeDocId}
          onScrollToDoc={onScrollToDoc}
        />
        <Sep />

        {/* G1: Undo/Redo */}
        <TBtn icon={Undo2} label="Undo" />
        <TBtn icon={Redo2} label="Redo" />
        <Sep />

        {/* G2: Text Style */}
        <Select value={font} onValueChange={setFont}>
          <SelectTrigger className="h-7 w-[120px] text-xs border-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Inter", "Arial", "Times New Roman", "Georgia", "Courier New", "Helvetica", "Roboto", "Noto Sans Arabic"].map((f) => (
              <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fontSize} onValueChange={setFontSize}>
          <SelectTrigger className="h-7 w-[54px] text-xs border-input ml-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["8","9","10","11","12","14","16","18","20","24","28","32","36","48","72"].map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TBtn icon={Minus} label="Decrease font size" onClick={() => setFontSize((p) => String(Math.max(8, Number(p) - 1)))} />
        <TBtn icon={Plus} label="Increase font size" onClick={() => setFontSize((p) => String(Math.min(72, Number(p) + 1)))} />
        <Sep />

        {/* G3: Basic Formatting */}
        <TBtn icon={Bold} label="Bold" active={toggles.bold} onClick={() => toggle("bold")} />
        <TBtn icon={Italic} label="Italic" active={toggles.italic} onClick={() => toggle("italic")} />
        <TBtn icon={Underline} label="Underline" active={toggles.underline} onClick={() => toggle("underline")} />
        <TBtn icon={Strikethrough} label="Strikethrough" active={toggles.strikethrough} onClick={() => toggle("strikethrough")} />
        <TBtn icon={Subscript} label="Subscript" active={toggles.subscript} onClick={() => toggle("subscript")} />
        <TBtn icon={Superscript} label="Superscript" active={toggles.superscript} onClick={() => toggle("superscript")} />
        <Sep />

        {/* G4: Text Color & Highlight */}
        <ColorPickerBtn icon={Type} label="Text color" defaultColor="#000000" />
        <ColorPickerBtn icon={Highlighter} label="Highlight color" defaultColor="#FFFF00" />
        <Sep />

        {/* G5: Paragraph */}
        <Select value={heading} onValueChange={setHeading}>
          <SelectTrigger className="h-7 w-[96px] text-xs border-input">
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

        <TBtn icon={List} label="Bullet list" active={toggles.bulletList} onClick={() => toggle("bulletList")} />
        <TBtn icon={ListOrdered} label="Numbered list" active={toggles.numberedList} onClick={() => toggle("numberedList")} />
        <TBtn icon={IndentDecrease} label="Decrease indent" />
        <TBtn icon={IndentIncrease} label="Increase indent" />
        <Sep />

        {/* G6: Alignment */}
        <TBtn icon={AlignLeft} label="Align left" active={toggles.alignLeft} onClick={() => setAlignment("alignLeft")} />
        <TBtn icon={AlignCenter} label="Align center" active={toggles.alignCenter} onClick={() => setAlignment("alignCenter")} />
        <TBtn icon={AlignRight} label="Align right" active={toggles.alignRight} onClick={() => setAlignment("alignRight")} />
        <TBtn icon={AlignJustify} label="Justify" active={toggles.justify} onClick={() => setAlignment("justify")} />
        <Sep />

        {/* G7: Line spacing */}
        <LineSpacingBtn />
        <Sep />

        {/* G8: Insert */}
        <TableGridSelector />
        <TBtn icon={Image} label="Insert image" onClick={() => toast("Select an image to insert")} />
        <LinkInsertBtn />
        <TBtn icon={MinusSquare} label="Horizontal rule" onClick={() => toast("Horizontal rule inserted")} />
        <TBtn icon={SeparatorHorizontal} label="Page break" onClick={() => toast("Page break inserted")} />
        <Sep />

        {/* G9: Advanced */}
        <TBtn icon={Search} label="Find & Replace" active={findOpen} onClick={() => setFindOpen(!findOpen)} />
        <TBtn icon={SpellCheck} label="Spell check" active={toggles.spellCheck} onClick={() => toggle("spellCheck")} />
        <TBtn icon={Printer} label="Print" onClick={() => toast("Print preview")} />
        <Sep />

        {/* G10: Direction */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setDirection("ltr")}
              className={cn(
                "h-7 px-1.5 flex items-center justify-center rounded text-[10px] font-semibold transition-colors",
                toggles.ltr ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              LTR
            </button>
          </TooltipTrigger>
          <TooltipContent>Left to right</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setDirection("rtl")}
              className={cn(
                "h-7 px-1.5 flex items-center justify-center rounded text-[10px] font-semibold transition-colors",
                toggles.rtl ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              RTL
            </button>
          </TooltipTrigger>
          <TooltipContent>Right to left</TooltipContent>
        </Tooltip>
      </div>

      <FindReplaceBar open={findOpen} onClose={() => setFindOpen(false)} />
    </div>
  );
};

export default EditorToolbar;
