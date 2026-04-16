import { useState, useRef, useCallback, useMemo } from "react";
import { useEditorContext } from "./EditorContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  GripVertical,
  ChevronDown,
  Plus,
  Minus,
  Shield,
  Phone,
  Mail,
  Eye,
  EyeOff,
  User,
  Users,
  Bookmark,
  MousePointer,
  List,
  Info,
  MessageSquare,
  X,
  Sparkles,
  Copy,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MOCK_DOCUMENTS } from "./EditorCanvas";
import { toast } from "sonner";

/* ── Types ── */
export type ParticipantRole = "signer" | "approver" | "viewer" | "cc";
export type SendingMethod = "email" | "sms" | "whatsapp";
export type VerificationMethodType = "sms" | "whatsapp" | "absher" | "nafath_only" | "nafath_digital";
export type VerificationSpecs = "without_id" | "with_id" | "with_id_biometrics";

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
  color: string;
  order: number;
  language: "en" | "ar";
  sendingMethod: SendingMethod;
  sendingPhone?: string;
  needsVerification: boolean;
  verificationMethod?: VerificationMethodType;
  verificationSpecs?: VerificationSpecs;
  phone?: string;
  nationalId?: string;
}

export type DocumentVisibility = Record<string, string[]>;

const COLORS = [
  "#4F46E5", "#DC2626", "#059669", "#D97706",
  "#7C3AED", "#0891B2", "#BE185D", "#65A30D",
];

const ROLE_STYLES: Record<ParticipantRole, { label: string; className: string }> = {
  signer: { label: "Signer", className: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30" },
  approver: { label: "Approver", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  viewer: { label: "Viewer", className: "bg-muted text-muted-foreground border-border" },
  cc: { label: "CC", className: "bg-muted text-muted-foreground border-border" },
};

const VERIFICATION_METHOD_LABELS: Record<VerificationMethodType, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  absher: "Absher",
  nafath_only: "Nafath only",
  nafath_digital: "Nafath & Digital certificate",
};

const VERIFICATION_SPECS_LABELS: Record<VerificationSpecs, { label: string; tooltip: string }> = {
  without_id: { label: "Without national ID", tooltip: "Signer verifies via Nafath app without pre-filled ID" },
  with_id: { label: "With national ID", tooltip: "Signer's national ID is pre-validated before Nafath prompt" },
  with_id_biometrics: { label: "With national ID & Biometrics", tooltip: "Highest security — requires national ID plus biometric verification via Nafath" },
};

/* ── Contacts list (mock) ── */
const CONTACTS = [
  { name: "Ahmed Al-Rashid", email: "ahmed@signit.sa", phone: "+966 50 111 2222" },
  { name: "Sarah Johnson", email: "sarah@acme.com", phone: "+1 555 123 4567" },
  { name: "Adel Al-Dossary", email: "adel@enterprise.sa", phone: "+966 55 333 4444" },
  { name: "Mohammed Al-Faisal", email: "mohammed@legal.sa", phone: "+966 50 123 4567" },
  { name: "Fatima Al-Zahra", email: "fatima@company.com", phone: "+966 54 555 6666" },
  { name: "Ali Hassan", email: "ali@corp.sa", phone: "+966 56 777 8888" },
  { name: "Amal Khouri", email: "amal@design.sa", phone: "+966 50 999 0000" },
  { name: "David Chen", email: "david@company.com", phone: "+1 555 987 6543" },
];

/* ── Demo data ── */
const DEMO_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "Ahmed Al-Rashid", email: "ahmed@signit.sa", role: "signer", color: COLORS[0], order: 1, language: "en", sendingMethod: "email", needsVerification: false },
  { id: "p2", name: "Sarah Johnson", email: "sarah@acme.com", role: "signer", color: COLORS[1], order: 2, language: "en", sendingMethod: "email", needsVerification: true, verificationMethod: "sms" },
  { id: "p3", name: "Adel Al-Dossary", email: "adel@enterprise.sa", role: "signer", color: COLORS[3], order: 3, language: "en", sendingMethod: "whatsapp", sendingPhone: "+966 55 333 4444", needsVerification: true, verificationMethod: "whatsapp" },
  { id: "p4", name: "Mohammed Al-Faisal", email: "mohammed@legal.sa", role: "signer", color: COLORS[2], order: 4, language: "ar", sendingMethod: "sms", sendingPhone: "+966 50 123 4567", needsVerification: true, verificationMethod: "nafath_only", verificationSpecs: "with_id", nationalId: "1012345678" },
];

const MOCK_WORKFLOWS = [
  { id: "w1", name: "Standard 2-Signer Flow", desc: "2 signers, sequential" },
  { id: "w2", name: "Legal Review + Sign", desc: "1 approver → 2 signers parallel" },
];

/* ── Sortable signer item ── */
const SortableStepItem = ({
  participant,
  onOrderChange,
}: {
  participant: Participant;
  onOrderChange: (id: string, delta: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: participant.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md border bg-card text-sm",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical size={14} />
      </button>
      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: participant.color }} />
      <span className="truncate flex-1 text-xs">{participant.name}</span>
      <span className="text-[10px] text-muted-foreground truncate">{participant.email}</span>
      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={() => onOrderChange(participant.id, -1)}
          className="h-5 w-5 flex items-center justify-center rounded border text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Minus size={10} />
        </button>
        <span className="text-[10px] font-bold w-4 text-center">{participant.order}</span>
        <button
          onClick={() => onOrderChange(participant.id, 1)}
          className="h-5 w-5 flex items-center justify-center rounded border text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Plus size={10} />
        </button>
      </div>
    </div>
  );
};

/* ── Form state ── */
interface AddFormState {
  role: ParticipantRole;
  language: "en" | "ar";
  sendingMethod: SendingMethod;
  name: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  needsVerification: boolean;
  verificationMethod: VerificationMethodType;
  verificationSpecs: VerificationSpecs;
  nationalId: string;
}

const INITIAL_FORM: AddFormState = {
  role: "signer",
  language: "en",
  sendingMethod: "email",
  name: "",
  email: "",
  phoneCode: "+966",
  phoneNumber: "",
  needsVerification: false,
  verificationMethod: "sms",
  verificationSpecs: "without_id",
  nationalId: "",
};

const hasSpecs = (method?: VerificationMethodType) => method === "nafath_only" || method === "nafath_digital";

const needsNationalId = (method?: VerificationMethodType, specs?: VerificationSpecs) => {
  if (method === "absher") return true;
  if ((method === "nafath_only" || method === "nafath_digital") && (specs === "with_id" || specs === "with_id_biometrics")) return true;
  return false;
};

const showNafathBanner = (method?: VerificationMethodType) => {
  return method === "absher" || method === "nafath_only" || method === "nafath_digital";
};

const participantToForm = (p: Participant): AddFormState => {
  const phoneCode = p.sendingPhone?.match(/^\+\d+/)?.[0] || "+966";
  const phoneNumber = p.sendingPhone?.replace(/^\+\d+\s*/, "") || "";
  return {
    role: p.role,
    language: p.language,
    sendingMethod: p.sendingMethod,
    name: p.name,
    email: p.email,
    phoneCode,
    phoneNumber,
    needsVerification: p.needsVerification,
    verificationMethod: p.verificationMethod || "sms",
    verificationSpecs: p.verificationSpecs || "without_id",
    nationalId: p.nationalId || "",
  };
};

/* ── Inline form component (shared between add & edit) ── */
const ParticipantFormCard = ({
  form,
  updateForm,
  onSubmit,
  onCancel,
  submitLabel,
  isDisabled,
}: {
  form: AddFormState;
  updateForm: (u: Partial<AddFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isDisabled: boolean;
}) => (
  <div className="border rounded-lg p-3 bg-card space-y-3 animate-in slide-in-from-top-2 duration-200">
    {/* Row 1: Role, Language, Sending method, Close */}
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={form.role} onValueChange={(v) => updateForm({ role: v as ParticipantRole })}>
        <SelectTrigger className="h-7 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="signer" className="text-xs">Signer</SelectItem>
          <SelectItem value="approver" className="text-xs">Approver</SelectItem>
          <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
        </SelectContent>
      </Select>
      <Select value={form.language} onValueChange={(v) => updateForm({ language: v as "en" | "ar" })}>
        <SelectTrigger className="h-7 w-[90px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en" className="text-xs">English</SelectItem>
          <SelectItem value="ar" className="text-xs">Arabic</SelectItem>
        </SelectContent>
      </Select>
      <Select value={form.sendingMethod} onValueChange={(v) => updateForm({ sendingMethod: v as SendingMethod })}>
        <SelectTrigger className="h-7 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="email" className="text-xs">Email</SelectItem>
          <SelectItem value="sms" className="text-xs">SMS</SelectItem>
          <SelectItem value="whatsapp" className="text-xs">WhatsApp</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onCancel}>
        <X size={14} />
      </Button>
    </div>

    {/* Row 2: Name with contact autocomplete */}
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Name"
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
          className="h-8 text-xs"
          autoComplete="off"
        />
        {form.name.length >= 1 && (() => {
          const matches = CONTACTS.filter(c =>
            c.name.toLowerCase().includes(form.name.toLowerCase()) &&
            c.name.toLowerCase() !== form.name.toLowerCase()
          );
          if (matches.length === 0) return null;
          return (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 border rounded-lg bg-popover shadow-md max-h-[160px] overflow-y-auto">
              {matches.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                  onClick={() => {
                    updateForm({
                      name: c.name,
                      email: c.email,
                      phoneNumber: c.phone.replace(/^\+\d+\s*/, ""),
                    });
                  }}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-semibold text-primary">
                      {c.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                  </div>
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Row 3: Email or Phone */}
      {form.sendingMethod === "email" ? (
        <Input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateForm({ email: e.target.value })}
          className="h-8 text-xs"
        />
      ) : (
        <div className="flex gap-1">
          <Select value={form.phoneCode} onValueChange={(v) => updateForm({ phoneCode: v })}>
            <SelectTrigger className="h-8 w-[72px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+966" className="text-xs">+966</SelectItem>
              <SelectItem value="+1" className="text-xs">+1</SelectItem>
              <SelectItem value="+44" className="text-xs">+44</SelectItem>
              <SelectItem value="+971" className="text-xs">+971</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Phone number"
            value={form.phoneNumber}
            onChange={(e) => updateForm({ phoneNumber: e.target.value })}
            className="h-8 text-xs flex-1"
          />
        </div>
      )}
    </div>

    {/* Row 3: Verification */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">Needs to verify</span>
        <Switch
          checked={form.needsVerification}
          onCheckedChange={(checked) => updateForm({
            needsVerification: checked,
            verificationMethod: "sms",
            verificationSpecs: "without_id",
            nationalId: "",
          })}
          className="scale-75 origin-right"
        />
      </div>
      {form.needsVerification && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground mb-0.5 block">Verification method</label>
              <Select
                value={form.verificationMethod}
                onValueChange={(v) => {
                  const method = v as VerificationMethodType;
                  updateForm({
                    verificationMethod: method,
                    verificationSpecs: hasSpecs(method) ? "without_id" : "without_id",
                    nationalId: "",
                  });
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VERIFICATION_METHOD_LABELS) as VerificationMethodType[]).map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">{VERIFICATION_METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasSpecs(form.verificationMethod) && (
              <div className="flex-1">
                <label className="text-[9px] text-muted-foreground mb-0.5 block">Verification specs</label>
                <Select
                  value={form.verificationSpecs}
                  onValueChange={(v) => updateForm({ verificationSpecs: v as VerificationSpecs })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VERIFICATION_SPECS_LABELS) as VerificationSpecs[]).map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        <div className="flex items-center gap-1">
                          {VERIFICATION_SPECS_LABELS[s].label}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={10} className="text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[200px] text-xs">
                              {VERIFICATION_SPECS_LABELS[s].tooltip}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {needsNationalId(form.verificationMethod, form.verificationSpecs) && (
            <Input
              placeholder="National ID number"
              value={form.nationalId}
              onChange={(e) => updateForm({ nationalId: e.target.value })}
              className="h-7 text-xs"
            />
          )}

          {(form.verificationMethod === "sms" || form.verificationMethod === "whatsapp") && form.sendingMethod === "email" && (
            <div className="flex gap-1">
              <Select value={form.phoneCode} onValueChange={(v) => updateForm({ phoneCode: v })}>
                <SelectTrigger className="h-7 w-[68px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+966" className="text-xs">+966</SelectItem>
                  <SelectItem value="+1" className="text-xs">+1</SelectItem>
                  <SelectItem value="+44" className="text-xs">+44</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Phone for verification"
                value={form.phoneNumber}
                onChange={(e) => updateForm({ phoneNumber: e.target.value })}
                className="h-7 text-xs flex-1"
              />
            </div>
          )}

          {showNafathBanner(form.verificationMethod) && (
            <div className="flex items-start gap-2 rounded-lg p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                {form.verificationMethod === "absher"
                  ? "Absher service is available only for Saudi citizens or expats with an active Absher account."
                  : "Nafath service is available only for Saudi citizens or expats with an active Nafath account."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Row 4: Submit / Cancel */}
    <div className="flex items-center gap-2">
      <Button size="sm" className="h-7 text-xs" onClick={onSubmit} disabled={isDisabled}>
        {submitLabel}
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  </div>
);

/* ══════════ MAIN PANEL ══════════ */
const EditorParticipantsPanel = () => {
  const { participants, setParticipants, sequentialSigning, setSequentialSigning } = useEditorContext();
  const sequential = sequentialSigning;
  const setSequential = setSequentialSigning;
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddFormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddFormState>(INITIAL_FORM);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [selectWorkflowOpen, setSelectWorkflowOpen] = useState(false);
  const [viewOrderOpen, setViewOrderOpen] = useState(false);
  const [saveWorkflowName, setSaveWorkflowName] = useState("");
  const [showSaveWorkflow, setShowSaveWorkflow] = useState(false);
  const [visibility, setVisibility] = useState<DocumentVisibility>(() => {
    const v: DocumentVisibility = {};
    MOCK_DOCUMENTS.forEach((d) => { v[d.id] = []; });
    return v;
  });

  const visibilityRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const signers = participants.filter((p) => p.role === "signer").sort((a, b) => a.order - b.order);
  const approvers = participants.filter((p) => p.role === "approver");
  const nextColor = COLORS[participants.length % COLORS.length];

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setVisibility((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((docId) => {
        next[docId] = next[docId].filter((pid) => pid !== id);
      });
      return next;
    });
    setConfirmRemoveId(null);
    if (editingId === id) setEditingId(null);
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleOrderChange = (id: string, delta: number) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, order: Math.max(1, p.order + delta) };
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = signers.findIndex((s) => s.id === active.id);
    const newIdx = signers.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(signers, oldIdx, newIdx);
    setParticipants((prev) =>
      prev.map((p) => {
        const idx = reordered.findIndex((s) => s.id === p.id);
        return idx >= 0 ? { ...p, order: idx + 1 } : p;
      })
    );
  };

  const toggleDocVisibility = (docId: string, participantId: string) => {
    setVisibility((prev) => {
      const current = prev[docId] || [];
      if (current.includes(participantId)) {
        // Check if this would leave the participant with 0 documents
        const otherDocsVisible = Object.entries(prev).filter(
          ([dId, pIds]) => dId !== docId && pIds.includes(participantId)
        ).length;
        if (otherDocsVisible === 0) {
          toast.error("Participant must have at least one visible document");
          return prev;
        }
        return { ...prev, [docId]: current.filter((id) => id !== participantId) };
      }
      return { ...prev, [docId]: [...current, participantId] };
    });
  };

  const handleAddMe = () => {
    if (participants.some((p) => p.email === "ahmed@signit.sa")) {
      toast.error("You are already added as a participant");
      return;
    }
    const maxOrder = Math.max(0, ...participants.filter(p => p.role === "signer").map(p => p.order));
    const me: Participant = {
      id: `p${Date.now()}`,
      name: "Ahmed Al-Rashid",
      email: "ahmed@signit.sa",
      role: "signer",
      color: COLORS[participants.length % COLORS.length],
      order: maxOrder + 1,
      language: "en",
      sendingMethod: "email",
      needsVerification: false,
    };
    setParticipants((prev) => [...prev, me]);
    setVisibility((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((docId) => { next[docId] = [...next[docId], me.id]; });
      return next;
    });
    toast.success("Added you as a participant");
  };

  const buildFormParticipant = (f: AddFormState, id: string, color: string, order: number): Participant => ({
    id,
    name: f.name.trim(),
    email: f.sendingMethod === "email" ? f.email.trim() : "",
    role: f.role,
    color,
    order: f.role === "signer" ? order : 0,
    language: f.language,
    sendingMethod: f.sendingMethod,
    sendingPhone: f.sendingMethod !== "email" ? `${f.phoneCode} ${f.phoneNumber}` : undefined,
    needsVerification: f.needsVerification,
    verificationMethod: f.needsVerification ? f.verificationMethod : undefined,
    verificationSpecs: f.needsVerification && hasSpecs(f.verificationMethod) ? f.verificationSpecs : undefined,
    nationalId: f.needsVerification && needsNationalId(f.verificationMethod, f.verificationSpecs) ? f.nationalId : undefined,
    phone: f.needsVerification && (f.verificationMethod === "sms" || f.verificationMethod === "whatsapp") && f.sendingMethod === "email"
      ? `${f.phoneCode} ${f.phoneNumber}` : undefined,
  });

  const handleAddParticipant = () => {
    if (!form.name.trim()) return;
    const maxOrder = Math.max(0, ...participants.filter(p => p.role === "signer").map(p => p.order));
    const newP = buildFormParticipant(form, `p${Date.now()}`, nextColor, maxOrder + 1);
    setParticipants((prev) => [...prev, newP]);
    setVisibility((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((docId) => { next[docId] = [...next[docId], newP.id]; });
      return next;
    });
    setForm(INITIAL_FORM);
    setShowAddForm(false);
    toast.success(`Added ${newP.name}`);
  };

  const startEditing = (p: Participant) => {
    setEditingId(p.id);
    setEditForm(participantToForm(p));
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const existing = participants.find((p) => p.id === editingId);
    if (!existing) return;
    const updated = buildFormParticipant(editForm, editingId, existing.color, existing.order);
    // Preserve order if role didn't change to non-signer
    if (updated.role === "signer") updated.order = existing.order;
    setParticipants((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
    setEditingId(null);
    toast.success("Participant updated");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDuplicate = (p: Participant) => {
    setForm({
      ...participantToForm(p),
      name: "",
      email: "",
      phoneNumber: "",
    });
    setShowAddForm(true);
    setEditingId(null);
  };

  const handleQuickRoleChange = (id: string, newRole: ParticipantRole) => {
    const p = participants.find((pp) => pp.id === id);
    if (!p) return;
    const maxOrder = Math.max(0, ...participants.filter(pp => pp.role === "signer").map(pp => pp.order));
    updateParticipant(id, {
      role: newRole,
      order: newRole === "signer" ? (p.role === "signer" ? p.order : maxOrder + 1) : 0,
    });
    toast.success(`Role updated to ${ROLE_STYLES[newRole].label}`);
  };

  const handleQuickSendingChange = (id: string, newMethod: SendingMethod) => {
    const p = participants.find((pp) => pp.id === id);
    if (!p) return;
    if ((newMethod === "sms" || newMethod === "whatsapp") && !p.sendingPhone) {
      startEditing({ ...p, sendingMethod: newMethod });
      return;
    }
    updateParticipant(id, { sendingMethod: newMethod });
  };

  const updateFormField = (updates: Partial<AddFormState>) => setForm((prev) => ({ ...prev, ...updates }));
  const updateEditFormField = (updates: Partial<AddFormState>) => setEditForm((prev) => ({ ...prev, ...updates }));

  const buildSteps = () => {
    const allSignable = participants.filter((p) => p.role === "signer" || p.role === "approver");
    const stepMap = new Map<number, Participant[]>();
    allSignable.forEach((p) => {
      const order = p.role === "approver" ? 0 : p.order;
      if (!stepMap.has(order)) stepMap.set(order, []);
      stepMap.get(order)!.push(p);
    });
    return Array.from(stepMap.entries()).sort(([a], [b]) => a - b);
  };

  const getSendingIcon = (method: SendingMethod) => {
    if (method === "sms") return <Phone size={10} className="flex-shrink-0" />;
    if (method === "whatsapp") return <MessageSquare size={10} className="flex-shrink-0" />;
    return <Mail size={10} className="flex-shrink-0" />;
  };

  const getVerificationSummary = (p: Participant) => {
    if (!p.needsVerification || !p.verificationMethod) return null;
    const method = VERIFICATION_METHOD_LABELS[p.verificationMethod];
    if (hasSpecs(p.verificationMethod) && p.verificationSpecs) {
      return `Verify: ${method} · ${VERIFICATION_SPECS_LABELS[p.verificationSpecs].label}`;
    }
    return `Verify: ${method}`;
  };

  /* ── Render a participant card (shared between flat and grouped views) ── */
  const renderCard = (p: Participant) => {
    const roleStyle = ROLE_STYLES[p.role];
    const verifySummary = getVerificationSummary(p);
    const isSigner = p.role === "signer";
    const isApprover = p.role === "approver";

    if (editingId === p.id) {
      return (
        <ParticipantFormCard
          key={p.id}
          form={editForm}
          updateForm={updateEditFormField}
          onSubmit={saveEdit}
          onCancel={cancelEdit}
          submitLabel="Save"
          isDisabled={!editForm.name.trim()}
        />
      );
    }

    if (confirmRemoveId === p.id) {
      return (
        <div key={p.id} className="border border-destructive/50 rounded-lg p-3 space-y-2 animate-in fade-in duration-150">
          <p className="text-sm">Remove <span className="font-medium">{p.name}</span>?</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => removeParticipant(p.id)}>
              Remove
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmRemoveId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={p.id} className="border rounded-lg p-2.5 space-y-1 group/card hover:bg-muted/30 transition-colors">
        {/* Row 1: drag + order + name + sending icon + role badge (right) */}
        <div className="flex items-center gap-2">
          {sequential && isSigner && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <GripVertical size={14} className="text-muted-foreground cursor-grab" />
              <input
                type="number"
                min={1}
                value={p.order}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1) handleOrderChange2(p.id, val);
                }}
                className="h-5 w-5 rounded-sm bg-muted text-[10px] font-bold text-muted-foreground text-center border-0 outline-none focus:ring-1 focus:ring-primary appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          )}
          {!sequential && (
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          )}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs font-medium truncate">{p.name}</span>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="h-4 w-4 rounded flex items-center justify-center text-muted-foreground flex-shrink-0">
                  {getSendingIcon(p.sendingMethod)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {p.sendingMethod === "email" ? "Email" : p.sendingMethod === "sms" ? "SMS" : "WhatsApp"}
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none ml-auto flex-shrink-0">
                  <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5 font-medium border cursor-pointer hover:opacity-80", roleStyle.className)}>
                    {roleStyle.label}
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[100px]">
                {(["signer", "approver", "viewer"] as ParticipantRole[]).map((r) => (
                  <DropdownMenuItem key={r} className="text-xs gap-2" onClick={() => handleQuickRoleChange(p.id, r)}>
                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-3.5 border", ROLE_STYLES[r].className)}>
                      {ROLE_STYLES[r].label}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2 text-xs" onClick={() => startEditing(p)}>
                <Pencil size={12} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs" onClick={() => handleDuplicate(p)}>
                <Copy size={12} />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => setConfirmRemoveId(p.id)}>
                <Trash2 size={12} />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: contact info */}
        <p className="text-[10px] text-muted-foreground truncate pl-0">
          {p.sendingMethod === "email" ? p.email : p.sendingPhone || ""}
        </p>
        {verifySummary && (
          <p className="text-[10px] text-muted-foreground truncate">
            {verifySummary}
          </p>
        )}
      </div>
    );
  };

  /* ── Build grouped participant list for sequential mode ── */
  const renderSequentialList = () => {
    const viewers = participants.filter((p) => p.role === "viewer" || p.role === "cc");
    const signersByOrder = new Map<number, Participant[]>();
    signers.forEach((s) => {
      if (!signersByOrder.has(s.order)) signersByOrder.set(s.order, []);
      signersByOrder.get(s.order)!.push(s);
    });
    const steps = Array.from(signersByOrder.entries()).sort(([a], [b]) => a - b);

    return (
      <div className="space-y-3">
        {/* Step 0 — Approvers */}
        {approvers.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Step 0 — Approval</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            {approvers.map((a) => renderCard(a))}
          </div>
        )}

        {/* Signer steps */}
        {steps.map(([stepNum, stepParticipants]) => (
          <div key={stepNum} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Step {stepNum}</p>
              {stepParticipants.length > 1 && (
                <span className="text-[10px] text-muted-foreground italic whitespace-nowrap">Signing in parallel</span>
              )}
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className={cn(
              "space-y-1.5",
              stepParticipants.length > 1 && "border-l-2 border-[hsl(var(--brand-indigo))]/20 pl-2"
            )}>
              {stepParticipants.map((s) => renderCard(s))}
            </div>
          </div>
        ))}

        {/* Viewers (no signing required) */}
        {viewers.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">No signing required</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            {viewers.map((v) => renderCard(v))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <p className="text-xs text-muted-foreground">
        Add people who need to sign, review, or receive this document
      </p>

      {/* ── Sequential signing toggle (above participant list) ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Sequential signing</p>
          <div className="flex items-center gap-2">
            {sequential && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-1.5">
                    Workflow settings
                    <ChevronDown size={10} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowSaveWorkflow(true)} className="gap-2 text-xs">
                    <Bookmark size={14} />
                    Save as workflow
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectWorkflowOpen(true)} className="gap-2 text-xs">
                    <MousePointer size={14} />
                    Load workflow
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewOrderOpen(true)} className="gap-2 text-xs">
                    <List size={14} />
                    View visual order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Switch checked={sequential} onCheckedChange={setSequential} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {sequential ? "Signers receive documents in order" : "All signers receive at the same time"}
        </p>

        {showSaveWorkflow && (
          <div className="flex items-center gap-2 pt-1 animate-in slide-in-from-top-1 duration-150">
            <Input
              placeholder="Workflow name"
              value={saveWorkflowName}
              onChange={(e) => setSaveWorkflowName(e.target.value)}
              className="h-7 text-xs flex-1"
              autoFocus
            />
            <Button size="sm" className="h-7 text-xs" onClick={() => {
              toast.success(`Workflow "${saveWorkflowName || "Untitled"}" saved`);
              setSaveWorkflowName("");
              setShowSaveWorkflow(false);
            }}>
              Save
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowSaveWorkflow(false)}>
              <X size={12} />
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* ── Participant list ── */}
      {participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Users size={48} className="text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-center">No participants added yet</p>
          <p className="text-xs text-muted-foreground text-center">Add signers, approvers, or viewers to this document</p>
        </div>
      ) : sequential ? (
        renderSequentialList()
      ) : (
        <div className="space-y-2">
          {participants.map((p) => renderCard(p))}
        </div>
      )}

      {/* ── Add participant button / form ── */}
      {!showAddForm ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 w-full"
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
        >
          <Plus size={14} />
          Add new participant
        </Button>
      ) : (
        <ParticipantFormCard
          form={form}
          updateForm={updateFormField}
          onSubmit={handleAddParticipant}
          onCancel={() => { setShowAddForm(false); setForm(INITIAL_FORM); }}
          submitLabel="Add participant"
          isDisabled={!form.name.trim()}
        />
      )}

      {/* Add me */}
      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 w-full text-muted-foreground hover:text-foreground" onClick={handleAddMe}>
        <User size={14} />
        Add me as a signer
      </Button>




      {/* ── Demo button ── */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1.5 w-full text-muted-foreground hover:text-foreground border border-dashed"
        onClick={() => {
          if (participants.length > 0) {
            setParticipants([]);
            setSequential(false);
            setEditingId(null);
            setConfirmRemoveId(null);
            setVisibility(() => {
              const v: DocumentVisibility = {};
              MOCK_DOCUMENTS.forEach((d) => { v[d.id] = []; });
              return v;
            });
            toast.success("Participants cleared");
          } else {
            setParticipants(DEMO_PARTICIPANTS);
            setSequential(true);
            setVisibility(() => {
              const v: DocumentVisibility = {};
              MOCK_DOCUMENTS.forEach((d) => { v[d.id] = DEMO_PARTICIPANTS.map((p) => p.id); });
              return v;
            });
            toast.success("Demo participants loaded");
          }
        }}
      >
        <Sparkles size={14} />
        {participants.length > 0 ? "Clear demo participants" : "Load demo participants"}
      </Button>

      {/* ── Load Workflow Dialog ── */}
      <Dialog open={selectWorkflowOpen} onOpenChange={setSelectWorkflowOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Load Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {MOCK_WORKFLOWS.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  toast.success("Workflow applied");
                  setSelectWorkflowOpen(false);
                }}
                className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors space-y-0.5"
              >
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Order Dialog ── */}
      <Dialog open={viewOrderOpen} onOpenChange={setViewOrderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Signing Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-0">
            {buildSteps().map(([stepNum, stepPs], idx, arr) => (
              <div key={stepNum}>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {stepNum}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {stepPs.map((p) => p.name).join(" + ")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {stepPs.map((p) => (
                        <Badge key={p.id} variant="outline" className={cn("text-[9px] px-1 py-0 h-3.5", ROLE_STYLES[p.role].className)}>
                          {ROLE_STYLES[p.role].label}
                        </Badge>
                      ))}
                      {stepPs.length > 1 && (
                        <span className="text-[9px] text-[hsl(var(--brand-indigo))]">Signing in parallel</span>
                      )}
                    </div>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="ml-3.5 h-4 w-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditorParticipantsPanel;
