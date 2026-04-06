import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MOCK_DOCUMENTS } from "./EditorCanvas";

/* ── Document type configs ── */
const DOCUMENT_TYPES = [
  "Service Agreement",
  "NDA",
  "Employment Contract",
  "Consulting Agreement",
  "Procurement Contract",
  "Lease Agreement",
  "Partnership Agreement",
  "Other",
];

const SUPPLEMENT_TYPES = [
  "Statement of Work",
  "Addendum",
  "Schedule",
  "Exhibit",
  "Amendment",
  "Side Letter",
  "Other",
];

interface PropertyField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "dropdown";
  options?: string[];
  currency?: string;
  required?: boolean;
}

const REQUIRED_FIELDS: Record<string, PropertyField[]> = {
  "Service Agreement": [
    { key: "counterparty", label: "Counterparty", type: "text", required: true },
    { key: "contractValue", label: "Contract value", type: "number", currency: "SAR", required: true },
    { key: "effectiveDate", label: "Effective date", type: "date", required: true },
    { key: "department", label: "Department", type: "dropdown", options: ["Legal", "Finance", "HR", "Engineering", "Sales", "Procurement"], required: true },
  ],
  "NDA": [
    { key: "counterparty", label: "Counterparty", type: "text", required: true },
    { key: "confidentialityPeriod", label: "Confidentiality period", type: "dropdown", options: ["1 year", "2 years", "3 years", "5 years", "Indefinite"], required: true },
    { key: "ndaType", label: "NDA type", type: "dropdown", options: ["Mutual", "One-way", "Employee"], required: true },
  ],
  "Employment Contract": [
    { key: "employeeName", label: "Employee name", type: "text", required: true },
    { key: "position", label: "Position / title", type: "text", required: true },
    { key: "startDate", label: "Start date", type: "date", required: true },
    { key: "department", label: "Department", type: "dropdown", options: ["Legal", "Finance", "HR", "Engineering", "Sales", "Procurement"], required: true },
    { key: "salary", label: "Salary", type: "number", currency: "SAR", required: true },
  ],
};

const DEFAULT_REQUIRED: PropertyField[] = [
  { key: "counterparty", label: "Counterparty", type: "text", required: true },
  { key: "effectiveDate", label: "Effective date", type: "date", required: true },
];

const OPTIONAL_FIELDS: PropertyField[] = [
  { key: "expiryDate", label: "Expiry date", type: "date" },
  { key: "autoRenewal", label: "Auto-renewal", type: "dropdown", options: ["Yes", "No"] },
  { key: "governingLaw", label: "Governing law", type: "dropdown", options: ["Saudi Arabia", "UAE", "USA", "UK", "Germany", "Other"] },
  { key: "internalRef", label: "Internal reference number", type: "text" },
  { key: "notes", label: "Notes", type: "text" },
  { key: "priority", label: "Priority", type: "dropdown", options: ["Low", "Medium", "High", "Critical"] },
];

/* ── Inline editable row ── */
const InlinePropertyRow = ({
  field,
  value,
  onSave,
  editingKey,
  setEditingKey,
}: {
  field: PropertyField;
  value: string;
  onSave: (key: string, value: string) => void;
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isEditing = editingKey === field.key;

  const startEdit = () => {
    setLocalValue(value);
    setEditingKey(field.key);
  };

  const save = () => {
    onSave(field.key, localValue);
    setEditingKey(null);
    toast.success("Property updated");
  };

  const cancel = () => {
    setLocalValue(value);
    setEditingKey(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  return (
    <div
      className={cn(
        "flex items-center min-h-[36px] rounded-md px-2 -mx-2 transition-colors",
        !isEditing && "hover:bg-muted/50 cursor-pointer"
      )}
      onClick={() => !isEditing && startEdit()}
    >
      <span className="text-sm text-muted-foreground w-[140px] shrink-0">{field.label}</span>
      <div className="flex-1 flex items-center gap-1.5">
        {isEditing ? (
          <>
            {field.type === "dropdown" && field.options ? (
              <Select value={localValue} onValueChange={(v) => { setLocalValue(v); onSave(field.key, v); setEditingKey(null); toast.success("Property updated"); }}>
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "date" ? (
              <Input
                type="date"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={save}
                className="h-8 text-sm flex-1"
                autoFocus
              />
            ) : field.type === "number" ? (
              <div className="flex flex-1">
                {field.currency && (
                  <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-xs">
                    {field.currency}
                  </span>
                )}
                <Input
                  type="text"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={save}
                  className={cn("h-8 text-sm flex-1", field.currency && "rounded-l-none")}
                  autoFocus
                />
              </div>
            ) : (
              <Input
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={save}
                className="h-8 text-sm flex-1"
                autoFocus
              />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); save(); }}
              className="h-6 w-6 rounded flex items-center justify-center hover:bg-primary/10 text-primary flex-shrink-0"
            >
              <Check size={14} />
            </button>
          </>
        ) : (
          <span className={cn("text-sm flex-1", value ? "text-foreground" : "text-muted-foreground/60")}>
            {value || "—"}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Main panel ── */
const EditorPropertiesPanel = () => {
  const [documentType, setDocumentType] = useState("");
  const [supplementTypes, setSupplementTypes] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const supplements = MOCK_DOCUMENTS.filter(d => d.docType === "supplement");
  const hasSupplements = supplements.length > 0;

  const requiredFields = documentType
    ? (REQUIRED_FIELDS[documentType] || DEFAULT_REQUIRED)
    : [];

  const handleSave = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Document Type Selector */}
      <div
        className="flex items-center min-h-[36px] rounded-md px-2 -mx-2 hover:bg-muted/50"
      >
        <span className="text-sm text-muted-foreground w-[140px] shrink-0">Document type</span>
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger className="h-8 text-sm flex-1">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Supplement Types */}
      {hasSupplements && (
        <>
          <Separator />
          {supplements.map(doc => (
            <div
              key={doc.id}
              className="flex items-center min-h-[36px] rounded-md px-2 -mx-2 hover:bg-muted/50"
            >
              <span className="text-sm text-muted-foreground w-[140px] shrink-0 truncate" title={`${doc.name} type`}>
                {doc.name.length > 16 ? doc.name.slice(0, 16) + "…" : doc.name} type
              </span>
              <Select
                value={supplementTypes[doc.id] || ""}
                onValueChange={(v) => setSupplementTypes(prev => ({ ...prev, [doc.id]: v }))}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLEMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </>
      )}

      {/* Empty state or required fields */}
      {!documentType ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Select a document type to see required properties
        </div>
      ) : (
        <>
          <Separator />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Required
          </h3>
          <div className="space-y-0.5">
            {requiredFields.map(field => (
              <InlinePropertyRow
                key={field.key}
                field={field}
                value={values[field.key] || ""}
                onSave={handleSave}
                editingKey={editingKey}
                setEditingKey={setEditingKey}
              />
            ))}
          </div>

          {/* Show more */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline mt-2"
          >
            {showMore ? (
              <>Show fewer <ChevronUp size={12} /></>
            ) : (
              <>Show {OPTIONAL_FIELDS.length} more properties <ChevronDown size={12} /></>
            )}
          </button>

          {showMore && (
            <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
              {OPTIONAL_FIELDS.map(field => (
                <InlinePropertyRow
                  key={field.key}
                  field={field}
                  value={values[field.key] || ""}
                  onSave={handleSave}
                  editingKey={editingKey}
                  setEditingKey={setEditingKey}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EditorPropertiesPanel;
