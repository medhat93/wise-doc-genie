import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PenTool,
  Type,
  Calendar,
  TextCursorInput,
  CheckSquare,
  Stamp,
  ChevronDown,
  Radio,
  GripVertical,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

/* ── Types ── */
export interface FieldType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultWidth: number;
  defaultHeight: number;
}

export interface PlacedField {
  id: string;
  fieldTypeId: string;
  participantId: string;
  participantName: string;
  participantColor: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ParticipantOption {
  id: string;
  name: string;
  color: string;
}

const FIELD_TYPES: FieldType[] = [
  { id: "signature", label: "Signature", description: "Full signature", icon: PenTool, defaultWidth: 200, defaultHeight: 50 },
  { id: "initials", label: "Initials", description: "Initials only", icon: Type, defaultWidth: 100, defaultHeight: 40 },
  { id: "date", label: "Date", description: "Date field", icon: Calendar, defaultWidth: 120, defaultHeight: 36 },
  { id: "text", label: "Text", description: "Free text input", icon: TextCursorInput, defaultWidth: 180, defaultHeight: 36 },
  { id: "checkbox", label: "Checkbox", description: "Checkbox", icon: CheckSquare, defaultWidth: 30, defaultHeight: 30 },
  { id: "stamp", label: "Stamp", description: "Company stamp", icon: Stamp, defaultWidth: 120, defaultHeight: 50 },
  { id: "dropdown", label: "Dropdown", description: "Dropdown select", icon: ChevronDown, defaultWidth: 160, defaultHeight: 36 },
  { id: "radio", label: "Radio", description: "Radio options", icon: Radio, defaultWidth: 140, defaultHeight: 36 },
];

const MOCK_PARTICIPANTS: ParticipantOption[] = [
  { id: "p1", name: "Ahmed Al-Rashid", color: "#4F46E5" },
  { id: "p2", name: "Sarah Johnson", color: "#DC2626" },
  { id: "p3", name: "Adel Al-Dossary", color: "#D97706" },
  { id: "p4", name: "Mohammed Al-Faisal", color: "#059669" },
];

const INITIAL_PLACED_FIELDS: PlacedField[] = [
  { id: "f1", fieldTypeId: "signature", participantId: "p1", participantName: "Ahmed Al-Rashid", participantColor: "#4F46E5", page: 1, x: 60, y: 680, width: 200, height: 50 },
  { id: "f2", fieldTypeId: "date", participantId: "p1", participantName: "Ahmed Al-Rashid", participantColor: "#4F46E5", page: 1, x: 300, y: 690, width: 120, height: 36 },
  { id: "f3", fieldTypeId: "signature", participantId: "p2", participantName: "Sarah Johnson", participantColor: "#DC2626", page: 1, x: 60, y: 760, width: 200, height: 50 },
];

/* ══════════ FIELDS PANEL ══════════ */
const EditorFieldsPanel = () => {
  const [selectedParticipant, setSelectedParticipant] = useState<string>(MOCK_PARTICIPANTS[0].id);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>(INITIAL_PLACED_FIELDS);

  const activeParticipant = MOCK_PARTICIPANTS.find((p) => p.id === selectedParticipant) || MOCK_PARTICIPANTS[0];

  const handleDragStart = (e: React.DragEvent, fieldType: FieldType) => {
    e.dataTransfer.setData("application/field-type", JSON.stringify({
      ...fieldType,
      participantId: activeParticipant.id,
      participantName: activeParticipant.name,
      participantColor: activeParticipant.color,
    }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const removePlacedField = (id: string) => {
    setPlacedFields((prev) => prev.filter((f) => f.id !== id));
    toast.success("Field removed");
  };

  const getFieldType = (id: string) => FIELD_TYPES.find((f) => f.id === id);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <p className="text-xs text-muted-foreground">
        Drag fields onto the document for participants to fill
      </p>

      {/* ── Participant selector ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Assign to</p>
        <div className="flex flex-wrap gap-1.5">
          {MOCK_PARTICIPANTS.map((p) => {
            const isActive = p.id === selectedParticipant;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedParticipant(p.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                  isActive
                    ? "border-current"
                    : "border-border hover:bg-accent"
                )}
                style={isActive ? {
                  backgroundColor: `${p.color}15`,
                  borderColor: p.color,
                  color: p.color,
                } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className={cn(!isActive && "text-foreground")}>{p.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* ── Field types grid ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Field types</p>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TYPES.map((ft) => {
            const Icon = ft.icon;
            return (
              <div
                key={ft.id}
                draggable
                onDragStart={(e) => handleDragStart(e, ft)}
                className="border rounded-md p-2.5 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors flex items-start gap-2 group"
                style={{ borderLeftWidth: 3, borderLeftColor: activeParticipant.color }}
              >
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  <GripVertical size={10} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Icon size={14} className="text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-tight">{ft.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{ft.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* ── Placed fields summary ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Placed fields</p>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
            {placedFields.length}
          </Badge>
        </div>
        {placedFields.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No fields placed yet</p>
        ) : (
          <div className="space-y-1">
            {placedFields.map((pf) => {
              const ft = getFieldType(pf.fieldTypeId);
              const Icon = ft?.icon || PenTool;
              return (
                <div
                  key={pf.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md border bg-card text-xs group"
                >
                  <Icon size={12} className="text-muted-foreground flex-shrink-0" />
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pf.participantColor }}
                  />
                  <span className="truncate flex-1 font-medium">{pf.participantName}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">Page {pf.page}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => removePlacedField(pf.id)}
                        className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 size={10} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">Remove field</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { FIELD_TYPES, MOCK_PARTICIPANTS, INITIAL_PLACED_FIELDS };
export default EditorFieldsPanel;
