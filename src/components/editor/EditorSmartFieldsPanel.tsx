import { useState, useMemo, useRef, useEffect } from "react";
import { Copy, Plus, Check, AlertTriangle, X, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";
import type { Participant } from "./EditorParticipantsPanel";

/* ── Variable definition ── */
export interface Variable {
  token: string;
  description: string;
  category: "role" | "system" | "custom" | "participant";
  defaultValue?: string;
}

const SYSTEM_VARIABLES: Variable[] = [
  { token: "Document.Name", description: "Document title", category: "system" },
  { token: "Document.ID", description: "Unique document identifier", category: "system" },
  { token: "Document.CreatedDate", description: "Date document was created", category: "system" },
  { token: "Document.SentDate", description: "Date document was sent for signing", category: "system" },
  { token: "Document.CompletedDate", description: "Date all parties signed", category: "system" },
  { token: "Document.Value", description: "Total document/contract value", category: "system" },
  { token: "Document.ExpirationDate", description: "Expiration date", category: "system" },
  { token: "Sender.Name", description: "Name of the person who sent the document", category: "system" },
  { token: "Sender.Email", description: "Sender's email address", category: "system" },
  { token: "Sender.Company", description: "Sender's organization", category: "system" },
];

const PARTICIPANT_FIELDS = ["Name", "Email", "Phone", "Company", "Title"] as const;

const getParticipantFieldValue = (p: Participant, field: string): string => {
  switch (field) {
    case "Name": return p.name || "";
    case "Email": return p.email || "";
    case "Phone": return p.sendingPhone || p.phone || "";
    default: return "";
  }
};

const generatePrefixes = (participants: Participant[]): Map<string, string> => {
  const prefixMap = new Map<string, string>();
  const firstNames = new Map<string, Participant[]>();
  participants.forEach((p) => {
    const firstName = p.name.split(" ")[0];
    if (!firstNames.has(firstName)) firstNames.set(firstName, []);
    firstNames.get(firstName)!.push(p);
  });
  firstNames.forEach((group, firstName) => {
    if (group.length === 1) {
      prefixMap.set(group[0].id, firstName);
    } else {
      group.forEach((p) => {
        const lastInitial = p.name.split(" ").slice(1).map(n => n[0]).join("") || "X";
        prefixMap.set(p.id, `${firstName}.${lastInitial}`);
      });
    }
  });
  return prefixMap;
};

/* ── Categorized dropdown item ── */
interface DropdownVariable {
  token: string;
  description: string;
  category: string;
}

/* ── Main panel ── */
const EditorSmartFieldsPanel = () => {
  const { participants, variableValues, setVariableValues, usedVariables } = useEditorContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [customVariables, setCustomVariables] = useState<Variable[]>([
    { token: "Contract.Type", description: "Type of contract", category: "custom", defaultValue: "Service Agreement" },
    { token: "Department", description: "Department name", category: "custom", defaultValue: "Legal" },
    { token: "PO.Number", description: "Purchase order number", category: "custom", defaultValue: "" },
  ]);

  // Track added placeholders (separate from usedVariables which tracks document usage)
  const [addedTokens, setAddedTokens] = useState<string[]>(() => [...usedVariables]);

  const prefixes = useMemo(() => generatePrefixes(participants), [participants]);

  // Build all available variables
  const allVariables = useMemo(() => {
    const vars: DropdownVariable[] = [];

    // Participant variables
    participants.forEach((p) => {
      const prefix = prefixes.get(p.id) || p.name.split(" ")[0];
      PARTICIPANT_FIELDS.forEach((field) => {
        vars.push({
          token: `${prefix}.${field}`,
          description: getParticipantFieldValue(p, field) || `${p.name}'s ${field.toLowerCase()}`,
          category: "Participant",
        });
      });
    });

    // System variables
    SYSTEM_VARIABLES.forEach((v) => {
      vars.push({ token: v.token, description: v.description, category: "System" });
    });

    // Custom variables
    customVariables.forEach((v) => {
      vars.push({ token: v.token, description: v.description, category: "Custom" });
    });

    return vars;
  }, [participants, prefixes, customVariables]);

  // Merge addedTokens with usedVariables
  const activeTokens = useMemo(() => {
    const set = new Set([...addedTokens, ...usedVariables]);
    return Array.from(set);
  }, [addedTokens, usedVariables]);

  const activeVars = useMemo(() =>
    activeTokens.map(token => allVariables.find(v => v.token === token)).filter(Boolean) as DropdownVariable[],
    [activeTokens, allVariables]
  );

  const filledCount = activeVars.filter(v => variableValues[v.token]?.trim()).length;
  const unfilledCount = activeVars.length - filledCount;

  // Filtered dropdown items
  const filteredDropdown = useMemo(() => {
    const q = dropdownSearch.toLowerCase();
    return allVariables.filter(v =>
      !activeTokens.includes(v.token) &&
      (v.token.toLowerCase().includes(q) || v.description.toLowerCase().includes(q))
    );
  }, [allVariables, activeTokens, dropdownSearch]);

  // Group by category
  const groupedDropdown = useMemo(() => {
    const groups: Record<string, DropdownVariable[]> = {};
    filteredDropdown.forEach(v => {
      if (!groups[v.category]) groups[v.category] = [];
      groups[v.category].push(v);
    });
    return groups;
  }, [filteredDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setDropdownSearch("");
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleAddVariable = (token: string) => {
    setAddedTokens(prev => [...prev, token]);
    navigator.clipboard?.writeText(`[${token}]`);
    toast.success(`[${token}] added and copied`);
    setDropdownOpen(false);
    setDropdownSearch("");
  };

  const handleCopy = (token: string) => {
    navigator.clipboard?.writeText(`[${token}]`);
    toast.success(`[${token}] copied`);
  };

  const handleRemove = (token: string) => {
    setAddedTokens(prev => prev.filter(t => t !== token));
    toast.success(`[${token}] removed`);
  };

  const handleCreateCustom = () => {
    if (!dropdownSearch.trim()) return;
    const token = dropdownSearch.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(".");
    const newVar: Variable = { token, description: dropdownSearch.trim(), category: "custom", defaultValue: "" };
    setCustomVariables(prev => [...prev, newVar]);
    setAddedTokens(prev => [...prev, token]);
    navigator.clipboard?.writeText(`[${token}]`);
    toast.success(`[${token}] created and copied`);
    setDropdownOpen(false);
    setDropdownSearch("");
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Add placeholders and fill their values inline</p>

      {/* Add placeholder field with dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className={cn(
            "flex items-center gap-2 border rounded-lg px-3 h-10 cursor-text transition-colors",
            dropdownOpen ? "border-primary ring-1 ring-primary/20" : "hover:border-muted-foreground/40"
          )}
          onClick={() => {
            setDropdownOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <Plus size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            placeholder="Add placeholder..."
            value={dropdownSearch}
            onChange={(e) => {
              setDropdownSearch(e.target.value);
              if (!dropdownOpen) setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {dropdownSearch && (
            <button onClick={(e) => { e.stopPropagation(); setDropdownSearch(""); }} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 border rounded-lg bg-popover shadow-lg max-h-[320px] overflow-y-auto">
            {Object.keys(groupedDropdown).length > 0 ? (
              Object.entries(groupedDropdown).map(([category, vars]) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">
                    {category}
                  </p>
                  {vars.map(v => (
                    <button
                      key={v.token}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                      onClick={() => handleAddVariable(v.token)}
                    >
                      <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-1.5 py-0.5 flex-shrink-0">
                        [{v.token}]
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{v.description}</span>
                    </button>
                  ))}
                </div>
              ))
            ) : dropdownSearch.trim() ? (
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">No placeholder found</p>
                <button
                  onClick={handleCreateCustom}
                  className="w-full text-left text-sm text-primary border border-dashed rounded-md p-2.5 hover:bg-primary/5 transition-colors flex items-center gap-2"
                >
                  <Plus size={14} />
                  Create "{dropdownSearch.trim()}" as custom placeholder
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground p-3">All placeholders have been added</p>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      {activeVars.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs">
          {unfilledCount === 0 ? (
            <>
              <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400">All placeholders filled</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-400">{unfilledCount} need{unfilledCount === 1 ? "s" : ""} values</span>
            </>
          )}
          <span className="text-muted-foreground ml-auto">{filledCount}/{activeVars.length} filled</span>
        </div>
      )}

      {/* Added placeholders list */}
      {activeVars.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Added placeholders</p>
          <div className="space-y-1.5">
            {activeVars.map(v => {
              const isFilled = variableValues[v.token]?.trim();
              return (
                <div key={v.token} className="rounded-lg border bg-card p-2.5 space-y-1.5 group/item">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono text-[11px] rounded px-1.5 py-0.5 flex-shrink-0 border",
                      isFilled
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    )}>
                      [{v.token}]
                    </span>
                    <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(v.token)}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleRemove(v.token)}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <Input
                    placeholder={v.description || "Enter value..."}
                    value={variableValues[v.token] || ""}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [v.token]: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Plus size={18} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No placeholders yet</p>
          <p className="text-xs text-muted-foreground">Click above to add placeholders from the library</p>
        </div>
      )}
    </div>
  );
};

export { SYSTEM_VARIABLES };
export default EditorSmartFieldsPanel;