import React, { useState, useRef, useEffect } from "react";
import { WorkspaceDocument } from "@/types/workspace";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X } from "lucide-react";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PropertyRow({ label, value, readOnly, type = "text", options, onSave }: {
  label: string; value: string; readOnly?: boolean; type?: "text" | "select" | "date" | "number"; options?: string[]; onSave?: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (editValue !== value) { onSave?.(editValue); toast.success(`${label} updated`); }
  };

  if (readOnly) {
    return (
      <div className="flex items-center min-h-[32px] px-2 -mx-2">
        <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
        <span className="text-sm text-muted-foreground/80 flex-1">{value || "—"}</span>
      </div>
    );
  }

  if (editing && type === "select" && options) {
    return (
      <div className="flex items-center min-h-[32px] px-2 -mx-2 bg-muted/50 rounded-md">
        <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
        <Select value={editValue} onValueChange={(v) => { setEditValue(v); setEditing(false); onSave?.(v); toast.success(`${label} updated`); }}>
          <SelectTrigger className="h-7 text-sm flex-1 border-primary/30"><SelectValue /></SelectTrigger>
          <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        <button className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setEditing(false)}><X size={12} /></button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center min-h-[32px] px-2 -mx-2 bg-muted/50 rounded-md">
        <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
        <input ref={inputRef} type={type === "date" ? "date" : "text"} value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} onBlur={save} className="flex-1 text-sm bg-transparent border-b border-primary/40 outline-none py-0.5" />
        <button className="ml-1 text-primary" onClick={save}><Check size={12} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center min-h-[32px] px-2 -mx-2 hover:bg-muted/50 rounded-md cursor-pointer group" onClick={() => setEditing(true)}>
      <span className="text-xs text-muted-foreground w-[120px] shrink-0">{label}</span>
      <span className="text-sm text-foreground flex-1 border-b border-dashed border-transparent group-hover:border-muted-foreground/30">
        {type === "number" && value ? `SAR ${value}` : value || "—"}
      </span>
    </div>
  );
}

export default function DocumentViewPropertiesPanel({ doc }: { doc: WorkspaceDocument }) {
  const [docType, setDocType] = useState(doc.category === "Contract" ? "Service Agreement" : doc.category);
  const [department, setDepartment] = useState("Legal");
  const [priority, setPriority] = useState("Medium");
  const [contractValue, setContractValue] = useState(doc.value?.replace("SAR ", "").replace(",", "") || "");
  const [folder, setFolder] = useState(doc.folder || "");
  const [expiryDate, setExpiryDate] = useState(doc.expiresAt ? new Date(doc.expiresAt).toISOString().split("T")[0] : "");

  return (
    <div className="space-y-0.5">
      <PropertyRow label="Document type" value={docType} readOnly />
      <PropertyRow label="Counterparty" value={doc.counterparty || ""} readOnly />
      <PropertyRow label="Sender" value={doc.owner} readOnly />
      <PropertyRow label="Created" value={formatDate(doc.createdAt)} readOnly />
      <PropertyRow label="Last modified" value={formatDate(doc.modifiedAt)} readOnly />
      <PropertyRow label="Expiry date" value={expiryDate} type="date" onSave={setExpiryDate} />
      <PropertyRow label="Folder" value={folder} onSave={setFolder} />
      <PropertyRow label="Contract value" value={contractValue} type="number" onSave={setContractValue} />
      <PropertyRow label="Department" value={department} type="select" options={["Legal", "Finance", "HR", "Engineering", "Sales", "Procurement"]} onSave={setDepartment} />
      <PropertyRow label="Priority" value={priority} type="select" options={["Low", "Medium", "High", "Critical"]} onSave={setPriority} />
    </div>
  );
}
