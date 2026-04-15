import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  PenTool,
  Type,
  Calendar,
  TextCursorInput,
  CheckSquare,
  Stamp,
  ChevronDown,
  Radio,
  Trash2,
  Clock,
  Mail,
  User,
  Building2,
  Paperclip,
  ListFilter,
  CircleDot,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ParticipantsDialog from "@/components/ParticipantsDialog";

/* ── Types ── */
export interface FieldType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: "signature" | "text" | "other";
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
  // Signature fields
  { id: "signature", label: "Signature", description: "Full signature", icon: PenTool, category: "signature", defaultWidth: 200, defaultHeight: 50 },
  { id: "initials", label: "Initials", description: "Initials only", icon: Type, category: "signature", defaultWidth: 100, defaultHeight: 40 },
  { id: "stamp", label: "Stamp", description: "Company stamp", icon: User, category: "signature", defaultWidth: 120, defaultHeight: 50 },
  { id: "digital-stamp", label: "Digital stamp", description: "Digital stamp", icon: Clock, category: "signature", defaultWidth: 120, defaultHeight: 50 },
  { id: "signature-date", label: "Signature date", description: "Signature date", icon: Calendar, category: "signature", defaultWidth: 120, defaultHeight: 36 },
  // Text fields
  { id: "name", label: "Name", description: "Name field", icon: PenTool, category: "text", defaultWidth: 160, defaultHeight: 36 },
  { id: "email", label: "Email", description: "Email field", icon: Mail, category: "text", defaultWidth: 180, defaultHeight: 36 },
  { id: "title", label: "Title", description: "Title field", icon: User, category: "text", defaultWidth: 160, defaultHeight: 36 },
  { id: "company", label: "Company", description: "Company field", icon: Building2, category: "text", defaultWidth: 160, defaultHeight: 36 },
  { id: "date", label: "Date", description: "Date field", icon: Calendar, category: "text", defaultWidth: 120, defaultHeight: 36 },
  { id: "text", label: "Text field", description: "Free text input", icon: Type, category: "text", defaultWidth: 180, defaultHeight: 36 },
  // Others
  { id: "checkbox", label: "Checkbox", description: "Checkbox", icon: CheckSquare, category: "other", defaultWidth: 30, defaultHeight: 30 },
  { id: "radio", label: "Radio", description: "Radio options", icon: CircleDot, category: "other", defaultWidth: 140, defaultHeight: 36 },
  { id: "attachment", label: "Attachment", description: "File attachment", icon: Paperclip, category: "other", defaultWidth: 160, defaultHeight: 36 },
  { id: "dropdown", label: "Dropdown", description: "Dropdown select", icon: ListFilter, category: "other", defaultWidth: 160, defaultHeight: 36 },
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

const CATEGORIES = [
  { key: "signature" as const, label: "SIGNATURE FIELDS" },
  { key: "text" as const, label: "TEXT FIELDS" },
  { key: "other" as const, label: "OTHERS" },
];

/* ══════════ FIELDS PANEL ══════════ */
const EditorFieldsPanel = () => {
  const [selectedParticipant, setSelectedParticipant] = useState<string>(MOCK_PARTICIPANTS[0].id);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>(INITIAL_PLACED_FIELDS);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);

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

  // Check if signature field is full-width (only item in its row)
  const isFullWidth = (ft: FieldType) => {
    const categoryFields = FIELD_TYPES.filter(f => f.category === ft.category);
    const idx = categoryFields.indexOf(ft);
    // First item in signature category is full width
    if (ft.category === "signature" && idx === 0) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <p className="text-xs text-muted-foreground">
        Drag & drop fields to place them in the document
      </p>

      {/* Manage participants button */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 text-sm w-full"
        onClick={() => setParticipantsDialogOpen(true)}
      >
        Manage participants
      </Button>

      {/* Participant selector dropdown */}
      <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
        <SelectTrigger className="h-9 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: activeParticipant.color }}
            />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {MOCK_PARTICIPANTS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Field categories */}
      {CATEGORIES.map((cat) => {
        const fields = FIELD_TYPES.filter(f => f.category === cat.key);
        return (
          <div key={cat.key} className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {fields.map((ft) => {
                const Icon = ft.icon;
                const fullWidth = isFullWidth(ft);
                return (
                  <div
                    key={ft.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ft)}
                    className={cn(
                      "border rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors flex items-center gap-2.5",
                      fullWidth && "col-span-2"
                    )}
                    style={{ borderLeftWidth: 3, borderLeftColor: activeParticipant.color }}
                  >
                    <Icon size={16} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium">{ft.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Participants Dialog */}
      <ParticipantsDialog
        open={participantsDialogOpen}
        onOpenChange={setParticipantsDialogOpen}
        fromEditor
      />
    </div>
  );
};

export { FIELD_TYPES, MOCK_PARTICIPANTS, INITIAL_PLACED_FIELDS };
export default EditorFieldsPanel;
