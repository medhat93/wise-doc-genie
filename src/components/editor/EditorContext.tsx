import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Participant } from "./EditorParticipantsPanel";
import type { PlacedField } from "./EditorFieldsPanel";
import type { EditorDocument } from "./EditorDocumentsPopover";

/* ── Comment types ── */
export type AnnotationType = "comment" | "suggestion" | "ai_suggestion";

export interface CommentReply {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timestamp: Date;
  sectionRef: string;
  docId: string;
  status: "open" | "resolved";
  replies: CommentReply[];
  type: "inline" | "general";
  annotationType: AnnotationType;
  suggestedText?: string;
}

/* ── AI Suggestion types ── */
export type AiSuggestionType = "addition" | "deletion" | "replacement";

export interface AiSuggestion {
  id: string;
  type: AiSuggestionType;
  sectionRef: string;
  oldText?: string;
  newText?: string;
  status: "pending" | "accepted" | "rejected";
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "We need to revise the scope to include the additional deliverables discussed in yesterday's call",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), sectionRef: "Section 2: Scope of Services", docId: "doc-1",
    status: "open", type: "inline", annotationType: "comment",
    replies: [{ id: "r1", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626", text: "Agreed. I'll update the deliverables list.", timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) }],
  },
  {
    id: "c2", author: "Mohammed Al-Faisal", authorInitials: "MA", authorColor: "#059669",
    text: "Payment terms should be NET-30, not NET-60",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), sectionRef: "Section 3: Payment Terms", docId: "doc-1",
    status: "open", type: "inline", annotationType: "comment", replies: [],
  },
  {
    id: "c3", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "Legal team to review this clause",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), sectionRef: "Section 5: Termination", docId: "doc-1",
    status: "open", type: "inline", annotationType: "comment", replies: [],
  },
  {
    id: "s1", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626",
    text: "Suggest changing 'thirty (30) days' to 'fifteen (15) days' for faster payment cycle",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), sectionRef: "Section 3: Payment Terms", docId: "doc-1",
    status: "open", type: "inline", annotationType: "suggestion",
    suggestedText: "Client shall pay within fifteen (15) days of the invoice date.", replies: [],
  },
  {
    id: "c4", author: "Layla Hassan", authorInitials: "LH", authorColor: "#7C3AED",
    text: "Definition of 'Deliverables' should include digital assets and source code",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), sectionRef: "Section 1: Definitions", docId: "doc-1",
    status: "open", type: "inline", annotationType: "comment", replies: [],
  },
  {
    id: "s2", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "Consider adding a mutual NDA clause reference here",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), sectionRef: "Section 4: Confidentiality", docId: "doc-1",
    status: "open", type: "inline", annotationType: "suggestion",
    suggestedText: "Each party agrees to hold in confidence all Confidential Information as further defined in the mutual NDA executed between the parties.",
    replies: [{ id: "r2", author: "Mohammed Al-Faisal", authorInitials: "MA", authorColor: "#059669", text: "Good idea — I'll cross-reference the existing NDA.", timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000) }],
  },
  {
    id: "c5", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626",
    text: "Cap liability at 2x the total contract value per industry standard",
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), sectionRef: "Section 6: Liability", docId: "doc-1",
    status: "open", type: "inline", annotationType: "comment",
    replies: [{ id: "r3", author: "Layla Hassan", authorInitials: "LH", authorColor: "#7C3AED", text: "Legal approved a 2x cap. Let's proceed.", timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000) }],
  },
  {
    id: "s3", author: "Mohammed Al-Faisal", authorInitials: "MA", authorColor: "#059669",
    text: "Reduce notice period from 30 to 15 days for termination for cause",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), sectionRef: "Section 5: Termination", docId: "doc-1",
    status: "open", type: "inline", annotationType: "suggestion",
    suggestedText: "Either party may terminate this Agreement with fifteen (15) days' prior written notice for cause.", replies: [],
  },
  // Doc 2 — Schedule A
  {
    id: "c6", author: "Mohammed Al-Faisal", authorInitials: "MA", authorColor: "#059669",
    text: "Technical Development rate seems high — can we negotiate to $165/hr?",
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000), sectionRef: "Schedule: Service Fees", docId: "doc-2",
    status: "open", type: "inline", annotationType: "comment",
    replies: [{ id: "r4", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5", text: "I'll check with the vendor. $175 might be the floor.", timestamp: new Date(Date.now() - 13 * 60 * 60 * 1000) }],
  },
  {
    id: "s4", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626",
    text: "Suggest changing payment split to 40/30/30 to reduce upfront risk",
    timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000), sectionRef: "Schedule: Payment Schedule", docId: "doc-2",
    status: "open", type: "inline", annotationType: "suggestion",
    suggestedText: "Payments shall be made: 40% upon execution, 30% at initial milestone, and 30% upon final delivery.", replies: [],
  },
  {
    id: "c7", author: "Layla Hassan", authorInitials: "LH", authorColor: "#7C3AED",
    text: "Expense threshold should be $1,000 not $500 — too many approvals needed",
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), sectionRef: "Schedule: Expense Policy", docId: "doc-2",
    status: "open", type: "inline", annotationType: "comment", replies: [],
  },
  // Doc 3 — Insurance
  {
    id: "c8", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "Coverage amount should be at least $5M per our internal policy requirements",
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), sectionRef: "Insurance: Coverage", docId: "doc-3",
    status: "open", type: "inline", annotationType: "comment", replies: [],
  },
  {
    id: "c9", author: "Mohammed Al-Faisal", authorInitials: "MA", authorColor: "#059669",
    text: "Certificate expires end of year — need renewal confirmation before signing",
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000), sectionRef: "Insurance: Validity", docId: "doc-3",
    status: "open", type: "inline", annotationType: "comment",
    replies: [{ id: "r5", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626", text: "Vendor confirmed auto-renewal. Will get written confirmation.", timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000) }],
  },
  // General
  {
    id: "g1", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "Let's finalize this before EOD Thursday",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), sectionRef: "", docId: "",
    status: "open", type: "general", annotationType: "comment", replies: [],
  },
  {
    id: "g2", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626",
    text: "On it! Just waiting for legal's feedback on Section 5",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), sectionRef: "", docId: "",
    status: "open", type: "general", annotationType: "comment", replies: [],
  },
];

/* ── Section-to-highlight mapping ── */
export const COMMENT_SECTIONS: Record<string, { docIndex: number; selector: string }> = {
  "Section 1: Definitions": { docIndex: 0, selector: "1. Definitions" },
  "Section 2: Scope of Services": { docIndex: 0, selector: "2. Scope of Services" },
  "Section 3: Payment Terms": { docIndex: 0, selector: "3. Payment Terms" },
  "Section 4: Confidentiality": { docIndex: 0, selector: "4. Confidentiality" },
  "Section 5: Termination": { docIndex: 0, selector: "5. Term and Termination" },
  "Section 6: Liability": { docIndex: 0, selector: "6. Limitation of Liability" },
  "Schedule: Service Fees": { docIndex: 1, selector: "1. Service Fees" },
  "Schedule: Payment Schedule": { docIndex: 1, selector: "2. Payment Schedule" },
  "Schedule: Expense Policy": { docIndex: 1, selector: "3. Expense Policy" },
  "Insurance: Coverage": { docIndex: 2, selector: "Coverage" },
  "Insurance: Validity": { docIndex: 2, selector: "Validity" },
};

export type AcknowledgmentLevel = 'none';

/* ── Checklist state ── */
export interface ChecklistState {
  completedStepIds: string[];
  skippedStepIds: string[];
}

/* ── Default seed documents (used when entering editor without explicit docs) ── */
export const DEFAULT_EDITOR_DOCUMENTS: EditorDocument[] = [
  { id: "doc-1", name: "Master Services Agreement", docType: "primary", fileType: "pdf" },
  { id: "doc-2", name: "Schedule A — Pricing", docType: "supplement", fileType: "docx" },
  { id: "doc-3", name: "Insurance Certificate", docType: "attachment", fileType: "pdf" },
];

interface EditorContextType {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  sequentialSigning: boolean;
  setSequentialSigning: React.Dispatch<React.SetStateAction<boolean>>;
  placedFields: PlacedField[];
  setPlacedFields: React.Dispatch<React.SetStateAction<PlacedField[]>>;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  previousPanelId: string | null;
  setPreviousPanelId: (id: string | null) => void;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  pendingCommentRef: string | null;
  setPendingCommentRef: (ref: string | null) => void;
  commentsPanelOpen: boolean;
  setCommentsPanelOpen: (open: boolean) => void;
  variableValues: Record<string, string>;
  setVariableValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  usedVariables: string[];
  documentAcknowledgments: Record<string, Record<string, AcknowledgmentLevel>>;
  setDocumentAcknowledgments: React.Dispatch<React.SetStateAction<Record<string, Record<string, AcknowledgmentLevel>>>>;
  pendingAiQuestion: { question: string; selectedText: string } | null;
  setPendingAiQuestion: (q: { question: string; selectedText: string } | null) => void;
  aiSuggestions: AiSuggestion[];
  setAiSuggestions: React.Dispatch<React.SetStateAction<AiSuggestion[]>>;
  checklistState: ChecklistState;
  setChecklistState: React.Dispatch<React.SetStateAction<ChecklistState>>;
  documentVisibility: Record<string, string[]>;
  setDocumentVisibility: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  requestOpenAiPanel: () => void;
  setRequestOpenAiPanel: (fn: () => void) => void;
  editorDocuments: EditorDocument[];
  setEditorDocuments: React.Dispatch<React.SetStateAction<EditorDocument[]>>;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditorContext = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditorContext must be used within EditorProvider");
  return ctx;
};

const MOCK_PLACED_FIELDS: PlacedField[] = [
  { id: "f1", fieldTypeId: "signature", participantId: "p1", participantName: "Ahmed Al-Rashid", participantColor: "#4F46E5", page: 1, x: 60, y: 680, width: 200, height: 50 },
  { id: "f2", fieldTypeId: "date", participantId: "p1", participantName: "Ahmed Al-Rashid", participantColor: "#4F46E5", page: 1, x: 300, y: 690, width: 120, height: 36 },
  { id: "f3", fieldTypeId: "signature", participantId: "p2", participantName: "Sarah Johnson", participantColor: "#DC2626", page: 1, x: 60, y: 760, width: 200, height: 50 },
];

const USED_VARIABLES: string[] = ["Client.Name", "Contract.Type"];

const INITIAL_VARIABLE_VALUES: Record<string, string> = {
  "Client.Name": "",
  "Contract.Type": "",
};

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sequentialSigning, setSequentialSigning] = useState(false);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previousPanelId, setPreviousPanelId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [pendingCommentRef, setPendingCommentRef] = useState<string | null>(null);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(INITIAL_VARIABLE_VALUES);
  const [documentAcknowledgments, setDocumentAcknowledgments] = useState<Record<string, Record<string, AcknowledgmentLevel>>>({});
  const [pendingAiQuestion, setPendingAiQuestion] = useState<{ question: string; selectedText: string } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [checklistState, setChecklistState] = useState<ChecklistState>({ completedStepIds: [], skippedStepIds: [] });
  const [documentVisibility, setDocumentVisibility] = useState<Record<string, string[]>>({});
  const openAiPanelRef = useState<{ fn: () => void }>({ fn: () => {} })[0];

  // Hydrate documents from sessionStorage (set by CreateDocument when navigating in)
  const [editorDocuments, setEditorDocuments] = useState<EditorDocument[]>(() => {
    if (typeof window === "undefined") return DEFAULT_EDITOR_DOCUMENTS;
    try {
      const raw = sessionStorage.getItem("editor:incomingDocs");
      if (raw) {
        sessionStorage.removeItem("editor:incomingDocs");
        const parsed = JSON.parse(raw) as EditorDocument[];
        return Array.isArray(parsed) ? parsed : DEFAULT_EDITOR_DOCUMENTS;
      }
    } catch {}
    return DEFAULT_EDITOR_DOCUMENTS;
  });

  const setRequestOpenAiPanel = useCallback((fn: () => void) => {
    openAiPanelRef.fn = fn;
  }, [openAiPanelRef]);
  const requestOpenAiPanel = useCallback(() => openAiPanelRef.fn(), [openAiPanelRef]);

  return (
    <EditorContext.Provider value={{
      participants, setParticipants,
      sequentialSigning, setSequentialSigning,
      placedFields, setPlacedFields,
      selectedFieldId, setSelectedFieldId,
      previousPanelId, setPreviousPanelId,
      comments, setComments,
      pendingCommentRef, setPendingCommentRef,
      commentsPanelOpen, setCommentsPanelOpen,
      variableValues, setVariableValues,
      usedVariables: USED_VARIABLES,
      documentAcknowledgments, setDocumentAcknowledgments,
      pendingAiQuestion, setPendingAiQuestion,
      aiSuggestions, setAiSuggestions,
      checklistState, setChecklistState,
      documentVisibility, setDocumentVisibility,
      requestOpenAiPanel, setRequestOpenAiPanel,
      editorDocuments, setEditorDocuments,
    }}>
      {children}
    </EditorContext.Provider>
  );
};
