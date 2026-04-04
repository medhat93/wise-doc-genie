import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table,
  Link,
  Image,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const toolbarItems = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Underline, label: "Underline" },
  "sep",
  { icon: AlignLeft, label: "Align Left" },
  { icon: AlignCenter, label: "Align Center" },
  { icon: AlignRight, label: "Align Right" },
  "sep",
  { icon: List, label: "Bullet List" },
  { icon: ListOrdered, label: "Numbered List" },
  "sep",
  { icon: Table, label: "Table" },
  { icon: Link, label: "Link" },
  { icon: Image, label: "Image" },
] as const;

interface EditorCanvasProps {
  showToolbar?: boolean;
}

const EditorCanvas = ({ showToolbar = true }: EditorCanvasProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      {showToolbar && (
        <div className="h-10 border-b bg-card flex items-center px-3 gap-0.5 flex-shrink-0 overflow-x-auto">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
            Heading 1
            <ChevronDown size={12} />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          {toolbarItems.map((item, i) =>
            item === "sep" ? (
              <Separator key={i} orientation="vertical" className="h-5 mx-1" />
            ) : (
              <Button key={i} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <item.icon size={14} />
              </Button>
            )
          )}
        </div>
      )}

      {/* Document canvas */}
      <div className="flex-1 overflow-y-auto bg-muted/20 p-6 md:p-10">
        <div className="max-w-[816px] mx-auto bg-card shadow-sm border rounded-sm min-h-[1056px] p-12 md:p-16">
          <h1 className="text-2xl font-bold text-foreground mb-1">Master Services Agreement</h1>
          <p className="text-xs text-muted-foreground mb-8">Effective Date: April 4, 2026</p>

          <p className="text-sm leading-relaxed text-foreground/90 mb-6">
            This Master Services Agreement ("Agreement") is entered into by and between the parties
            identified below. This Agreement sets forth the terms and conditions under which the
            Service Provider shall provide services to the Client.
          </p>

          <h2 className="text-base font-semibold text-foreground mt-8 mb-3">1. Definitions</h2>
          <p className="text-sm leading-relaxed text-foreground/80 mb-4">
            "Services" means the professional services described in each Statement of Work executed
            under this Agreement. "Deliverables" means all work product, reports, and materials
            produced by the Service Provider in connection with the Services.
          </p>

          <h2 className="text-base font-semibold text-foreground mt-8 mb-3">2. Scope of Services</h2>
          <p className="text-sm leading-relaxed text-foreground/80 mb-4">
            The Service Provider agrees to perform the Services as described in one or more Statements
            of Work to be mutually agreed upon and executed by both parties. Each Statement of Work
            shall specify the scope, timeline, deliverables, and fees for the applicable Services.
          </p>

          <h2 className="text-base font-semibold text-foreground mt-8 mb-3">3. Payment Terms</h2>
          <p className="text-sm leading-relaxed text-foreground/80 mb-4">
            Client shall pay the Service Provider the fees set forth in each Statement of Work. Unless
            otherwise specified, invoices shall be issued monthly and are due within thirty (30) days
            of the invoice date. Late payments shall accrue interest at the rate of 1.5% per month.
          </p>

          <h2 className="text-base font-semibold text-foreground mt-8 mb-3">4. Confidentiality</h2>
          <p className="text-sm leading-relaxed text-foreground/80 mb-4">
            Each party agrees to hold in confidence all Confidential Information received from the
            other party. "Confidential Information" includes any non-public technical, business, or
            financial information disclosed by either party during the term of this Agreement.
          </p>

          <h2 className="text-base font-semibold text-foreground mt-8 mb-3">5. Term and Termination</h2>
          <p className="text-sm leading-relaxed text-foreground/80 mb-4">
            This Agreement shall commence on the Effective Date and continue for a period of twelve
            (12) months unless terminated earlier. Either party may terminate this Agreement with
            thirty (30) days' prior written notice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
