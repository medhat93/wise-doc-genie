import { useState } from "react";
import { ChevronDown, ChevronUp, Check, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MOCK_DOCUMENTS } from "./EditorCanvas";

/* ── Document type options by docType ── */
const PRIMARY_TYPES = [
  "Service Agreement", "NDA", "Employment Contract", "Consulting Agreement",
  "Procurement Contract", "Lease Agreement", "Partnership Agreement", "Other",
];

const SUPPLEMENT_TYPES = [
  "Statement of Work", "Addendum", "Schedule", "Exhibit",
  "Amendment", "Side Letter", "Other",
];

const ATTACHMENT_TYPES = [
  "Insurance Certificate", "License", "ID Document", "Financial Statement",
  "Certificate of Incorporation", "Power of Attorney", "Other",
];

const TYPE_OPTIONS: Record<string, string[]> = {
  primary: PRIMARY_TYPES,
  supplement: SUPPLEMENT_TYPES,
  attachment: ATTACHMENT_TYPES,
  amendment: SUPPLEMENT_TYPES,
};

/* ── Property fields per document type ── */
interface PropertyField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "dropdown";
  options?: string[];
  currency?: string;
  important?: boolean;
}

const TYPE_PROPERTIES: Record<string, PropertyField[]> = {
  "Service Agreement": [
    { key: "counterparty", label: "Counterparty", type: "text", important: true },
    { key: "contractValue", label: "Contract value", type: "number", currency: "SAR", important: true },
    { key: "effectiveDate", label: "Effective date", type: "date", important: true },
    { key: "department", label: "Department", type: "dropdown", options: ["Legal", "Finance", "HR", "Engineering", "Sales", "Procurement"], important: true },
    { key: "expiryDate", label: "Expiry date", type: "date" },
    { key: "autoRenewal", label: "Auto-renewal", type: "dropdown", options: ["Yes", "No"] },
    { key: "governingLaw", label: "Governing law", type: "dropdown", options: ["Saudi Arabia", "UAE", "USA", "UK", "Germany", "Other"] },
    { key: "internalRef", label: "Internal reference", type: "text" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  "NDA": [
    { key: "counterparty", label: "Counterparty", type: "text", important: true },
    { key: "confidentialityPeriod", label: "Confidentiality period", type: "dropdown", options: ["1 year", "2 years", "3 years", "5 years", "Indefinite"], important: true },
    { key: "ndaType", label: "NDA type", type: "dropdown", options: ["Mutual", "One-way", "Employee"], important: true },
    { key: "effectiveDate", label: "Effective date", type: "date" },
    { key: "governingLaw", label: "Governing law", type: "dropdown", options: ["Saudi Arabia", "UAE", "USA", "UK", "Germany", "Other"] },
    { key: "notes", label: "Notes", type: "text" },
  ],
  "Employment Contract": [
    { key: "employeeName", label: "Employee name", type: "text", important: true },
    { key: "position", label: "Position / title", type: "text", important: true },
    { key: "startDate", label: "Start date", type: "date", important: true },
    { key: "department", label: "Department", type: "dropdown", options: ["Legal", "Finance", "HR", "Engineering", "Sales", "Procurement"], important: true },
    { key: "salary", label: "Salary", type: "number", currency: "SAR", important: true },
    { key: "probationPeriod", label: "Probation period", type: "dropdown", options: ["30 days", "60 days", "90 days", "None"] },
    { key: "contractDuration", label: "Contract duration", type: "dropdown", options: ["1 year", "2 years", "3 years", "Indefinite"] },
    { key: "notes", label: "Notes", type: "text" },
  ],
  "Statement of Work": [
    { key: "projectName", label: "Project name", type: "text", important: true },
    { key: "deliveryDate", label: "Delivery date", type: "date", important: true },
    { key: "budget", label: "Budget", type: "number", currency: "SAR", important: true },
    { key: "milestones", label: "Milestones", type: "text" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  "Insurance Certificate": [
    { key: "insurer", label: "Insurer", type: "text", important: true },
    { key: "coverageAmount", label: "Coverage amount", type: "number", currency: "SAR", important: true },
    { key: "validUntil", label: "Valid until", type: "date", important: true },
    { key: "policyNumber", label: "Policy number", type: "text" },
    { key: "notes", label: "Notes", type: "text" },
  ],
};

const DEFAULT_PROPERTIES: PropertyField[] = [
  { key: "effectiveDate", label: "Effective date", type: "date", important: true },
  { key: "notes", label: "Notes", type: "text" },
];

const DOC_TYPE_BADGE: Record<string, { label: string; className: string }> = {
  primary: { label: "Primary", className: "text-muted-foreground border-border" },
  supplement: { label: "Supplement", className: "text-amber-600 dark:text-amber-400 border-amber-500/30" },
  attachment: { label: "Attachment", className: "text-amber-600 dark:text-amber-400 border-amber-500/30" },
  amendment: { label: "Amendment", className: "text-violet-600 dark:text-violet-400 border-violet-500/30" },
};

/* ── Inline editable row ── */
const InlinePropertyRow = ({
  field,
  value,
  docId,
  onSave,
  editingKey,
  setEditingKey,
}: {
  field: PropertyField;
  value: string;
  docId: string;
  onSave: (docId: string, key: string, value: string) => void;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const compositeKey = `${docId}_${field.key}`;
  const isEditing = editingKey === compositeKey;

  const startEdit = () => {
    setLocalValue(value);
    setEditingKey(compositeKey);
  };

  const save = () => {
    onSave(docId, field.key, localValue);
    setEditingKey(null);
    toast.success("Property updated");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") { setLocalValue(value); setEditingKey(null); }
  };

  return (
    <div
      className={cn(
        "flex items-center min-h-[32px] rounded-md px-2 -mx-2 transition-colors",
        !isEditing && "hover:bg-muted/50 cursor-pointer"
      )}
      onClick={() => !isEditing && startEdit()}
    >
      <span className="text-xs text-muted-foreground w-[120px] shrink-0">{field.label}</span>
      <div className="flex-1 flex items-center gap-1.5">
        {isEditing ? (
          <>
            {field.type === "dropdown" && field.options ? (
              <Select value={localValue} onValueChange={(v) => { setLocalValue(v); onSave(docId, field.key, v); setEditingKey(null); toast.success("Property updated"); }}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : field.type === "date" ? (
              <Input type="date" value={localValue} onChange={(e) => setLocalValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={save} className="h-7 text-xs flex-1" autoFocus />
            ) : field.type === "number" ? (
              <div className="flex flex-1">
                {field.currency && (
                  <span className="inline-flex items-center px-1.5 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-[10px]">
                    {field.currency}
                  </span>
                )}
                <Input type="text" value={localValue} onChange={(e) => setLocalValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={save} className={cn("h-7 text-xs flex-1", field.currency && "rounded-l-none")} autoFocus />
              </div>
            ) : (
              <Input value={localValue} onChange={(e) => setLocalValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={save} className="h-7 text-xs flex-1" autoFocus />
            )}
            <button onClick={(e) => { e.stopPropagation(); save(); }} className="h-5 w-5 rounded flex items-center justify-center hover:bg-primary/10 text-primary flex-shrink-0">
              <Check size={12} />
            </button>
          </>
        ) : (
          <span className={cn("text-xs flex-1", value ? "text-foreground" : "text-muted-foreground/50")}>
            {value || "—"}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Document section ── */
const DocumentSection = ({
  doc,
  selectedType,
  onTypeChange,
  values,
  onSave,
  editingKey,
  setEditingKey,
  defaultOpen,
}: {
  doc: { id: string; name: string; docType: string };
  selectedType: string;
  onTypeChange: (docId: string, type: string) => void;
  values: Record<string, string>;
  onSave: (docId: string, key: string, value: string) => void;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  defaultOpen: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [showMore, setShowMore] = useState(false);

  const badge = DOC_TYPE_BADGE[doc.docType] || DOC_TYPE_BADGE.primary;
  const typeOptions = TYPE_OPTIONS[doc.docType] || PRIMARY_TYPES;

  const allFields = selectedType
    ? (TYPE_PROPERTIES[selectedType] || DEFAULT_PROPERTIES)
    : [];

  const importantFields = allFields.filter(f => f.important);
  const lessImportantFields = allFields.filter(f => !f.important);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-1 rounded-md hover:bg-muted/50 transition-colors">
        <FileText size={14} className="text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-medium truncate flex-1 text-left">{doc.name}</span>
        <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5 font-medium border flex-shrink-0", badge.className)}>
          {badge.label}
        </Badge>
        <ChevronDown size={12} className={cn("text-muted-foreground transition-transform flex-shrink-0", open && "rotate-180")} />
      </CollapsibleTrigger>

      <CollapsibleContent className="pl-1 space-y-2 pb-2 animate-in slide-in-from-top-1 duration-150">
        {/* Document type selector */}
        <div className="flex items-center min-h-[32px] rounded-md px-2 -mx-1 hover:bg-muted/50">
          <span className="text-xs text-muted-foreground w-[120px] shrink-0">Document type</span>
          <Select value={selectedType} onValueChange={(v) => onTypeChange(doc.id, v)}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Important properties */}
        {importantFields.length > 0 && (
          <div className="space-y-0.5">
            {importantFields.map(field => (
              <InlinePropertyRow
                key={field.key}
                field={field}
                value={values[`${doc.id}_${field.key}`] || ""}
                docId={doc.id}
                onSave={onSave}
                editingKey={editingKey}
                setEditingKey={setEditingKey}
              />
            ))}
          </div>
        )}

        {/* Less important fields — collapsible */}
        {lessImportantFields.length > 0 && (
          <>
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-[11px] text-primary cursor-pointer hover:underline px-2 -mx-1"
            >
              {showMore ? (
                <>Show fewer <ChevronUp size={10} /></>
              ) : (
                <>+{lessImportantFields.length} more properties <ChevronDown size={10} /></>
              )}
            </button>

            {showMore && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                {lessImportantFields.map(field => (
                  <InlinePropertyRow
                    key={field.key}
                    field={field}
                    value={values[`${doc.id}_${field.key}`] || ""}
                    docId={doc.id}
                    onSave={onSave}
                    editingKey={editingKey}
                    setEditingKey={setEditingKey}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state when no type selected */}
        {!selectedType && (
          <p className="text-[11px] text-muted-foreground text-center py-3">
            Select a document type to see properties
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ── Main panel ── */
const EditorPropertiesPanel = () => {
  const [docTypes, setDocTypes] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const handleTypeChange = (docId: string, type: string) => {
    setDocTypes(prev => ({ ...prev, [docId]: type }));
  };

  const handleSave = (docId: string, key: string, value: string) => {
    setValues(prev => ({ ...prev, [`${docId}_${key}`]: value }));
  };

  return (
    <div className="space-y-1">
      {MOCK_DOCUMENTS.map((doc, i) => (
        <div key={doc.id}>
          <DocumentSection
            doc={doc}
            selectedType={docTypes[doc.id] || ""}
            onTypeChange={handleTypeChange}
            values={values}
            onSave={handleSave}
            editingKey={editingKey}
            setEditingKey={setEditingKey}
            defaultOpen={i === 0}
          />
          {i < MOCK_DOCUMENTS.length - 1 && <Separator className="my-1" />}
        </div>
      ))}
    </div>
  );
};

export default EditorPropertiesPanel;
