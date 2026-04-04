import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PenTool,
  Type,
  Calendar,
  TextCursorInput,
  CheckSquare,
  Stamp,
  Radio,
  GripVertical,
  Mail,
  Building,
  User,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useEditorContext } from "./EditorContext";

export interface SidebarFieldType {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
}

const FIELD_CATEGORIES: { label: string; fields: SidebarFieldType[] }[] = [
  {
    label: "Signature fields",
    fields: [
      { id: "signature", label: "Signature", icon: PenTool, category: "signature", defaultWidth: 200, defaultHeight: 50 },
      { id: "reservation_signature", label: "Reservation signature", icon: PenTool, category: "signature", defaultWidth: 200, defaultHeight: 50 },
      { id: "initials", label: "Initials", icon: Type, category: "signature", defaultWidth: 100, defaultHeight: 40 },
      { id: "stamp", label: "Stamp", icon: Stamp, category: "signature", defaultWidth: 120, defaultHeight: 50 },
      { id: "signature_date", label: "Signature date", icon: Calendar, category: "signature", defaultWidth: 120, defaultHeight: 36 },
    ],
  },
  {
    label: "Signer's information",
    fields: [
      { id: "name", label: "Name", icon: TextCursorInput, category: "info", defaultWidth: 180, defaultHeight: 36 },
      { id: "email", label: "Email", icon: Mail, category: "info", defaultWidth: 180, defaultHeight: 36 },
      { id: "title", label: "Title", icon: User, category: "info", defaultWidth: 160, defaultHeight: 36 },
      { id: "company", label: "Company", icon: Building, category: "info", defaultWidth: 160, defaultHeight: 36 },
      { id: "date", label: "Date", icon: Calendar, category: "info", defaultWidth: 120, defaultHeight: 36 },
      { id: "text", label: "Text field", icon: Type, category: "info", defaultWidth: 180, defaultHeight: 36 },
    ],
  },
  {
    label: "Additional fields",
    fields: [
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, category: "additional", defaultWidth: 30, defaultHeight: 30 },
      { id: "radio", label: "Radio button", icon: Radio, category: "additional", defaultWidth: 140, defaultHeight: 36 },
      { id: "attachment", label: "File attachment", icon: Paperclip, category: "additional", defaultWidth: 140, defaultHeight: 40 },
    ],
  },
];

const EditorFieldsSidebar = ({ asPanel = false }: { asPanel?: boolean }) => {
  const { participants } = useEditorContext();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");

  const hasParticipants = participants.length > 0;
  const activeParticipant = participants.find((p) => p.id === selectedParticipantId) || participants[0];

  // Auto-select first participant when participants change
  if (hasParticipants && !activeParticipant) {
    setSelectedParticipantId(participants[0].id);
  }

  const handleDragStart = (e: React.DragEvent, field: SidebarFieldType) => {
    if (!hasParticipants || !activeParticipant) {
      e.preventDefault();
      toast.error("Add at least one participant before placing fields");
      return;
    }
    e.dataTransfer.setData("application/field-type", JSON.stringify({
      id: field.id,
      label: field.label,
      defaultWidth: field.defaultWidth,
      defaultHeight: field.defaultHeight,
      participantId: activeParticipant.id,
      participantName: activeParticipant.name,
      participantColor: activeParticipant.color,
    }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleFieldClick = () => {
    if (!hasParticipants) {
      toast.error("Add at least one participant before placing fields");
    }
  };

  if (asPanel) {
    return (
      <div className="flex flex-col gap-3">
        {/* Participant selector */}
        {hasParticipants ? (
          <Select
            value={activeParticipant?.id || ""}
            onValueChange={setSelectedParticipantId}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue>
                {activeParticipant && (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: activeParticipant.color }} />
                    <span className="truncate">{activeParticipant.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="h-9 rounded-md border border-dashed flex items-center px-3">
            <span className="text-xs text-muted-foreground">No participants added</span>
          </div>
        )}

        {hasParticipants && activeParticipant ? (
          <div
            className="text-xs pl-2.5"
            style={{ borderLeft: `3px solid ${activeParticipant.color}`, color: "hsl(var(--brand-indigo))" }}
          >
            Drag & drop fields to place them in the document
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Add participants first to start placing fields
          </p>
        )}

        {FIELD_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {cat.label}
            </p>
            {cat.fields.map((field) => {
              const Icon = field.icon;
              const disabled = !hasParticipants;
              return (
                <div
                  key={field.id}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, field)}
                  onClick={disabled ? handleFieldClick : undefined}
                  className={cn(
                    "flex items-center gap-2.5 h-10 px-2 rounded-md transition-colors group",
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-grab active:cursor-grabbing hover:bg-muted"
                  )}
                >
                  <GripVertical
                    size={12}
                    className={cn(
                      "text-muted-foreground/40 flex-shrink-0 transition-opacity",
                      disabled ? "opacity-30" : "opacity-0 group-hover:opacity-100"
                    )}
                  />
                  <Icon size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{field.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-[260px] border-r bg-card flex flex-col flex-shrink-0 overflow-hidden">
      {/* Sticky header */}
      <div className="p-3 border-b flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fields</p>

        {/* Participant selector */}
        {hasParticipants ? (
          <Select
            value={activeParticipant?.id || ""}
            onValueChange={setSelectedParticipantId}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue>
                {activeParticipant && (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: activeParticipant.color }} />
                    <span className="truncate">{activeParticipant.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="h-9 rounded-md border border-dashed flex items-center px-3">
            <span className="text-xs text-muted-foreground">No participants</span>
          </div>
        )}

        {/* Helper text */}
        {hasParticipants && activeParticipant ? (
          <div
            className="text-xs pl-2.5"
            style={{ borderLeft: `3px solid ${activeParticipant.color}`, color: "hsl(var(--brand-indigo))" }}
          >
            Drag & drop fields to place them in the document
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Add participants first to start placing fields
          </p>
        )}
      </div>

      {/* Scrollable field list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {FIELD_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2 px-2">
              {cat.label}
            </p>
            {cat.fields.map((field) => {
              const Icon = field.icon;
              const disabled = !hasParticipants;
              return (
                <div
                  key={field.id}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, field)}
                  onClick={disabled ? handleFieldClick : undefined}
                  className={cn(
                    "flex items-center gap-2.5 h-10 px-2 rounded-md transition-colors group",
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-grab active:cursor-grabbing hover:bg-muted"
                  )}
                >
                  <GripVertical
                    size={12}
                    className={cn(
                      "text-muted-foreground/40 flex-shrink-0 transition-opacity",
                      disabled ? "opacity-30" : "opacity-0 group-hover:opacity-100"
                    )}
                  />
                  <Icon size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{field.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export { FIELD_CATEGORIES };
export default EditorFieldsSidebar;
