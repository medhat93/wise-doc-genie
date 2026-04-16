import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eye } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eye } from "lucide-react";
import { MOCK_DOCUMENTS } from "./EditorCanvas";

const DOC_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  primary: { label: "Primary", className: "text-muted-foreground border-border" },
  supplement: { label: "Supplement", className: "text-amber-600 dark:text-amber-400 border-amber-500/30" },
  attachment: { label: "Attachment", className: "text-amber-600 dark:text-amber-400 border-amber-500/30" },
  amendment: { label: "Amendment", className: "text-violet-600 dark:text-violet-400 border-violet-500/30" },
};

interface DocumentVisibilityPopoverProps {
  participantName: string;
  participantId: string;
  visibleDocIds: string[];
  onVisibilityChange: (participantId: string, docId: string, visible: boolean) => void;
  iconSize?: number;
  className?: string;
}

const DocumentVisibilityPopover = ({
  participantName,
  participantId,
  visibleDocIds,
  onVisibilityChange,
  iconSize = 13,
  className,
}: DocumentVisibilityPopoverProps) => {
  const visibleCount = visibleDocIds.length;
  const totalCount = MOCK_DOCUMENTS.length;

  return (
    <Popover>
      <Tooltip delayDuration={0}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity text-muted-foreground",
                className
              )}
            >
              <Eye size={iconSize} />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="top" className="text-xs">Control document visibility</TooltipContent>
      </Tooltip>
      <PopoverContent side="left" align="start" className="w-64 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={14} className="text-muted-foreground" />
          <p className="text-xs font-medium">
            Documents visible to {participantName.split(" ")[0]}
          </p>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {visibleCount}/{totalCount}
          </span>
        </div>
        <div className="space-y-2">
          {MOCK_DOCUMENTS.map((doc) => {
            const isPrimary = doc.docType === "primary";
            const isChecked = visibleDocIds.includes(doc.id);
            const typeStyle = DOC_TYPE_STYLES[doc.docType] || DOC_TYPE_STYLES.primary;

            return (
              <label
                key={doc.id}
                className={cn(
                  "flex items-center gap-2.5 cursor-pointer py-1",
                  isPrimary && "opacity-80 cursor-default"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  disabled={isPrimary}
                  onCheckedChange={(checked) => {
                    if (!isPrimary) {
                      onVisibilityChange(participantId, doc.id, !!checked);
                    }
                  }}
                  className={cn(isPrimary && "opacity-60")}
                />
                <span className="text-xs truncate flex-1 min-w-0">{doc.name}</span>
                <Badge
                  variant="outline"
                  className={cn("text-[9px] px-1.5 py-0 h-4 font-medium border flex-shrink-0", typeStyle.className)}
                >
                  {typeStyle.label}
                </Badge>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DocumentVisibilityPopover;
