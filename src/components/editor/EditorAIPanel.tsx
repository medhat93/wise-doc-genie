import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AiIcon from "@/components/AiIcon";
import { FileText, Search, MessageCircleQuestion, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEditorContext } from "./EditorContext";

const MOCK_DRAFTS: Record<string, string> = {
  "Sales Proposal": `SALES PROPOSAL\n\nPrepared for: [Client Name]\nPrepared by: [Company Name]\nDate: February 2025\n\n1. Executive Summary\n\nWe are pleased to present this proposal outlining our comprehensive solution designed to address your organization's specific needs.\n\n2. Proposed Solution\n\nOur team will deliver the following key components:\n- Strategic assessment and gap analysis\n- Custom implementation roadmap\n- Full deployment and integration support\n- Ongoing optimization and support\n\n3. Pricing Structure\n\nThe investment for this engagement is structured as follows...`,
  default: `DOCUMENT DRAFT\n\nThis is an AI-generated draft based on your document type and requirements.\n\n1. Overview\n\nThis section provides a high-level summary of the document's purpose and scope.\n\n2. Key Terms\n\nThe following terms and conditions apply to this agreement...\n\n3. Next Steps\n\nPlease review this draft and make any necessary modifications before finalizing.`,
};

const MOCK_AI_RESPONSES: Record<string, string> = {
  default: "Based on the selected text, this clause establishes the standard terms for the agreement. The language is fairly standard for this type of contract. Would you like me to suggest any modifications or clarify specific aspects?",
  termination: "This termination clause allows either party to end the agreement with 30 days written notice. This is a standard provision, though you may want to consider adding specific conditions under which immediate termination is permitted, such as material breach or insolvency.",
  payment: "The payment terms specify NET-30 from the invoice date. This is standard for B2B agreements. Consider whether you want to add late payment penalties or early payment discounts.",
  liability: "This limitation of liability clause caps damages at the total fees paid in the 12 months preceding the claim. This is a common approach, but you should verify it aligns with your risk tolerance and applicable law.",
};

const QUICK_ACTIONS = [
  { id: "draft", label: "Draft document", icon: FileText, active: true },
  { id: "review", label: "Review document", icon: Search, active: false },
  { id: "ask", label: "Ask about document", icon: MessageCircleQuestion, active: false },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  selectedText?: string;
}

interface EditorAIPanelProps {
  docType?: string;
}

const EditorAIPanel = ({ docType = "" }: EditorAIPanelProps) => {
  const { pendingAiQuestion, setPendingAiQuestion } = useEditorContext();
  const [activeAction, setActiveAction] = useState("draft");
  const [streamedText, setStreamedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Handle pending AI question from text selection
  useEffect(() => {
    if (pendingAiQuestion) {
      setActiveAction("ask");
      // Add the user's question with context
      const userMessage: ChatMessage = {
        role: "user",
        content: pendingAiQuestion.question,
        selectedText: pendingAiQuestion.selectedText,
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setPendingAiQuestion(null);
      // Simulate AI response
      simulateAiResponse(pendingAiQuestion.question, pendingAiQuestion.selectedText);
    }
  }, [pendingAiQuestion, setPendingAiQuestion]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const simulateAiResponse = (question: string, selectedText?: string) => {
    setIsChatStreaming(true);
    const lowerQ = (question + " " + (selectedText || "")).toLowerCase();
    let responseKey = "default";
    if (lowerQ.includes("terminat")) responseKey = "termination";
    else if (lowerQ.includes("payment") || lowerQ.includes("pay")) responseKey = "payment";
    else if (lowerQ.includes("liabil")) responseKey = "liability";

    const fullResponse = MOCK_AI_RESPONSES[responseKey];
    let charIndex = 0;

    // Add empty assistant message
    setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const interval = setInterval(() => {
      charIndex += 3;
      if (charIndex >= fullResponse.length) {
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullResponse };
          return updated;
        });
        setIsChatStreaming(false);
        clearInterval(interval);
      } else {
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullResponse.slice(0, charIndex) };
          return updated;
        });
      }
    }, 20);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim() || isChatStreaming) return;
    const userMessage: ChatMessage = { role: "user", content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    const q = chatInput.trim();
    setChatInput("");
    simulateAiResponse(q);
  };

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
    if (activeAction === "draft") {
      const timer = startStream();
      return () => {
        clearTimeout(timer);
        if (streamRef.current) clearInterval(streamRef.current);
      };
    }
  }, [activeAction]);

  const handleRegenerate = () => {
    if (streamRef.current) clearInterval(streamRef.current);
    startStream();
  };

  const handleActionClick = (id: string) => {
    if (id === "review") {
      toast("AI Review coming soon", { description: "This feature is under development" });
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
        <div className={`h-2 w-2 rounded-full ml-1 ${
          activeAction === "ask"
            ? isChatStreaming ? "bg-primary animate-pulse" : "bg-emerald-500"
            : streamComplete ? "bg-emerald-500" : "bg-primary animate-pulse"
        }`} />
        <Badge variant="secondary" className="text-[10px] h-5 ml-auto">
          {activeAction === "ask"
            ? isChatStreaming ? "Thinking" : "Ready"
            : streamComplete ? "Ready" : isAnalyzing ? "Analyzing" : "Generating"
          }
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

      {/* Content area */}
      {activeAction === "ask" ? (
        <>
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto mb-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageCircleQuestion size={24} className="text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Ask about your document</p>
                <p className="text-xs text-muted-foreground/70">Select text and click Ask AI, or type a question below</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.selectedText && (
                  <div className="max-w-[90%] mb-1 px-2.5 py-1.5 rounded-md bg-muted/50 border border-border text-[11px] text-muted-foreground italic line-clamp-2">
                    "{msg.selectedText}"
                  </div>
                )}
                <div className={`max-w-[90%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground border border-border"
                }`}>
                  {msg.content}
                  {msg.role === "assistant" && isChatStreaming && i === chatMessages.length - 1 && (
                    <span className="inline-block w-1 h-3 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="flex gap-2 flex-shrink-0">
            <Input
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleChatSubmit(); }}
              placeholder="Ask about this document..."
              className="text-xs h-9"
              disabled={isChatStreaming}
            />
            <Button
              size="sm"
              className="h-9 w-9 p-0 shrink-0"
              disabled={!chatInput.trim() || isChatStreaming}
              onClick={handleChatSubmit}
            >
              <Send size={14} />
            </Button>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default EditorAIPanel;
