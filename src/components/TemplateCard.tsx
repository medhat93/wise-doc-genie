import { Template, categoryBadgeMap } from "@/data/templates";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, Add01Icon, DashboardSquare01Icon, UserIcon, Share01Icon } from "@hugeicons/core-free-icons";

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
  tall?: boolean;
  showSourceBadge?: boolean;
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

const TemplateCard = ({ template, onPreview, onUse, tall, showSourceBadge }: TemplateCardProps) => {
  const badgeLabel = categoryBadgeMap[template.name] || template.category;
  const isUserTemplate = template.source === "user";

  const previewArea = isUserTemplate ? (
    <div className={`relative bg-muted ${tall ? "h-[160px]" : "h-[140px]"} rounded-t-lg flex items-start justify-center`}>
      <MutedDocumentLines />
      {showSourceBadge && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-background border flex items-center justify-center">
          <HugeiconsIcon icon={UserIcon} size={12} className="text-muted-foreground" />
        </div>
      )}
      {template.isShared && (
        <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-background border flex items-center justify-center">
          <HugeiconsIcon icon={Share01Icon} size={12} className="text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="sm" onClick={() => onUse(template)}>
          Use template
        </Button>
      </div>
    </div>
  ) : (
    <div className={`relative bg-gradient-to-br ${template.gradient} ${tall ? "h-[160px]" : "h-[140px]"} rounded-t-lg`}>
      <DocumentLines />
      {showSourceBadge && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={12} className="text-white" />
        </div>
      )}
      {!showSourceBadge && (
        <div className="absolute top-2 right-2 text-[10px] font-medium text-brand-indigo bg-black/20 rounded-md px-1.5 py-0.5">
          Signit
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="sm" onClick={() => onUse(template)}>
          Use template
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="group relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      {previewArea}
      <div className="p-3">
        <p className="font-semibold text-sm">{template.name}</p>
        {tall && (
          <>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
            {template.isShared && template.sharedBy && (
              <div className="flex items-center gap-1.5 mt-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px] bg-muted">{template.sharedByInitials}</AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">Shared by {template.sharedBy}</p>
              </div>
            )}
            {!template.isShared && template.subtitle && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">{template.subtitle}</p>
            )}
          </>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="secondary" className="text-xs">{badgeLabel}</Badge>
          <span className="text-xs text-muted-foreground">{template.pageCount} {template.pageCount === 1 ? "page" : "pages"}</span>
        </div>
      </div>
      {tall && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => onPreview(template)}>
                <HugeiconsIcon icon={ViewIcon} size={14} className="mr-1" /> Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview this template</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" size="sm" onClick={() => onUse(template)}>
                <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1" /> Use
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add to document queue</TooltipContent>
          </Tooltip>
        </div>
      )}
    </Card>
  );
};

export default TemplateCard;
