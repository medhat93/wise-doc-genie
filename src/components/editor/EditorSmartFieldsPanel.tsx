import { useState } from "react";
import { Copy, Plus, Search, MapPin, Info, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SystemField {
  token: string;
  description: string;
}

const SYSTEM_FIELDS: SystemField[] = [
  { token: "signer_name", description: "Full name of the signer" },
  { token: "signer_email", description: "Email address of the signer" },
  { token: "signing_date", description: "Date when the document was signed" },
  { token: "company_name", description: "Signer's company name" },
  { token: "document_id", description: "Unique document identifier" },
  { token: "signer_title", description: "Job title of the signer" },
  { token: "signer_phone", description: "Phone number of the signer" },
];

type FieldType = "Text" | "Number" | "Date" | "Dropdown";

interface CustomField {
  id: string;
  token: string;
  description: string;
  type: FieldType;
}

interface UsedField {
  token: string;
  page: number;
}

const INITIAL_CUSTOM_FIELDS: CustomField[] = [
  { id: "cf1", token: "contract_value", description: "Total contract value", type: "Number" },
  { id: "cf2", token: "department", description: "Department name", type: "Text" },
];

const MOCK_USED_FIELDS: UsedField[] = [
  { token: "signer_name", page: 1 },
  { token: "signing_date", page: 3 },
];

const TYPE_COLORS: Record<FieldType, string> = {
  Text: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Number: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Date: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Dropdown: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const EditorSmartFieldsPanel = () => {
  const [customFields, setCustomFields] = useState<CustomField[]>(INITIAL_CUSTOM_FIELDS);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("Text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [usedOpen, setUsedOpen] = useState(true);

  const handleCopyField = (token: string) => {
    navigator.clipboard?.writeText(`{{${token}}}`);
    toast("Smart field copied — paste it in the editor");
  };

  const handleCreateField = () => {
    if (!newFieldName.trim()) return;
    const token = newFieldName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      token,
      description: newFieldName.trim(),
      type: newFieldType,
    };
    setCustomFields((prev) => [...prev, newField]);
    setNewFieldName("");
    setNewFieldType("Text");
    setNewFieldOptions("");
    setShowCreateForm(false);
    toast.success(`Field {{${token}}} created`);
  };

  return (
    <div className="space-y-5">
      {/* Subtitle */}
      <p className="text-xs text-muted-foreground">
        Insert dynamic placeholders that auto-fill with data
      </p>

      {/* SECTION 1: System fields */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            System fields
          </h3>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Info size={12} className="text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[220px] text-xs">
              These fields auto-fill with system data when the document is signed
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-1.5">
          {SYSTEM_FIELDS.map((field) => (
            <button
              key={field.token}
              onClick={() => handleCopyField(field.token)}
              className="w-full border rounded-md px-3 py-2 text-left hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono text-foreground">{`{{${field.token}}}`}</code>
                <Copy size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{field.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: Custom fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Custom fields
          </h3>
          {!showCreateForm && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 px-2"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={12} />
              Create field
            </Button>
          )}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="border rounded-md p-3 mb-3 space-y-2.5 bg-muted/30">
            <Input
              placeholder="Field name (e.g. Start Date)"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="h-8 text-sm"
            />
            {newFieldName.trim() && (
              <p className="text-[11px] text-muted-foreground font-mono">
                → {`{{${newFieldName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}}}`}
              </p>
            )}
            <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="Number">Number</SelectItem>
                <SelectItem value="Date">Date</SelectItem>
                <SelectItem value="Dropdown">Dropdown</SelectItem>
              </SelectContent>
            </Select>
            {newFieldType === "Dropdown" && (
              <Textarea
                placeholder="Options (one per line)"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
                className="text-sm min-h-[60px]"
              />
            )}
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleCreateField} disabled={!newFieldName.trim()}>
                Add Field
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowCreateForm(false); setNewFieldName(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {customFields.map((field) => (
            <button
              key={field.id}
              onClick={() => handleCopyField(field.token)}
              className="w-full border rounded-md px-3 py-2 text-left hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono text-foreground">{`{{${field.token}}}`}</code>
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", TYPE_COLORS[field.type])}>
                    {field.type}
                  </span>
                  <Copy size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{field.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: Used in this document */}
      <Collapsible open={usedOpen} onOpenChange={setUsedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 group">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Used in this document
          </h3>
          <ChevronDown
            size={14}
            className={cn(
              "text-muted-foreground transition-transform duration-200",
              usedOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1 mt-2">
            {MOCK_USED_FIELDS.map((uf, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/40 text-xs"
              >
                <code className="font-mono text-foreground">{`{{${uf.token}}}`}</code>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Page {uf.page}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled>
                    <MapPin size={11} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default EditorSmartFieldsPanel;
