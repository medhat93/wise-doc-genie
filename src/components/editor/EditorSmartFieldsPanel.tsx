import { useState, useMemo } from "react";
import { Copy, Plus, Search, ChevronDown, MoreHorizontal, Trash2, Pencil, Check, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/* ── Variable definition ── */
export interface Variable {
  token: string;
  description: string;
  category: "role" | "system" | "custom";
  defaultValue?: string;
}

const ROLE_VARIABLES: Variable[] = [
  { token: "Signer.Name", description: "Full name of the signer", category: "role" },
  { token: "Signer.Email", description: "Email address", category: "role" },
  { token: "Signer.Phone", description: "Phone number", category: "role" },
  { token: "Signer.Company", description: "Company name", category: "role" },
  { token: "Signer.Title", description: "Job title", category: "role" },
  { token: "Approver.Name", description: "Approver's full name", category: "role" },
  { token: "Approver.Email", description: "Approver's email", category: "role" },
];

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

export const ALL_VARIABLES = [...ROLE_VARIABLES, ...SYSTEM_VARIABLES];

/* ── Variable row ── */
const VariableRow = ({
  variable,
  onCopy,
  menuItems,
}: {
  variable: Variable;
  onCopy: (token: string) => void;
  menuItems?: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors group">
    <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-1.5 py-0.5 flex-shrink-0">
      [{variable.token}]
    </span>
    <span className="text-xs text-muted-foreground truncate flex-1">{variable.description}</span>
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={(e) => { e.stopPropagation(); onCopy(variable.token); }}
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
  const { variableValues, setVariableValues, usedVariables } = useEditorContext();
  const [search, setSearch] = useState("");
  const [roleOpen, setRoleOpen] = useState(true);
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

  const allVars = useMemo(() => [...ALL_VARIABLES, ...customVariables], [customVariables]);

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
  const usedVarsList = allVars.filter(v => usedTokens.has(v.token));
  const unusedVarsList = usedVarsList.length > 0
    ? allVars.filter(v => usedTokens.has(v.token) === false)
    : [];

  const filledCount = usedVarsList.filter(v => variableValues[v.token]?.trim()).length;
  const unfilledCount = usedVarsList.length - filledCount;

  // Filter
  const filterVars = (vars: Variable[]) =>
    search ? vars.filter(v => v.token.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase())) : vars;

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

          {/* Not used section */}
          {unusedVarsList.length > 0 && (
            <Collapsible open={unusedOpen} onOpenChange={setUnusedOpen} className="mt-2">
              <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown size={10} className={cn("transition-transform", unusedOpen && "rotate-180")} />
                {unusedVarsList.length} not used
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 space-y-0.5 opacity-60">
                  {filterVars(unusedVarsList).map(v => (
                    <VariableRow key={v.token} variable={v} onCopy={handleCopy} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* ROLE VARIABLES */}
      <Collapsible open={roleOpen} onOpenChange={setRoleOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role Variables</h3>
            <p className="text-[10px] text-muted-foreground">Auto-fill from participant data</p>
          </div>
          <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", roleOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 space-y-0.5">
            {filterVars(ROLE_VARIABLES).map(v => (
              <VariableRow key={v.token} variable={v} onCopy={handleCopy} />
            ))}
          </div>
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
              <VariableRow key={v.token} variable={v} onCopy={handleCopy} />
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
            {/* Add button */}
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

            {/* Create form */}
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

            {/* Custom list */}
            {filterVars(customVariables).map(v => (
              <VariableRow
                key={v.token}
                variable={v}
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

export default EditorSmartFieldsPanel;
