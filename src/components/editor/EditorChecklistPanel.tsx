import { useState, useMemo, useEffect } from "react";
import { Check, AlertTriangle, ChevronDown, GripVertical, Send, FileText, Search, ShieldCheck, UserCheck, Sparkles, Plus } from "lucide-react";
import { PenTool, Type, Calendar, TextCursorInput, CheckSquare, Stamp, Radio, Mail, Building, User, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";
import type { PanelId } from "./EditorPanelToolbar";
import ParticipantsDialog from "@/components/ParticipantsDialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

/* ── Field types for Step 2 ── */
interface SidebarFieldType {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
}

const FIELD_CATEGORIES: { label: string; fields: SidebarFieldType[] }[] = [
  {
    label: "Signature",
    fields: [
      { id: "signature", label: "Signature", icon: PenTool, category: "signature", defaultWidth: 200, defaultHeight: 50 },
      { id: "initials", label: "Initials", icon: Type, category: "signature", defaultWidth: 100, defaultHeight: 40 },
      { id: "stamp", label: "Stamp", icon: Stamp, category: "signature", defaultWidth: 120, defaultHeight: 50 },
      { id: "signature_date", label: "Signature date", icon: Calendar, category: "signature", defaultWidth: 120, defaultHeight: 36 },
    ],
  },
  {
    label: "Info",
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
    label: "Other",
    fields: [
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, category: "other", defaultWidth: 30, defaultHeight: 30 },
      { id: "radio", label: "Radio", icon: Radio, category: "other", defaultWidth: 140, defaultHeight: 36 },
      { id: "attachment", label: "File attachment", icon: Paperclip, category: "other", defaultWidth: 140, defaultHeight: 40 },
    ],
  },
];

/* ── Document types for Step 4 ── */
const DOCUMENT_TYPES = [
  "Service Agreement", "NDA", "Employment Contract", "Consulting Agreement",
  "Procurement Contract", "Lease Agreement", "Partnership Agreement", "Other",
];

const REQUIRED_PROPS: Record<string, { key: string; label: string; type: "text" | "number" | "date" | "dropdown"; options?: string[] }[]> = {
  "Service Agreement": [
    { key: "counterparty", label: "Counterparty", type: "text" },
    { key: "contractValue", label: "Contract value", type: "number" },
    { key: "effectiveDate", label: "Effective date", type: "date" },
    { key: "department", label: "Department", type: "dropdown", options: ["Legal", "Finance", "HR", "Engineering", "Sales"] },
  ],
  "NDA": [
    { key: "counterparty", label: "Counterparty", type: "text" },
    { key: "confidentialityPeriod", label: "Confidentiality period", type: "dropdown", options: ["1 year", "2 years", "3 years", "5 years", "Indefinite"] },
  ],
};

const DEFAULT_REQUIRED_PROPS = [
  { key: "counterparty", label: "Counterparty", type: "text" as const },
  { key: "effectiveDate", label: "Effective date", type: "date" as const },
];

/* ── Workflow templates for Step 5 ── */
const WORKFLOW_TEMPLATES: Record<string, { label: string; steps: { name: string; icon: React.ElementType }[] }> = {
  standard: {
    label: "Standard Approval — 2 Steps",
    steps: [
      { name: "Legal Review", icon: Search },
      { name: "Manager Approval", icon: UserCheck },
    ],
  },
  legal: {
    label: "Legal Review — 3 Steps",
    steps: [
      { name: "Paralegal Review", icon: Search },
      { name: "Senior Legal Review", icon: ShieldCheck },
      { name: "Legal Director Approval", icon: UserCheck },
    ],
  },
  executive: {
    label: "Executive Approval — 4 Steps",
    steps: [
      { name: "Department Review", icon: Search },
      { name: "VP Approval", icon: UserCheck },
      { name: "Legal Review", icon: ShieldCheck },
      { name: "Executive Sign-off", icon: UserCheck },
    ],
  },
};

/* ── Step definition ── */
interface WizardStep {
  id: string;
  title: string;
  description: string;
  isVisible: boolean;
  isComplete: boolean;
  completeSummary: string;
  isOptional?: boolean;
  skipLabel?: string;
}

interface EditorChecklistPanelProps {
  onSwitchPanel: (id: PanelId) => void;
}

const EditorChecklistPanel = ({ onSwitchPanel }: EditorChecklistPanelProps) => {
  const {
    participants, setParticipants,
    placedFields, setPlacedFields,
    usedVariables,
    variableValues, setVariableValues,
  } = useEditorContext();

  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
  const [showSendCelebration, setShowSendCelebration] = useState(false);
  const [manuallyCompletedSteps, setManuallyCompletedSteps] = useState<Set<string>>(new Set());

  // Step 4 state
  const [documentType, setDocumentType] = useState("");
  const [propValues, setPropValues] = useState<Record<string, string>>({});
  const [editingPropKey, setEditingPropKey] = useState<string | null>(null);

  // Step 5 state
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("none");
  const [workflowAssignees, setWorkflowAssignees] = useState<Record<number, string>>({});

  // Mock flags
  const workflowEnforced = false;
  const hasRequiredProperties = true; // show step 4 for demo

  // Compute statuses
  const hasParticipants = participants.length > 0;
  const hasFields = placedFields.length > 0;
  const usedTokens = new Set(usedVariables);
  const hasVariables = usedTokens.size > 0;
  const filledVarCount = Array.from(usedTokens).filter(t => variableValues[t]?.trim()).length;
  const allVarsFilled = hasVariables && filledVarCount === usedTokens.size;

  const activeParticipant = participants.find(p => p.id === selectedParticipantId) || participants[0];

  // Step 4 completion
  const requiredProps = documentType ? (REQUIRED_PROPS[documentType] || DEFAULT_REQUIRED_PROPS) : [];
  const allPropsComplete = (!!documentType && requiredProps.every(f => propValues[f.key]?.trim())) || manuallyCompletedSteps.has("properties");

  // Step 5 completion
  const wfSteps = selectedWorkflow !== "none" ? (WORKFLOW_TEMPLATES[selectedWorkflow]?.steps || []) : [];
  const allAssigned = wfSteps.length > 0 && wfSteps.every((_, i) => workflowAssignees[i + 1]?.trim());
  const workflowComplete = selectedWorkflow !== "none" && allAssigned;

  // Fields per participant
  const fieldsByParticipant = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach(p => map.set(p.id, 0));
    placedFields.forEach(f => {
      const current = map.get(f.participantId) || 0;
      map.set(f.participantId, current + 1);
    });
    return map;
  }, [participants, placedFields]);

  // Build steps array
  const steps: WizardStep[] = useMemo(() => {
    const s: WizardStep[] = [
      {
        id: "participants",
        title: "Add participants",
        description: "Add the people who need to sign, review, or receive this document",
        isVisible: true,
        isComplete: hasParticipants,
        completeSummary: hasParticipants
          ? (participants.length === 1 && participants[0].email === "ahmed@signit.sa"
            ? "1 signer (you)"
            : `${participants.length} participant${participants.length !== 1 ? "s" : ""} added`)
          : "",
      },
      {
        id: "fields",
        title: "Place annotation fields",
        description: "Drag signature fields onto the document for each participant",
        isVisible: true,
        isComplete: hasFields,
        completeSummary: hasFields
          ? `${placedFields.length} field${placedFields.length !== 1 ? "s" : ""} placed across ${new Set(placedFields.map(f => f.participantId)).size} participant${new Set(placedFields.map(f => f.participantId)).size !== 1 ? "s" : ""}`
          : "",
        isOptional: true,
        skipLabel: "Skip — participants will place their own fields",
      },
      {
        id: "placeholders",
        title: "Fill in placeholders",
        description: "Fill in the dynamic placeholders used in your document",
        isVisible: hasVariables,
        isComplete: allVarsFilled,
        completeSummary: allVarsFilled ? `All ${usedTokens.size} placeholders filled` : "",
        isOptional: true,
        skipLabel: "Skip — fill placeholders later",
      },
      {
        id: "properties",
        title: "Fill required properties",
        description: "Complete the required document properties",
        isVisible: hasRequiredProperties,
        isComplete: allPropsComplete,
        completeSummary: allPropsComplete ? "All required properties filled" : "",
      },
      {
        id: "workflow",
        title: "Apply approval workflow",
        description: "Select and configure an approval workflow before sending",
        isVisible: workflowEnforced,
        isComplete: workflowComplete,
        completeSummary: workflowComplete
          ? `${WORKFLOW_TEMPLATES[selectedWorkflow]?.label} applied`
          : "",
      },
    ];
    return s.filter(step => step.isVisible);
  }, [hasParticipants, participants, hasFields, placedFields, hasVariables, allVarsFilled, usedTokens.size, hasRequiredProperties, allPropsComplete, workflowEnforced, workflowComplete, selectedWorkflow]);

  // Initialize active step and open steps
  useEffect(() => {
    if (activeStepIndex === null && steps.length > 0) {
      const firstIncomplete = steps.findIndex(s => !s.isComplete);
      const idx = firstIncomplete >= 0 ? firstIncomplete : steps.length - 1;
      setActiveStepIndex(idx);
      setOpenSteps(new Set([idx]));
    }
  }, [steps, activeStepIndex]);

  // Auto-select first participant for Step 2
  useEffect(() => {
    if (hasParticipants && !selectedParticipantId) {
      setSelectedParticipantId(participants[0].id);
    }
  }, [hasParticipants, participants, selectedParticipantId]);

  const allComplete = steps.every(s => s.isComplete);

  // Celebration effect
  useEffect(() => {
    if (allComplete && steps.length > 0) {
      setShowSendCelebration(true);
    }
  }, [allComplete, steps.length]);

  const handleContinue = () => {
    if (activeStepIndex !== null) {
      // Mark current step as manually completed if it's properties
      const currentStep = steps[activeStepIndex];
      if (currentStep?.id === "properties") {
        setManuallyCompletedSteps(prev => new Set(prev).add("properties"));
      }

      if (activeStepIndex < steps.length - 1) {
        const nextIndex = activeStepIndex + 1;
        setActiveStepIndex(nextIndex);
        setOpenSteps(prev => {
          const next = new Set(prev);
          next.add(nextIndex);
          return next;
        });
      } else {
        // Last step — just close it
        setActiveStepIndex(null);
      }
    }
  };

  const handleSkip = () => {
    handleContinue();
  };

  const handleStepClick = (index: number) => {
    // Toggle open/close for completed steps without affecting the active editing step
    if (steps[index].isComplete) {
      setOpenSteps(prev => {
        const next = new Set(prev);
        if (next.has(index) && index !== activeStepIndex) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
      // If clicking a completed step, also set it as active for editing
      if (!openSteps.has(index)) {
        setActiveStepIndex(index);
      }
    } else if (index === activeStepIndex) {
      // Toggle current active step
      setOpenSteps(prev => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    }
  };

  const handleQuickAddSelf = () => {
    if (participants.some(p => p.email === "ahmed@signit.sa")) {
      toast.error("You are already added as a participant");
      return;
    }
    const COLORS = ["#4F46E5", "#DC2626", "#059669", "#D97706", "#7C3AED", "#0891B2", "#BE185D", "#65A30D"];
    const maxOrder = Math.max(0, ...participants.filter(p => p.role === "signer").map(p => p.order));
    setParticipants(prev => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name: "Ahmad Medhat",
        email: "ahmed@signit.sa",
        role: "signer" as const,
        color: COLORS[participants.length % COLORS.length],
        order: maxOrder + 1,
        language: "en" as const,
        sendingMethod: "email" as const,
        needsVerification: false,
      },
    ]);
    toast.success("Added as sole signer");
    // Auto advance
    setTimeout(() => {
      if (activeStepIndex === 0) {
        setActiveStepIndex(1);
      }
    }, 300);
  };

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

  const handleSaveProp = (key: string, value: string) => {
    setPropValues(prev => ({ ...prev, [key]: value }));
    setEditingPropKey(null);
  };

  const progressPercent = steps.length > 0 ? (steps.filter(s => s.isComplete).length / steps.length) * 100 : 0;
  const currentStepNum = activeStepIndex !== null ? activeStepIndex + 1 : steps.length;

  /* ── Render step content ── */
  const renderStepContent = (step: WizardStep, index: number) => {
    switch (step.id) {
      case "participants":
        return (
          <div className="space-y-3">
            {/* Existing participants list */}
            {participants.length > 0 && (
              <div className="space-y-1.5">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm truncate flex-1">{p.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{p.role}</Badge>
                  </div>
                ))}
              </div>
            )}

            <Button className="w-full h-9 gap-1.5" onClick={() => setParticipantsOpen(true)}>
              <User size={14} />
              Add participants
            </Button>

            {!hasParticipants && (
              <button
                onClick={handleQuickAddSelf}
                className="w-full text-xs text-primary hover:underline text-center"
              >
                I am the only signer
              </button>
            )}
          </div>
        );

      case "fields":
        return (
          <div className="space-y-3">
            {/* Participant selector */}
            {hasParticipants && (
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
                  {participants.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Field grid (2 columns) */}
            {FIELD_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{cat.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {cat.fields.map(field => {
                    const Icon = field.icon;
                    const disabled = !hasParticipants;
                    return (
                      <div
                        key={field.id}
                        draggable={!disabled}
                        onDragStart={(e) => handleDragStart(e, field)}
                        className={cn(
                          "flex items-center gap-1.5 border rounded-md p-2 transition-colors",
                          disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-grab active:cursor-grabbing hover:bg-muted/50"
                        )}
                        style={{
                          borderLeftWidth: 3,
                          borderLeftColor: activeParticipant?.color || "hsl(var(--border))",
                        }}
                      >
                        <Icon size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-xs truncate">{field.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Placed fields summary */}
            {hasParticipants && (
              <div className="space-y-1 pt-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Placed fields</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {participants.map(p => {
                    const count = fieldsByParticipant.get(p.id) || 0;
                    return (
                      <span key={p.id} className="flex items-center gap-1 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.name.split(" ")[0]}:</span>
                        <span className={cn("font-medium", count === 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                          {count} field{count !== 1 ? "s" : ""}
                        </span>
                      </span>
                    );
                  })}
                </div>
                {participants.some(p => (fieldsByParticipant.get(p.id) || 0) === 0) && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {participants.filter(p => (fieldsByParticipant.get(p.id) || 0) === 0).map(p => p.name.split(" ")[0]).join(", ")} ha{participants.filter(p => (fieldsByParticipant.get(p.id) || 0) === 0).length > 1 ? "ve" : "s"} no fields — they'll place their own
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case "placeholders":
        return (
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 text-xs">
              {allVarsFilled ? (
                <>
                  <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">All placeholders filled</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-400">{filledVarCount} of {usedTokens.size} filled</span>
                </>
              )}
            </div>

            {/* Placeholder rows */}
            <div className="space-y-2">
              {Array.from(usedTokens).map(token => (
                <div key={token} className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap">
                    [{token}]
                  </span>
                  <Input
                    placeholder="Enter value..."
                    value={variableValues[token] || ""}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [token]: e.target.value }))}
                    className="h-7 text-xs flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "properties":
        return (
          <div className="space-y-3">
            {/* Document type */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Document type</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Required properties */}
            {documentType && requiredProps.length > 0 && (
              <div className="space-y-1">
                {requiredProps.map(field => {
                  const isEditing = editingPropKey === field.key;
                  const val = propValues[field.key] || "";
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        "flex items-center min-h-[36px] rounded-md px-2 -mx-2 transition-colors",
                        !isEditing && "hover:bg-muted/50 cursor-pointer"
                      )}
                      onClick={() => !isEditing && setEditingPropKey(field.key)}
                    >
                      <span className="text-xs text-muted-foreground w-[120px] shrink-0">{field.label}</span>
                      <div className="flex-1">
                        {isEditing ? (
                          field.type === "dropdown" && field.options ? (
                            <Select value={val} onValueChange={(v) => handleSaveProp(field.key, v)}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map(o => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={field.type === "date" ? "date" : "text"}
                              value={val}
                              onChange={(e) => setPropValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                              onBlur={() => setEditingPropKey(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setEditingPropKey(null);
                                if (e.key === "Escape") setEditingPropKey(null);
                              }}
                              className="h-7 text-xs"
                              autoFocus
                            />
                          )
                        ) : (
                          <span className={cn("text-sm", val ? "text-foreground" : "text-muted-foreground/60 italic")}>
                            {val || "Click to set"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!documentType && (
              <p className="text-xs text-muted-foreground text-center py-4">Select a document type to see required properties</p>
            )}
          </div>
        );

      case "workflow":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Choose a workflow</label>
              <Select value={selectedWorkflow} onValueChange={(v) => { setSelectedWorkflow(v); setWorkflowAssignees({}); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No workflow</SelectItem>
                  {Object.entries(WORKFLOW_TEMPLATES).map(([key, wf]) => (
                    <SelectItem key={key} value={key}>{wf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Workflow steps */}
            {wfSteps.length > 0 && (
              <div className="relative">
                {/* Step 0: Drafting */}
                <div className="flex gap-3 relative">
                  <div className="absolute left-[15px] top-[32px] bottom-0 w-px border-l border-dashed border-border" />
                  <div className="h-[30px] w-[30px] rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-primary/15 text-primary">
                    <FileText size={14} />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="bg-muted/50 border rounded-lg p-2.5">
                      <span className="text-xs font-medium">Step 0: Drafting</span>
                      <p className="text-[10px] text-muted-foreground">You</p>
                    </div>
                  </div>
                </div>
                {wfSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isLast = i === wfSteps.length - 1;
                  return (
                    <div key={i} className="flex gap-3 relative">
                      {!isLast && (
                        <div className="absolute left-[15px] top-[32px] bottom-0 w-px border-l border-dashed border-border" />
                      )}
                      <div className="h-[30px] w-[30px] rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-muted text-muted-foreground">
                        <Icon size={14} />
                      </div>
                      <div className={cn("flex-1", !isLast && "pb-4")}>
                        <div className="bg-muted/50 border rounded-lg p-2.5 space-y-1.5">
                          <span className="text-xs font-medium">Step {i + 1}: {step.name}</span>
                          <Select
                            value={workflowAssignees[i + 1] || ""}
                            onValueChange={(v) => setWorkflowAssignees(prev => ({ ...prev, [i + 1]: v }))}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Select assignee..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ahmed">Ahmed Al-Rashid</SelectItem>
                              <SelectItem value="sarah">Sarah Johnson</SelectItem>
                              <SelectItem value="mohammed">Mohammed Al-Faisal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {wfSteps.length > 0 && !allAssigned && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={10} />
                All steps must have assignees
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Step {currentStepNum} of {steps.length}</span>
          <span className={cn("text-xs font-medium", allComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {allComplete ? "All complete ✓" : `${steps.filter(s => s.isComplete).length} of ${steps.length} complete`}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isOpen = openSteps.has(index);
          const isCurrentActive = index === activeStepIndex;
          const isLocked = activeStepIndex !== null && index > activeStepIndex && !step.isComplete;
          const isCompleted = step.isComplete;

          // LOCKED STATE
          if (isLocked) {
            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <div className="rounded-lg border p-3 bg-muted/30 opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{step.title}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Complete step {activeStepIndex !== null ? activeStepIndex + 1 : "?"} first</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          // COMPLETED but collapsed — show summary
          if (isCompleted && !isOpen) {
            return (
              <div
                key={step.id}
                className="rounded-lg border p-3 bg-emerald-500/5 border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                onClick={() => handleStepClick(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground">{step.title}</span>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{step.completeSummary}</p>
                  </div>
                  <span className="text-xs text-muted-foreground hover:text-primary">Edit →</span>
                </div>
              </div>
            );
          }

          // OPEN STATE (active or re-opened completed step)
          if (isOpen || isCurrentActive) {
            const canContinue = step.isComplete || step.id === "properties";
            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-xl border-2 p-4 bg-card shadow-sm",
                  isCompleted ? "border-emerald-500/40" : "border-primary"
                )}
              >
                {/* Step header */}
                <div className="flex items-center gap-2.5 mb-1">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0",
                    isCompleted ? "bg-emerald-500" : "bg-primary"
                  )}>
                    {isCompleted ? (
                      <Check size={12} className="text-white" />
                    ) : (
                      <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold flex-1">{step.title}</span>
                  {isCompleted && (
                    <button
                      onClick={() => {
                        setOpenSteps(prev => {
                          const next = new Set(prev);
                          next.delete(index);
                          return next;
                        });
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Collapse
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3 ml-[34px]">{step.description}</p>

                {/* Step body */}
                <div className="mb-3">
                  {renderStepContent(step, index)}
                </div>

                {/* Continue / Skip buttons — only for the current active step */}
                {isCurrentActive && !isCompleted && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="w-full h-9 text-xs"
                      disabled={!canContinue}
                      onClick={handleContinue}
                    >
                      Continue
                    </Button>
                    {step.isOptional && !step.isComplete && (
                      <Button variant="ghost" size="sm" className="w-full h-9 text-xs text-muted-foreground" onClick={handleSkip}>
                        {step.skipLabel || "Skip"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          }

          // Fallback (shouldn't happen)
          return null;
        })}
      </div>

      {/* Send section */}
      {allComplete && (
        <div className="space-y-3 pt-2">
          <Separator />
          <AnimatePresence>
            {showSendCelebration && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="flex flex-col items-center gap-2 py-2"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  >
                    <Check size={20} className="text-emerald-500" />
                  </motion.div>
                </div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-center">
                  All set! Your document is ready to send
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            className="w-full h-11 text-base font-semibold shadow-md gap-2"
            onClick={() => toast.success("Document sent for signature!")}
          >
            <Send size={16} />
            Send for signature
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            or <button className="text-muted-foreground hover:text-foreground underline">Save as draft</button>
          </p>
        </div>
      )}

      <ParticipantsDialog open={participantsOpen} onOpenChange={setParticipantsOpen} fromEditor />
    </div>
  );
};

export default EditorChecklistPanel;
