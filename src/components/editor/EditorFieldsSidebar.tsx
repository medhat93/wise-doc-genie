import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons";
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
  Mail,
  Building,
  User,
  Paperclip,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEditorContext } from "./EditorContext";
import AddParticipantDialog from "./AddParticipantDialog";
import ParticipantsDialog from "@/components/ParticipantsDialog";

export interface SidebarFieldType {
  id: string;
  label: string;
  icon: React.ElementType;
  category: "signature" | "info" | "other";
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
    label: "Others",
    fields: [
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, category: "other", defaultWidth: 30, defaultHeight: 30 },
      { id: "radio", label: "Radio", icon: Radio, category: "other", defaultWidth: 140, defaultHeight: 36 },
      { id: "attachment", label: "Attachment", icon: Paperclip, category: "other", defaultWidth: 140, defaultHeight: 40 },
      { id: "dropdown", label: "Dropdown", icon: ChevronDown, category: "other", defaultWidth: 160, defaultHeight: 36 },
    ],
  },
];

const ADD_PARTICIPANT_VALUE = "__add_new__";

const EditorFieldsSidebar = ({ asPanel = false }: { asPanel?: boolean }) => {
  const { participants } = useEditorContext();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);

  const hasParticipants = participants.length > 0;

  useEffect(() => {
    if (!hasParticipants) {
      if (selectedParticipantId) setSelectedParticipantId("");
      return;
    }

    const selectedStillExists = participants.some((participant) => participant.id === selectedParticipantId);
    if (!selectedParticipantId || !selectedStillExists) {
      setSelectedParticipantId(participants[0].id);
    }
  }, [hasParticipants, participants, selectedParticipantId]);

  const activeParticipant = participants.find((participant) => participant.id === selectedParticipantId) || participants[0];

  const handleSelectChange = (value: string) => {
    if (value === ADD_PARTICIPANT_VALUE) {
      setAddDialogOpen(true);
      return;
    }

    setSelectedParticipantId(value);
  };

  const handleDragStart = (e: React.DragEvent, field: SidebarFieldType) => {
    if (!hasParticipants || !activeParticipant) {
      e.preventDefault();
      toast.error("Add at least one participant before placing fields");
      return;
    }

    e.dataTransfer.setData(
      "application/field-type",
      JSON.stringify({
        id: field.id,
        label: field.label,
        defaultWidth: field.defaultWidth,
        defaultHeight: field.defaultHeight,
        participantId: activeParticipant.id,
        participantName: activeParticipant.name,
        participantColor: activeParticipant.color,
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleFieldClick = () => {
    if (!hasParticipants) {
      toast.error("Add at least one participant before placing fields");
    }
  };

  const content = (
    <div className="flex flex-col gap-6">
      {hasParticipants ? (
        <>
          <div className="space-y-3">
            <Select value={activeParticipant?.id || ""} onValueChange={handleSelectChange}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select participant">
                  {activeParticipant && (
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3.5 w-3.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: activeParticipant.color }}
                      />
                      <span className="truncate">{activeParticipant.name}</span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id} className="text-sm">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3.5 w-3.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="truncate">{participant.name}</span>
                    </span>
                  </SelectItem>
                ))}
                <div className="border-t mt-1 pt-1">
                  <SelectItem value={ADD_PARTICIPANT_VALUE} className="text-sm">
                    <span className="flex items-center gap-2 text-primary">
                      <HugeiconsIcon icon={UserAdd01Icon} size={14} />
                      Add new participant
                    </span>
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>

            <button
              onClick={() => setParticipantsDialogOpen(true)}
              className="inline-flex items-center gap-2 text-sm text-primary transition-opacity hover:opacity-80"
            >
              <HugeiconsIcon icon={UserMultiple02Icon} size={14} />
              Manage participants
            </button>

            <div className="flex items-center gap-3">
              <span className="h-6 w-1 rounded-full bg-primary flex-shrink-0" />
              <p className="text-sm text-primary">Drag & drop fields to place them in the document</p>
            </div>
          </div>

          <div className="space-y-6">
            {FIELD_CATEGORIES.map((category) => (
              <section key={category.label} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.label}
                </p>

                <div className="space-y-0.5">
                  {category.fields.map((field) => {
                    const Icon = field.icon;
                    return (
                      <button
                        key={field.id}
                        type="button"
                        draggable
                        onDragStart={(e) => handleDragStart(e, field)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/60 active:cursor-grabbing cursor-grab"
                      >
                        <Icon size={20} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground">{field.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <Button className="w-full h-10 gap-2" onClick={() => setParticipantsDialogOpen(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} size={14} />
            Add participants
          </Button>
          <p className="text-xs text-muted-foreground">Add a participant to start placing fields</p>

          <div className="space-y-6 opacity-50">
            {FIELD_CATEGORIES.map((category) => (
              <section key={category.label} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.label}
                </p>

                <div className="space-y-0.5">
                  {category.fields.map((field) => {
                    const Icon = field.icon;
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={handleFieldClick}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left",
                          "cursor-not-allowed"
                        )}
                      >
                        <Icon size={20} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground">{field.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <AddParticipantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdded={(participant) => setSelectedParticipantId(participant.id)}
      />
      <ParticipantsDialog open={participantsDialogOpen} onOpenChange={setParticipantsDialogOpen} />
    </div>
  );

  if (asPanel) {
    return content;
  }

  return (
    <div className="w-[280px] border-r bg-card flex flex-col flex-shrink-0 overflow-hidden">
      <div className="px-4 py-3 border-b flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">Fields</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{content}</div>
    </div>
  );
};

export { FIELD_CATEGORIES };
export default EditorFieldsSidebar;
