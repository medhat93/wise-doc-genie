import { createContext, useContext, useState, type ReactNode } from "react";
import type { Participant } from "./EditorParticipantsPanel";
import type { PlacedField } from "./EditorFieldsPanel";

interface EditorContextType {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  placedFields: PlacedField[];
  setPlacedFields: React.Dispatch<React.SetStateAction<PlacedField[]>>;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  previousPanelId: string | null;
  setPreviousPanelId: (id: string | null) => void;
  isDraggingField: boolean;
  setIsDraggingField: (v: boolean) => void;
  isPlacementMode: boolean;
  setIsPlacementMode: (v: boolean) => void;
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

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>(MOCK_PLACED_FIELDS);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previousPanelId, setPreviousPanelId] = useState<string | null>(null);
  const [isDraggingField, setIsDraggingField] = useState(false);
  const [isPlacementMode, setIsPlacementMode] = useState(false);

  return (
    <EditorContext.Provider value={{
      participants,
      setParticipants,
      placedFields,
      setPlacedFields,
      selectedFieldId,
      setSelectedFieldId,
      previousPanelId,
      setPreviousPanelId,
      isDraggingField,
      setIsDraggingField,
      isPlacementMode,
      setIsPlacementMode,
    }}>
      {children}
    </EditorContext.Provider>
  );
};
