import { useState, useMemo } from "react";
import { Copy, Plus, Search, ChevronDown, MoreHorizontal, Trash2, Pencil, Check, AlertTriangle, X, Users } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const ROLE_STYLES: Record<string, string> = {
  signer: "bg-[hsl(var(--brand-indigo))]/15 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/30",
  approver: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  viewer: "bg-muted text-muted-foreground border-border",
  cc: "bg-muted text-muted-foreground border-border",
};

const ROLE_LABELS: Record<string, string> = {
  signer: "Signer",
  approver: "Approver",
  viewer: "Viewer",
  cc: "CC",
};

/* ── Generate unique prefix from participant name ── */
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

const PARTICIPANT_FIELDS = ["Name", "Email", "Phone", "Company", "Title"] as const;

const getParticipantFieldValue = (p: Participant, field: string): string => {
  switch (field) {
    case "Name": return p.name || "";
    case "Email": return p.email || "";
    case "Phone": return p.sendingPhone || p.phone || "";
    case "Company": return "";
    case "Title": return "";
    default: return "";
  }
};

/* ── Variable row ── */
const VariableRow = ({
  token,
  value,
  onCopy,
  menuItems,
  description,
}: {
  token: string;
  value?: string;
  onCopy: (token: string) => void;
  menuItems?: React.ReactNode;
  description?: string;
}) => (
  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors group">
    <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-1.5 py-0.5 flex-shrink-0">
      [{token}]
    </span>
    <span className="text-xs text-muted-foreground truncate flex-1">
      {value || description || "—"}
    </span>
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={(e) => { e.stopPropagation(); onCopy(token); }}
        className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
      >
        <Copy size={12} />
      </button>
      {menuItems}
    </div>
  </div>
);

/* ── Main panel ── */
const EditorSmartFieldsPanel = () => {
  const { participants, variableValues, setVariableValues, usedVariables } = useEditorContext();
  const [search, setSearch] = useState("");
  const [participantOpen, setParticipantOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);
  const [customOpen, setCustomOpen] = useState(true);
  const [unusedOpen, setUnusedOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarDefault, setNewVarDefault] = useState("");

  const [customVariables, setCustomVariables] = useState<Variable[]>([
    { token: "Contract.Type", description: "Type of contract", category: "custom", defaultValue: "Service Agreement" },
    { token: "Department", description: "Department name", category: "custom", defaultValue: "Legal" },
    { token: "PO.Number", description: "Purchase order number", category: "custom", defaultValue: "" },
  ]);

  const prefixes = useMemo(() => generatePrefixes(participants), [participants]);

  // Build participant variables dynamically
  const participantVariables = useMemo(() => {
    const vars: { participant: Participant; prefix: string; variables: { token: string; value: string }[] }[] = [];
    participants.forEach((p) => {
      const prefix = prefixes.get(p.id) || p.name.split(" ")[0];
      const fields = PARTICIPANT_FIELDS.map((field) => ({
        token: `${prefix}.${field}`,
        value: getParticipantFieldValue(p, field),
      }));
      vars.push({ participant: p, prefix, variables: fields });
    });
    return vars;
  }, [participants, prefixes]);

  const allTokens = useMemo(() => {
    const tokens: Variable[] = [];
    participantVariables.forEach(({ variables }) => {
      variables.forEach((v) => {
        tokens.push({ token: v.token, description: v.value || "—", category: "participant" });
      });
    });
    return [...tokens, ...SYSTEM_VARIABLES, ...customVariables];
  }, [participantVariables, customVariables]);

  const handleCopy = (token: string) => {
    navigator.clipboard?.writeText(`[${token}]`);
    toast.success(`[${token}] copied — paste it in the document`);
  };

  const handleCreate = () => {
    if (!newVarName.trim()) return;
    const token = newVarName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(".");
    const newVar: Variable = { token, description: newVarName.trim(), category: "custom", defaultValue: newVarDefault };
    setCustomVariables(prev => [...prev, newVar]);
    if (newVarDefault) {
      setVariableValues(prev => ({ ...prev, [token]: newVarDefault }));
    }
    navigator.clipboard?.writeText(`[${token}]`);
    toast.success(`[${token}] created and copied to clipboard`);
    setNewVarName("");
    setNewVarDefault("");
    setShowCreateForm(false);
  };

  const handleDeleteCustom = (token: string) => {
    const usageCount = usedVariables.filter(v => v === token).length;
    if (usageCount > 0) {
      toast.warning(`This variable is used ${usageCount} time(s) in the document. Removing it will leave the placeholder text.`);
    }
    setCustomVariables(prev => prev.filter(v => v.token !== token));
    toast.success(`[${token}] removed`);
  };

  // Used vs unused
  const usedTokens = new Set(usedVariables);
  const usedVarsList = allTokens.filter(v => usedTokens.has(v.token));
  const filledCount = usedVarsList.filter(v => variableValues[v.token]?.trim()).length;
  const unfilledCount = usedVarsList.length - filledCount;

  // Filter
  const matchesSearch = (text: string) =>
    !search || text.toLowerCase().includes(search.toLowerCase());

  const filterVars = (vars: Variable[]) =>
    search ? vars.filter(v => matchesSearch(v.token) || matchesSearch(v.description)) : vars;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Insert dynamic fields that auto-fill with data</p>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm pl-8"
        />
      </div>

      {/* Status bar */}
      {usedVarsList.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 text-xs">
          {unfilledCount === 0 ? (
            <>
              <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400">All variables filled</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-400">{unfilledCount} variable{unfilledCount !== 1 ? "s" : ""} need{unfilledCount === 1 ? "s" : ""} values</span>
            </>
          )}
          <span className="text-muted-foreground ml-auto">{usedVarsList.length} used · {filledCount} filled</span>
        </div>
      )}

      {/* USED IN DOCUMENT */}
      {usedVarsList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Used in document</h3>
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-medium">{usedVarsList.length}</span>
          </div>
          <div className="space-y-2">
            {usedVarsList.map(v => (
              <div key={v.token} className="flex items-center gap-2 px-2 py-1.5 rounded-md border bg-card">
                <span className={cn(
                  "font-mono text-xs rounded px-1.5 py-0.5 flex-shrink-0",
                  variableValues[v.token]?.trim()
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                )}>
                  [{v.token}]
                </span>
                <Input
                  placeholder="Enter value..."
                  value={variableValues[v.token] || ""}
                  onChange={(e) => setVariableValues(prev => ({ ...prev, [v.token]: e.target.value }))}
                  className="h-7 text-xs flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PARTICIPANT VARIABLES */}
      <Collapsible open={participantOpen} onOpenChange={setParticipantOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participant Variables</h3>
            <p className="text-[10px] text-muted-foreground">Auto-fill from participant data</p>
          </div>
          <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", participantOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 mt-2">
              <Users size={28} className="text-muted-foreground opacity-40" />
              <p className="text-xs text-muted-foreground text-center">
                Add participants in Step 2 to generate signer variables
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              {participantVariables
                .filter(({ participant, variables }) =>
                  !search || matchesSearch(participant.name) || variables.some(v => matchesSearch(v.token))
                )
                .map(({ participant, variables }) => (
                  <div key={participant.id} className="space-y-0.5">
                    {/* Participant header */}
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="text-sm font-medium truncate">{participant.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] px-1.5 py-0 h-4 font-medium border",
                          ROLE_STYLES[participant.role] || ROLE_STYLES.viewer
                        )}
                      >
                        {ROLE_LABELS[participant.role] || participant.role}
                      </Badge>
                    </div>
                    {/* Variable rows */}
                    {variables
                      .filter((v) => !search || matchesSearch(v.token))
                      .map((v) => (
                        <VariableRow
                          key={v.token}
                          token={v.token}
                          value={v.value || "—"}
                          onCopy={handleCopy}
                        />
                      ))}
                  </div>
                ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* SYSTEM VARIABLES */}
      <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">System Variables</h3>
            <p className="text-[10px] text-muted-foreground">Auto-populated by the system</p>
          </div>
          <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", systemOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 space-y-0.5">
            {filterVars(SYSTEM_VARIABLES).map(v => (
              <VariableRow key={v.token} token={v.token} description={v.description} onCopy={handleCopy} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* CUSTOM VARIABLES */}
      <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom Variables</h3>
            <p className="text-[10px] text-muted-foreground">Create your own reusable variables</p>
          </div>
          <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", customOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-1">
            {!showCreateForm && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-dashed gap-1.5"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus size={12} />
                Add custom variable
              </Button>
            )}

            {showCreateForm && (
              <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                <Input
                  placeholder="Variable name (e.g. Project Name)"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                {newVarName.trim() && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    → [{newVarName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(".")}]
                  </p>
                )}
                <Input
                  placeholder="Default value (optional)"
                  value={newVarDefault}
                  onChange={(e) => setNewVarDefault(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={!newVarName.trim()}>Add</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowCreateForm(false); setNewVarName(""); setNewVarDefault(""); }}>Cancel</Button>
                </div>
              </div>
            )}

            {filterVars(customVariables).map(v => (
              <VariableRow
                key={v.token}
                token={v.token}
                description={v.description}
                onCopy={handleCopy}
                menuItems={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={12} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs">
                        <Pencil size={12} className="mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-destructive" onClick={() => handleDeleteCustom(v.token)}>
                        <Trash2 size={12} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export { SYSTEM_VARIABLES };
export default EditorSmartFieldsPanel;
