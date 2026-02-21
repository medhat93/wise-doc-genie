import { Template, categoryBadgeMap } from "@/data/templates";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, Add01Icon, DashboardSquare01Icon, UserIcon, Share01Icon } from "@hugeicons/core-free-icons";
import signitLogo from "@/assets/signit-logo.png";

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
  tall?: boolean;
}

const DocumentLines = () => (
  <div className="w-[140px] h-[100px] mx-auto mt-4 bg-white/90 rounded shadow-sm p-3 space-y-2">
    <div className="h-[4px] bg-gray-200 rounded w-full" />
    <div className="h-[4px] bg-gray-200 rounded w-4/5" />
    <div className="h-[4px] bg-gray-200 rounded w-full" />
    <div className="h-[4px] bg-gray-200 rounded w-3/5" />
  </div>
);

const MutedDocumentLines = () => (
  <div className="w-[140px] h-[100px] mx-auto mt-4 bg-background rounded shadow-sm p-3 space-y-2 border">
    <div className="h-[4px] bg-muted-foreground/20 rounded w-full" />
    <div className="h-[4px] bg-muted-foreground/15 rounded w-4/5" />
    <div className="h-[4px] bg-muted-foreground/20 rounded w-full" />
    <div className="h-[4px] bg-muted-foreground/15 rounded w-3/5" />
  </div>
);

const TemplateCard = ({ template, onPreview, onUse, tall }: TemplateCardProps) => {
  const badgeLabel = categoryBadgeMap[template.name] || template.category || null;
  const isUserTemplate = template.source === "user";
  const isLibrary = template.source === "library";

  // Determine source icon + tooltip for top-right corner
  const sourceIndicator = isLibrary ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-white flex items-center justify-center z-10">
          <img src={signitLogo} alt="Signit" className="h-3 w-3 object-contain" />
        </div>
      </TooltipTrigger>
      <TooltipContent>Signit template library</TooltipContent>
    </Tooltip>
  ) : template.isShared ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-background border flex items-center justify-center z-10">
          <HugeiconsIcon icon={Share01Icon} size={12} className="text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>{template.sharedBy ? `Shared by ${template.sharedBy}` : "Shared with you"}</TooltipContent>
    </Tooltip>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-background border flex items-center justify-center z-10">
          <HugeiconsIcon icon={UserIcon} size={12} className="text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>{template.subtitle || "Created by you"}</TooltipContent>
    </Tooltip>
  );

  const thumbnailBg = isUserTemplate
    ? "bg-muted"
    : `bg-gradient-to-br ${template.gradient}`;

  return (
    <Card className="group relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Thumbnail with preview on hover */}
      <div
        className={`relative ${thumbnailBg} ${tall ? "h-[140px]" : "h-[120px]"} rounded-t-lg flex items-start justify-center`}
      >
        {isUserTemplate ? <MutedDocumentLines /> : <DocumentLines />}
        {sourceIndicator}
        {/* Preview overlay on hover */}
        <div className="absolute inset-0 bg-black/50 rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(template);
            }}
          >
            <HugeiconsIcon icon={ViewIcon} size={14} />
            Preview
          </Button>
        </div>
      </div>

      {/* Info + Add button */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{template.name}</p>
            {tall && template.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground truncate mt-1">{template.description}</p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {template.description}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {/* Always-visible Add button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="h-7 w-7 rounded-full flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onUse(template);
                }}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add to document queue</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {badgeLabel && <Badge variant="secondary" className="text-xs">{badgeLabel}</Badge>}
          <span className="text-xs text-muted-foreground">{template.pageCount} {template.pageCount === 1 ? "page" : "pages"}</span>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;
