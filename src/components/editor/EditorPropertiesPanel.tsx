import { useState } from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EditorPropertiesPanel = () => {
  const [contractType, setContractType] = useState("Service Agreement");
  const [contractValue, setContractValue] = useState("150,000");
  const [department, setDepartment] = useState("Legal");
  const [effectiveDate, setEffectiveDate] = useState("2026-05-01");
  const [expiryDate, setExpiryDate] = useState("2027-04-30");
  const [priority, setPriority] = useState("Medium");

  return (
    <div className="space-y-5">
      {/* Subtitle */}
      <p className="text-xs text-muted-foreground">
        Document metadata and custom properties
      </p>

      {/* SECTION 1: Document Info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Document info
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Document type</span>
            <Badge variant="secondary" className="text-xs font-medium">Primary</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Created</span>
            <span className="text-foreground">April 4, 2026</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Created by</span>
            <span className="text-foreground">Ahmed Al-Rashid</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Template</span>
            <span className="text-foreground text-xs">Master Services Agreement</span>
          </div>
        </div>
      </div>

      <div className="border-t" />

      {/* SECTION 2: Custom Properties */}
      <div>
        <div className="flex items-center gap-1.5 mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Custom properties
          </h3>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Info size={12} className="text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px] text-xs">
              Properties defined by your organization's admin
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-4">
          {/* Contract Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Contract Type</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                <SelectItem value="NDA">NDA</SelectItem>
                <SelectItem value="Employment">Employment</SelectItem>
                <SelectItem value="Procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contract Value */}
          <div className="space-y-1.5">
            <Label className="text-xs">Contract Value</Label>
            <div className="flex">
              <span className="inline-flex items-center px-2.5 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-xs">
                SAR
              </span>
              <Input
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="h-9 text-sm rounded-l-none"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Effective Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Effective Date</Label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Expiry Date</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-4">
              {["Low", "Medium", "High"].map((p) => (
                <div key={p} className="flex items-center gap-1.5">
                  <RadioGroupItem value={p} id={`priority-${p}`} />
                  <Label htmlFor={`priority-${p}`} className="text-sm font-normal cursor-pointer">
                    {p}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-5">
          Properties are configured by your admin in Settings
        </p>
      </div>
    </div>
  );
};

export default EditorPropertiesPanel;
