import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Check, AlertTriangle, ChevronUp, GripVertical, Send, FileText, Search, ShieldCheck, UserCheck, Sparkles, Plus, Lock, Mail as MailIcon } from "lucide-react";
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
import ReviewSendDialog from "./ReviewSendDialog";
import MissingFieldsWarningDialog, { type ParticipantIssue, type DocumentIssue } from "./MissingFieldsWarningDialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";

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

/* ── Sending method icons ── */
const SendMethodIcon = ({ method }: { method: string }) => {
  switch (method) {
    case "email": return <MailIcon size={12} className="text-muted-foreground" />;
    default: return <MailIcon size={12} className="text-muted-foreground" />;
  }
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

const MOCK_DOCS = [
  { id: "d1", name: "Master Services Agreement 2026.pdf", documentType: "primary" as const },
];

const EditorChecklistPanel = ({ onSwitchPanel }: EditorChecklistPanelProps) => {
  const navigate = useNavigate();
  const {
    participants, setParticipants,
    placedFields, setPlacedFields,
    usedVariables,
    variableValues, setVariableValues,
    checklistState, setChecklistState,
  } = useEditorContext();

  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [expandedCompletedSteps, setExpandedCompletedSteps] = useState<Set<string>>(new Set());
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
  const [showSendSection, setShowSendSection] = useState(false);

  // Snapshot tracking for re-edit detection
  const [stepSnapshots, setStepSnapshots] = useState<Record<string, string>>({});

  // Send dialog state
  const [sendOpen, setSendOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [participantIssues, setParticipantIssues] = useState<ParticipantIssue[]>([]);

  // Step 4 state
  const [documentType, setDocumentType] = useState("");
  const [propValues, setPropValues] = useState<Record<string, string>>({});
  const [editingPropKey, setEditingPropKey] = useState<string | null>(null);

  // Step 5 state
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("none");
  const [workflowAssignees, setWorkflowAssignees] = useState<Record<number, string>>({});

  // Mock flags
  const workflowEnforced = false;
  const hasRequiredProperties = true;

  // Refs for scrolling
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
  const allPropsComplete = !!documentType && requiredProps.every(f => propValues[f.key]?.trim());

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

  // Persist completions from context
  const isStepManuallyCompleted = useCallback((stepId: string) => {
    return checklistState.completedStepIds.includes(stepId) || checklistState.skippedStepIds.includes(stepId);
  }, [checklistState]);

  const markStepCompleted = useCallback((stepId: string) => {
    setChecklistState(prev => ({
      ...prev,
      completedStepIds: prev.completedStepIds.includes(stepId) ? prev.completedStepIds : [...prev.completedStepIds, stepId],
    }));
  }, [setChecklistState]);

  const markStepSkipped = useCallback((stepId: string) => {
    setChecklistState(prev => ({
      ...prev,
      skippedStepIds: prev.skippedStepIds.includes(stepId) ? prev.skippedStepIds : [...prev.skippedStepIds, stepId],
    }));
  }, [setChecklistState]);

  const unmarkStepCompleted = useCallback((stepId: string) => {
    setChecklistState(prev => ({
      ...prev,
      completedStepIds: prev.completedStepIds.filter(id => id !== stepId),
      skippedStepIds: prev.skippedStepIds.filter(id => id !== stepId),
    }));
  }, [setChecklistState]);

  // Get a snapshot fingerprint for a step's data
  const getStepFingerprint = useCallback((stepId: string): string => {
    switch (stepId) {
      case "participants": return JSON.stringify(participants.map(p => ({ id: p.id, name: p.name, role: p.role, order: p.order })));
      case "fields": return JSON.stringify(placedFields.map(f => ({ id: f.id, fieldTypeId: f.fieldTypeId, participantId: f.participantId })));
      case "placeholders": return JSON.stringify(variableValues);
      case "properties": return JSON.stringify({ documentType, propValues });
      case "workflow": return JSON.stringify({ selectedWorkflow, workflowAssignees });
      default: return "";
    }
  }, [participants, placedFields, variableValues, documentType, propValues, selectedWorkflow, workflowAssignees]);


  const steps: WizardStep[] = useMemo(() => {
    const s: WizardStep[] = [
      {
        id: "participants",
        title: "Add participants",
        description: "Add the people who need to sign, review, or receive this document",
        isVisible: true,
        isComplete: hasParticipants || isStepManuallyCompleted("participants"),
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
        isComplete: hasFields || isStepManuallyCompleted("fields"),
        completeSummary: hasFields
          ? `${placedFields.length} field${placedFields.length !== 1 ? "s" : ""} placed across ${new Set(placedFields.map(f => f.participantId)).size} participant${new Set(placedFields.map(f => f.participantId)).size !== 1 ? "s" : ""}`
          : (isStepManuallyCompleted("fields") ? "Skipped — signers place own fields" : ""),
        isOptional: true,
        skipLabel: "Skip — participants will place their own fields",
      },
      {
        id: "placeholders",
        title: "Fill in placeholders",
        description: "Fill in the dynamic placeholders used in your document",
        isVisible: hasVariables,
        isComplete: allVarsFilled || isStepManuallyCompleted("placeholders"),
        completeSummary: allVarsFilled ? `All ${usedTokens.size} placeholders filled` : (isStepManuallyCompleted("placeholders") ? "Skipped" : ""),
        isOptional: true,
        skipLabel: "Skip — fill placeholders later",
      },
      {
        id: "properties",
        title: "Fill required properties",
        description: "Complete the required document properties",
        isVisible: hasRequiredProperties,
        isComplete: allPropsComplete || isStepManuallyCompleted("properties"),
        completeSummary: allPropsComplete ? "All required properties filled" : "",
      },
      {
        id: "workflow",
        title: "Apply approval workflow",
        description: "Select and configure an approval workflow before sending",
        isVisible: workflowEnforced,
        isComplete: workflowComplete || isStepManuallyCompleted("workflow"),
        completeSummary: workflowComplete
          ? `${WORKFLOW_TEMPLATES[selectedWorkflow]?.label} applied`
          : "",
      },
    ];
    return s.filter(step => step.isVisible);
  }, [hasParticipants, participants, hasFields, placedFields, hasVariables, allVarsFilled, usedTokens.size, hasRequiredProperties, allPropsComplete, workflowEnforced, workflowComplete, selectedWorkflow, isStepManuallyCompleted]);

  // Detect changes in expanded completed steps and reactivate them
  useEffect(() => {
    for (const stepId of expandedCompletedSteps) {
      const snapshot = stepSnapshots[stepId];
      if (!snapshot) continue;
      const current = getStepFingerprint(stepId);
      if (current !== snapshot) {
        unmarkStepCompleted(stepId);
        setExpandedCompletedSteps(prev => {
          const next = new Set(prev);
          next.delete(stepId);
          return next;
        });
        const stepIndex = steps.findIndex(s => s.id === stepId);
        if (stepIndex >= 0) {
          setActiveStepIndex(stepIndex);
          setShowSendSection(false);
        }
        setStepSnapshots(prev => {
          const next = { ...prev };
          delete next[stepId];
          return next;
        });
        break;
      }
    }
  }, [expandedCompletedSteps, stepSnapshots, getStepFingerprint, unmarkStepCompleted, steps]);

  // Initialize active step
  useEffect(() => {
    if (activeStepIndex === null && steps.length > 0) {
      const firstIncomplete = steps.findIndex(s => !s.isComplete);
      setActiveStepIndex(firstIncomplete >= 0 ? firstIncomplete : null);
      if (firstIncomplete < 0) {
        setShowSendSection(true);
      }
    }
  }, [steps, activeStepIndex]);

  // Auto-select first participant for Step 2
  useEffect(() => {
    if (hasParticipants && !selectedParticipantId) {
      setSelectedParticipantId(participants[0].id);
    }
  }, [hasParticipants, participants, selectedParticipantId]);

  const allComplete = steps.every(s => s.isComplete);

  // Show send section when all complete
  useEffect(() => {
    if (allComplete && steps.length > 0) {
      setShowSendSection(true);
    }
  }, [allComplete, steps.length]);

  const getStepConditionMessage = (step: WizardStep): string | null => {
    switch (step.id) {
      case "participants": return hasParticipants ? null : "Add at least one participant";
      case "fields": return null; // optional
      case "placeholders": return null; // optional
      case "properties": return allPropsComplete ? null : "Fill all required properties";
      case "workflow": return workflowComplete ? null : "Assign all workflow steps";
      default: return null;
    }
  };

  const handleContinue = (index: number) => {
    const step = steps[index];
    const isLast = index === steps.length - 1;

    // Check condition
    if (!step.isOptional) {
      const msg = getStepConditionMessage(step);
      if (msg && !step.isComplete) {
        toast.error(msg);
        return;
      }
    }

    // Mark complete
    markStepCompleted(step.id);

    if (isLast) {
      setActiveStepIndex(null);
      setShowSendSection(true);
    } else {
      // Find next incomplete step
      const nextIncomplete = steps.findIndex((s, i) => i > index && !s.isComplete);
      if (nextIncomplete >= 0) {
        setActiveStepIndex(nextIncomplete);
        setTimeout(() => {
          stepRefs.current[nextIncomplete]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } else {
        setActiveStepIndex(null);
        setShowSendSection(true);
      }
    }
  };

  const handleSkip = (index: number) => {
    const step = steps[index];
    markStepSkipped(step.id);
    const isLast = index === steps.length - 1;
    if (isLast) {
      setActiveStepIndex(null);
      setShowSendSection(true);
    } else {
      const nextIncomplete = steps.findIndex((s, i) => i > index && !s.isComplete);
      if (nextIncomplete >= 0) {
        setActiveStepIndex(nextIncomplete);
      } else {
        setActiveStepIndex(null);
        setShowSendSection(true);
      }
    }
  };

  const handleStepClick = (index: number) => {
    const step = steps[index];
    const isCompleted = step.isComplete && index !== activeStepIndex;
    const isLocked = activeStepIndex !== null && index > activeStepIndex && !step.isComplete;

    if (isLocked) return;

    if (isCompleted) {
      setExpandedCompletedSteps(prev => {
        const next = new Set(prev);
        if (next.has(step.id)) {
          next.delete(step.id);
          // Remove snapshot on collapse
          setStepSnapshots(p => { const n = { ...p }; delete n[step.id]; return n; });
        } else {
          next.add(step.id);
          // Capture snapshot on expand
          setStepSnapshots(p => ({ ...p, [step.id]: getStepFingerprint(step.id) }));
        }
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
    markStepCompleted("participants");
    setTimeout(() => {
      if (activeStepIndex === 0) {
        const nextIncomplete = steps.findIndex((s, i) => i > 0 && !s.isComplete);
        setActiveStepIndex(nextIncomplete >= 0 ? nextIncomplete : null);
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

  // Send flow (same as TopBar)
  const handleSendClick = () => {
    const signers = participants.filter((p) => p.role === "signer");
    const issues: ParticipantIssue[] = [];
    for (const signer of signers) {
      const signerIssues: DocumentIssue[] = [];
      const signerFields = placedFields.filter((f) => f.participantId === signer.id);
      const primaryDocs = MOCK_DOCS.filter((d) => d.documentType === "primary");
      for (const doc of primaryDocs) {
        if (signerFields.length === 0) {
          signerIssues.push({ documentId: doc.id, documentName: doc.name, documentType: doc.documentType, issueType: "no_fields_primary" });
        }
      }
      if (signerIssues.length > 0) {
        issues.push({ participant: signer, issues: signerIssues });
      }
    }
    if (issues.length > 0) {
      setParticipantIssues(issues);
      setWarningOpen(true);
    } else {
      setSendOpen(true);
    }
  };

  const progressPercent = steps.length > 0 ? (steps.filter(s => s.isComplete).length / steps.length) * 100 : 0;
  const currentStepNum = activeStepIndex !== null ? activeStepIndex + 1 : steps.length;

  /* ── Render participants list for Step 1 ── */
  const renderParticipantsList = () => {
    if (!hasParticipants) return null;

    // For now, show flat list (sequential signing can be enhanced later)
    return (
      <div className="space-y-1.5">
        {participants.map(p => (
          <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-xs font-medium truncate flex-1">{p.name}</span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{p.role}</Badge>
            <SendMethodIcon method={p.sendingMethod} />
          </div>
        ))}
        <button
          onClick={() => setParticipantsOpen(true)}
          className="text-xs text-primary hover:underline mt-1"
        >
          Manage participants
        </button>
      </div>
    );
  };

  /* ── Render step content ── */
  const renderStepContent = (step: WizardStep, _index: number, isCompletedExpanded: boolean) => {
    switch (step.id) {
      case "participants":
        return (
          <div className="space-y-3">
            {/* Show participant list if any */}
            {renderParticipantsList()}

            {/* Main buttons */}
            <div className="space-y-0">
              <Button className="w-full h-10 gap-2" onClick={() => setParticipantsOpen(true)}>
                <HugeiconsIcon icon={UserAdd01Icon} size={16} />
                {hasParticipants ? "Manage participants" : "Add participants"}
              </Button>

              {!hasParticipants && !isCompletedExpanded && (
                <button
                  onClick={handleQuickAddSelf}
                  className="w-full text-center text-xs text-primary hover:underline mt-2"
                >
                  I am the only signer
                </button>
              )}
            </div>
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
              </div>
            )}
          </div>
        );

      case "placeholders":
        return (
          <div className="space-y-3">
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
            {wfSteps.length > 0 && (
              <div className="relative">
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
          const isActive = index === activeStepIndex;
          const isLocked = activeStepIndex !== null && index > activeStepIndex && !step.isComplete;
          const isCompleted = step.isComplete && !isActive;
          const isCompletedExpanded = isCompleted && expandedCompletedSteps.has(step.id);
          const isLastStep = index === steps.length - 1;

          // COMPLETED STATE (collapsed or expanded)
          if (isCompleted) {
            return (
              <div
                key={step.id}
                ref={(el) => { stepRefs.current[index] = el; }}
              >
                <div
                  className={cn(
                    "rounded-lg border cursor-pointer transition-colors",
                    isCompletedExpanded
                      ? "border-emerald-500/30 bg-emerald-500/5 p-3"
                      : "border-emerald-500/20 bg-emerald-500/5 p-3 hover:bg-emerald-500/10"
                  )}
                  onClick={() => handleStepClick(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground">{step.title}</span>
                      {!isCompletedExpanded && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{step.completeSummary}</p>
                      )}
                    </div>
                    {isCompletedExpanded ? (
                      <ChevronUp size={14} className="text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground hover:text-primary">Edit →</span>
                    )}
                  </div>
                </div>

                {/* Expanded completed content */}
                <AnimatePresence>
                  {isCompletedExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 px-1">
                        {renderStepContent(step, index, true)}
                        <div className="mt-3 text-center">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                            <Check size={12} /> Done ✓
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // LOCKED STATE
          if (isLocked) {
            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <div
                    ref={(el) => { stepRefs.current[index] = el; }}
                    className="rounded-lg border p-3 bg-muted/30 opacity-50 cursor-not-allowed"
                  >
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

          // ACTIVE STATE
          if (isActive) {
            const canContinue = step.isComplete || step.isOptional;
            return (
              <div
                key={step.id}
                ref={(el) => { stepRefs.current[index] = el; }}
                className="rounded-xl border-2 border-primary p-4 bg-card shadow-sm"
              >
                {/* Step header */}
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                  </div>
                  <span className="text-sm font-semibold">{step.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 ml-[34px]">{step.description}</p>

                {/* Step body */}
                <div className="mb-3">
                  {renderStepContent(step, index, false)}
                </div>

                {/* Separator + Continue / Skip */}
                <Separator className="my-3" />

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs"
                    disabled={!canContinue}
                    onClick={() => handleContinue(index)}
                  >
                    {isLastStep ? "Complete ✓" : "Continue →"}
                  </Button>
                  {step.isOptional && !step.isComplete && (
                    <Button variant="ghost" size="sm" className="w-full h-9 text-xs text-muted-foreground" onClick={() => handleSkip(index)}>
                      {step.skipLabel || "Skip"}
                    </Button>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Send section */}
      {showSendSection && allComplete && (
        <div className="space-y-3 pt-2">
          <Separator />
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
          <Button
            className="w-full h-11 text-base font-semibold shadow-md gap-2 rounded-lg"
            onClick={handleSendClick}
          >
            <HugeiconsIcon icon={SentIcon} size={16} />
            Send for signature
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            or <button className="text-muted-foreground hover:text-foreground underline" onClick={() => { toast("Saved as draft"); }}>Save as draft</button>
          </p>
        </div>
      )}

      <ParticipantsDialog open={participantsOpen} onOpenChange={setParticipantsOpen} fromEditor />

      {/* Send dialogs */}
      <MissingFieldsWarningDialog
        open={warningOpen}
        onOpenChange={setWarningOpen}
        participantIssues={participantIssues}
        onGoBack={() => setWarningOpen(false)}
        onContinue={() => { setWarningOpen(false); setSendOpen(true); }}
      />
      <ReviewSendDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
      />
    </div>
  );
};

export default EditorChecklistPanel;
