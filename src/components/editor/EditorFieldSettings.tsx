import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PenTool,
  Type,
  Calendar,
  TextCursorInput,
  CheckSquare,
  Stamp,
  Radio,
  Paperclip,
  Mail,
  User,
  Building,
  ChevronDown,
  Copy,
  Trash2,
  Info,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
} from "lucide-react";
import { useEditorContext } from "./EditorContext";
import { toast } from "sonner";

const FIELD_ICONS: Record<string, React.ElementType> = {
  signature: PenTool,
  reservation_signature: PenTool,
  initials: Type,
  stamp: Stamp,
  signature_date: Calendar,
  name: TextCursorInput,
  email: Mail,
  title: User,
  company: Building,
  date: Calendar,
  text: Type,
  checkbox: CheckSquare,
  radio: Radio,
  attachment: Paperclip,
};

const FIELD_LABELS: Record<string, string> = {
  signature: "SIGNATURE",
  reservation_signature: "RESERVATION SIGNATURE",
  initials: "INITIALS",
  stamp: "STAMP",
  signature_date: "SIGNATURE DATE",
  name: "NAME",
  email: "EMAIL",
  title: "TITLE",
  company: "COMPANY",
  date: "DATE",
  text: "TEXT FIELD",
  checkbox: "CHECKBOX",
  radio: "RADIO BUTTON",
  attachment: "FILE ATTACHMENT",
};

const TEXT_FIELDS = new Set(["name", "email", "title", "company", "date", "text", "signature_date"]);
const SIGNATURE_FIELDS = new Set(["signature", "reservation_signature", "initials", "stamp"]);
const TOGGLE_FIELDS = new Set(["checkbox", "radio"]);

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24];
const PRESET_COLORS = [
  "#000000", "#374151", "#6B7280", "#DC2626", "#EA580C", "#D97706",
  "#16A34A", "#059669", "#0891B2", "#2563EB", "#4F46E5", "#7C3AED",
  "#9333EA", "#C026D3", "#DB2777", "#F43F5E", "#78716C", "#A3A3A3",
  "#FBBF24", "#FDE68A",
];

interface EditorFieldSettingsProps {
  onClose: () => void;
  showBackButton?: boolean;
}

const EditorFieldSettings = ({ onClose }: EditorFieldSettingsProps) => {
  const { placedFields, setPlacedFields, selectedFieldId, setSelectedFieldId, participants } = useEditorContext();
  const field = placedFields.find((f) => f.id === selectedFieldId);

  const [generalOpen, setGeneralOpen] = useState(true);
  const [stylingOpen, setStylingOpen] = useState(false);
  const [positionOpen, setPositionOpen] = useState(false);

  // Local field settings state
  const [required, setRequired] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [multiLine, setMultiLine] = useState(false);
  const [placeholder, setPlaceholder] = useState(field ? (FIELD_LABELS[field.fieldTypeId] || field.fieldTypeId) : "");
  const [prefilled, setPrefilled] = useState("");
  const [fontSize, setFontSize] = useState("12");
  const [fontColor, setFontColor] = useState("#000000");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");

  if (!field) return null;

  const Icon = FIELD_ICONS[field.fieldTypeId] || PenTool;
  const label = FIELD_LABELS[field.fieldTypeId] || field.fieldTypeId.toUpperCase();
  const isText = TEXT_FIELDS.has(field.fieldTypeId);
  const isSignature = SIGNATURE_FIELDS.has(field.fieldTypeId);
  const isToggle = TOGGLE_FIELDS.has(field.fieldTypeId);
  const isAttachment = field.fieldTypeId === "attachment";
  const showPlaceholder = isText;
  const showPrefilled = isText && !["date", "signature_date"].includes(field.fieldTypeId);
  const showMultiLine = field.fieldTypeId === "text";
  const showReadOnly = isText || isToggle;
  const showStyling = isText;

  const handleDuplicate = () => {
    const newField = {
      ...field,
      id: `f${Date.now()}`,
      x: field.x + 20,
      y: field.y + 20,
    };
    setPlacedFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    toast.success("Field duplicated");
  };

  const handleDelete = () => {
    setPlacedFields((prev) => prev.filter((f) => f.id !== field.id));
    setSelectedFieldId(null);
    onClose();
    toast.success("Field deleted");
  };

  const handleReassign = (participantId: string) => {
    const p = participants.find((pp) => pp.id === participantId);
    if (!p) return;
    setPlacedFields((prev) =>
      prev.map((f) =>
        f.id === field.id
          ? { ...f, participantId: p.id, participantName: p.name, participantColor: p.color }
          : f
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-muted-foreground" />
          <span className="font-semibold text-sm tracking-wide">{label}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* General settings */}
        <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
            General settings
            <ChevronDown size={12} className={cn("transition-transform", generalOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pb-3">
            {/* Required */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={required} onCheckedChange={(c) => setRequired(!!c)} />
              <span className="text-sm">Required Field</span>
            </label>

            {/* Read Only */}
            {showReadOnly && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={readOnly} onCheckedChange={(c) => setReadOnly(!!c)} />
                <span className="text-sm">Read Only</span>
              </label>
            )}

            {/* Multi-line */}
            {showMultiLine && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={multiLine} onCheckedChange={(c) => setMultiLine(!!c)} />
                <span className="text-sm">Enable multi-line input</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px]">
                    Allow the signer to enter text across multiple lines
                  </TooltipContent>
                </Tooltip>
              </label>
            )}

            {/* Assigned participant */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Assigned participant</label>
              <Select value={field.participantId} onValueChange={handleReassign}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: field.participantColor }} />
                      {field.participantName}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Placeholder */}
            {showPlaceholder && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground">Placeholder text</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={10} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs max-w-[200px]">
                      Text shown inside the field before the signer fills it
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Prefilled */}
            {showPrefilled && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Prefilled text</label>
                <Input
                  value={prefilled}
                  onChange={(e) => setPrefilled(e.target.value)}
                  placeholder="Pre-populate this field with a value"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Styling */}
        {showStyling && (
          <>
            <Collapsible open={stylingOpen} onOpenChange={setStylingOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                Styling
                <ChevronDown size={12} className={cn("transition-transform", stylingOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pb-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Font size</label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="h-8 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map((s) => (
                        <SelectItem key={s} value={String(s)} className="text-xs">{s}px</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Font color</label>
                  <div className="grid grid-cols-10 gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setFontColor(c)}
                        className={cn(
                          "h-5 w-5 rounded-sm border transition-all",
                          fontColor === c ? "ring-2 ring-primary ring-offset-1" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Alignment</label>
                  <div className="flex gap-1">
                    {([
                      { val: "left" as const, icon: AlignLeft },
                      { val: "center" as const, icon: AlignCenter },
                      { val: "right" as const, icon: AlignRight },
                    ]).map(({ val, icon: AIcon }) => (
                      <button
                        key={val}
                        onClick={() => setAlignment(val)}
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-md border transition-colors",
                          alignment === val ? "bg-primary/10 border-primary text-primary" : "hover:bg-accent text-muted-foreground"
                        )}
                      >
                        <AIcon size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Separator />
          </>
        )}

        {/* Position */}
        <Collapsible open={positionOpen} onOpenChange={setPositionOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
            Position
            <ChevronDown size={12} className={cn("transition-transform", positionOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-3">
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: "X", value: Math.round(field.x) },
                { label: "Y", value: Math.round(field.y) },
                { label: "Width", value: Math.round(field.width) },
                { label: "Height", value: Math.round(field.height) },
              ]).map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">{item.label}</label>
                  <Input value={item.value} readOnly className="h-7 text-xs bg-muted/50 font-mono" />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Bottom actions */}
      <div className="border-t p-3 flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 flex-1" onClick={handleDuplicate}>
          <Copy size={12} />
          Duplicate
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 flex-1 text-destructive hover:text-destructive" onClick={handleDelete}>
          <Trash2 size={12} />
          Delete field
        </Button>
      </div>
    </div>
  );
};

export default EditorFieldSettings;
