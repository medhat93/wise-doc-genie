import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AiIcon from "@/components/AiIcon";
import { FileText, Search, MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";

const MOCK_DRAFTS: Record<string, string> = {
  "Sales Proposal": `SALES PROPOSAL\n\nPrepared for: [Client Name]\nPrepared by: [Company Name]\nDate: February 2025\n\n1. Executive Summary\n\nWe are pleased to present this proposal outlining our comprehensive solution designed to address your organization's specific needs.\n\n2. Proposed Solution\n\nOur team will deliver the following key components:\n- Strategic assessment and gap analysis\n- Custom implementation roadmap\n- Full deployment and integration support\n- Ongoing optimization and support\n\n3. Pricing Structure\n\nThe investment for this engagement is structured as follows...`,
  default: `DOCUMENT DRAFT\n\nThis is an AI-generated draft based on your document type and requirements.\n\n1. Overview\n\nThis section provides a high-level summary of the document's purpose and scope.\n\n2. Key Terms\n\nThe following terms and conditions apply to this agreement...\n\n3. Next Steps\n\nPlease review this draft and make any necessary modifications before finalizing.`,
};

const QUICK_ACTIONS = [
  { id: "draft", label: "Draft document", icon: FileText, active: true },
  { id: "review", label: "Review document", icon: Search, active: false },
  { id: "ask", label: "Ask about document", icon: MessageCircleQuestion, active: false },
];

interface EditorAIPanelProps {
  docType?: string;
}

const EditorAIPanel = ({ docType = "" }: EditorAIPanelProps) => {
  const [activeAction, setActiveAction] = useState("draft");
  const [streamedText, setStreamedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStream = () => {
    setIsAnalyzing(true);
    setIsStreaming(false);
    setStreamComplete(false);
    setStreamedText("");

    const timer = setTimeout(() => {
      setIsAnalyzing(false);
      setIsStreaming(true);

      const draftKey = Object.keys(MOCK_DRAFTS).find((k) =>
        docType.toLowerCase().includes(k.toLowerCase())
      ) || "default";
      const fullText = MOCK_DRAFTS[draftKey];
      let charIndex = 0;

      streamRef.current = setInterval(() => {
        charIndex += 2;
        if (charIndex >= fullText.length) {
          setStreamedText(fullText);
          setIsStreaming(false);
          setStreamComplete(true);
          if (streamRef.current) clearInterval(streamRef.current);
        } else {
          setStreamedText(fullText.slice(0, charIndex));
        }
      }, 30);
    }, 2000);

    return timer;
  };

  useEffect(() => {
    const timer = startStream();
    return () => {
      clearTimeout(timer);
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, []);

  const handleRegenerate = () => {
    if (streamRef.current) clearInterval(streamRef.current);
    startStream();
  };

  const handleActionClick = (id: string) => {
    if (id === "review") {
      toast("AI Review coming soon", { description: "This feature is under development" });
      return;
    }
    if (id === "ask") {
      toast("AI Q&A coming soon", { description: "This feature is under development" });
      return;
    }
    setActiveAction(id);
  };

  return (
    <div className="flex flex-col h-full -m-4 p-4">
      {/* Status header */}
      <div className="flex items-center gap-2 mb-4">
        <AiIcon size={16} />
        <span className="text-sm font-medium">AI Assistant</span>
        <div className={`h-2 w-2 rounded-full ml-1 ${streamComplete ? "bg-emerald-500" : "bg-primary animate-pulse"}`} />
        <Badge variant="secondary" className="text-[10px] h-5 ml-auto">
          {streamComplete ? "Ready" : isAnalyzing ? "Analyzing" : "Generating"}
        </Badge>
      </div>

      {/* Quick action chips */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeAction === action.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={12} />
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Draft content */}
      <div className="flex-1 overflow-y-auto mb-4">
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Analyzing your requirements...
          </div>
        )}
        {(isStreaming || streamComplete) && (
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">
            {streamedText}
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
            )}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <Button variant="default" size="sm" className="flex-1" disabled={!streamComplete}>
          Accept Draft
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={isStreaming || isAnalyzing}
          onClick={handleRegenerate}
        >
          Regenerate
        </Button>
      </div>
    </div>
  );
};

export default EditorAIPanel;
