import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Participant } from "./EditorParticipantsPanel";
import type { PlacedField } from "./EditorFieldsPanel";

/* ── Comment types ── */
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
  status: "open" | "resolved";
  replies: CommentReply[];
  type: "inline" | "general";
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "We need to revise the scope to include the additional deliverables discussed in yesterday's call",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), sectionRef: "Section 2: Scope of Services",
    status: "open", type: "inline",
    replies: [{
      id: "r1", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626",
      text: "Agreed. I'll update the deliverables list.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    }],
  },
  {
    id: "c2", author: "Mohammed Al-Faisal", authorInitials: "MA", authorColor: "#059669",
    text: "Payment terms should be NET-30, not NET-60",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), sectionRef: "Section 3: Payment Terms",
    status: "resolved", type: "inline", replies: [],
  },
  {
    id: "c3", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "Legal team to review this clause",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), sectionRef: "Section 5: Termination",
    status: "open", type: "inline", replies: [],
  },
  {
    id: "g1", author: "Ahmed Al-Rashid", authorInitials: "AA", authorColor: "#4F46E5",
    text: "Let's finalize this before EOD Thursday",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), sectionRef: "",
    status: "open", type: "general", replies: [],
  },
  {
    id: "g2", author: "Sarah Johnson", authorInitials: "SJ", authorColor: "#DC2626",
    text: "On it! Just waiting for legal's feedback on Section 5",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), sectionRef: "",
    status: "open", type: "general", replies: [],
  },
];

/* ── Section-to-highlight mapping ── */
export const COMMENT_SECTIONS: Record<string, { docIndex: number; selector: string }> = {
  "Section 2: Scope of Services": { docIndex: 0, selector: "2. Scope of Services" },
  "Section 3: Payment Terms": { docIndex: 0, selector: "3. Payment Terms" },
  "Section 5: Termination": { docIndex: 0, selector: "5. Term and Termination" },
};

export type AcknowledgmentLevel = 'none' | 'must_view' | 'must_view_accept';

interface EditorContextType {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
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

const USED_VARIABLES = ["Client.Name", "Sender.Company", "Document.Value", "Effective.Date", "Signer.Name", "Signer.Title", "Signer.Company"];

const INITIAL_VARIABLE_VALUES: Record<string, string> = {
  "Client.Name": "Acme Corporation",
  "Sender.Company": "",
  "Document.Value": "150,000 SAR",
  "Effective.Date": "May 1, 2026",
  "Signer.Name": "",
  "Signer.Title": "",
  "Signer.Company": "",
};

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previousPanelId, setPreviousPanelId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [pendingCommentRef, setPendingCommentRef] = useState<string | null>(null);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(INITIAL_VARIABLE_VALUES);
  const [documentAcknowledgments, setDocumentAcknowledgments] = useState<Record<string, Record<string, AcknowledgmentLevel>>>({});
  const [pendingAiQuestion, setPendingAiQuestion] = useState<{ question: string; selectedText: string } | null>(null);

  return (
    <EditorContext.Provider value={{
      participants, setParticipants,
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
    }}>
      {children}
    </EditorContext.Provider>
  );
};
