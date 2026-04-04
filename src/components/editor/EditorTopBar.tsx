import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserAdd01Icon,
  Settings02Icon,
  MoreHorizontalIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EditorTopBar = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Document");

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-card">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => navigate("/")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-[200px] text-sm font-semibold border-none shadow-none focus-visible:ring-0 bg-transparent h-8"
        />
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium text-muted-foreground">
          Draft
        </Badge>
      </div>

      {/* Center — Step indicator */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <HugeiconsIcon icon={Tick01Icon} size={12} className="text-primary-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">Add Documents</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">2</span>
          </div>
          <span className="text-xs font-medium text-foreground">Prepare & Send</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 flex-1 justify-end">
        <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-8 text-xs">
          <HugeiconsIcon icon={UserAdd01Icon} size={14} />
          Assign
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HugeiconsIcon icon={Settings02Icon} size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Export PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" className="h-8 text-xs ml-1">
              Send
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send for signature</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default EditorTopBar;
