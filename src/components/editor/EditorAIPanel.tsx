import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AiIcon from "@/components/AiIcon";
import { FileText, Search, MessageCircleQuestion, Send, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEditorContext } from "./EditorContext";
import type { AiSuggestion, Comment } from "./EditorContext";

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

const EDIT_KEYWORDS = ["change", "rewrite", "update", "modify", "add a clause", "remove", "rephrase", "replace", "insert", "edit", "revise", "add a section", "delete"];

const QUICK_ACTIONS = [
  { id: "draft", label: "Draft document", icon: FileText, active: true },
  { id: "review", label: "Review document", icon: Search, active: false },
  { id: "ask", label: "Ask about document", icon: MessageCircleQuestion, active: false },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  selectedText?: string;
  hasSuggestions?: boolean;
}

interface EditorAIPanelProps {
  docType?: string;
}

const EditorAIPanel = ({ docType = "" }: EditorAIPanelProps) => {
  const { pendingAiQuestion, setPendingAiQuestion, aiSuggestions, setAiSuggestions, setComments } = useEditorContext();
  const [activeAction, setActiveAction] = useState("draft");
  const [streamedText, setStreamedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const pendingSuggestions = aiSuggestions.filter(s => s.status === "pending");

  useEffect(() => {
    if (pendingAiQuestion) {
      setActiveAction("ask");
      setQuotedText(pendingAiQuestion.selectedText || null);
      setChatInput("");
      setPendingAiQuestion(null);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [pendingAiQuestion, setPendingAiQuestion]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const isEditRequest = (text: string) => {
    const lower = text.toLowerCase();
    return EDIT_KEYWORDS.some(kw => lower.includes(kw));
  };

  const handleAiResponse = (question: string, selectedText?: string) => {
    setIsChatStreaming(true);
    const isEdit = isEditRequest(question);

    if (isEdit) {
      // Generate mock suggestions
      const mockSuggestions: AiSuggestion[] = [
        {
          id: `ai-s-${Date.now()}-1`,
          type: "addition",
          sectionRef: "Section 2: Scope of Services",
          newText: "2.1 Data Protection. The Service Provider shall implement and maintain appropriate technical and organizational measures to ensure the security and confidentiality of all personal data processed in connection with the Services, in compliance with applicable data protection laws including GDPR and local regulations.",
          status: "pending",
        },
        {
          id: `ai-s-${Date.now()}-2`,
          type: "replacement",
          sectionRef: "Section 5: Termination",
          oldText: "Either party may terminate this Agreement with thirty (30) days' prior written notice.",
          newText: "Either party may terminate this Agreement with sixty (60) days' prior written notice. In the event of a material breach, the non-breaching party may terminate immediately upon written notice.",
          status: "pending",
        },
      ];

      setAiSuggestions(prev => [...prev, ...mockSuggestions]);

      // Add AI comment annotations
      mockSuggestions.forEach(s => {
        const newComment: Comment = {
          id: `ai-c-${s.id}`,
          author: "AI Assistant",
          authorInitials: "AI",
          authorColor: "#7C3AED",
          text: s.type === "addition"
            ? `Suggested adding a new clause about data protection after this section`
            : `Suggested replacing the termination notice period`,
          timestamp: new Date(),
          sectionRef: s.sectionRef,
          docId: "doc-1",
          status: "open",
          replies: [],
          type: "inline",
          annotationType: "ai_suggestion",
          suggestedText: s.newText,
        };
        setComments(prev => [newComment, ...prev]);
      });

      const response = `I've added ${mockSuggestions.length} suggestions to the document. Review them inline and accept or reject each one.`;
      let charIndex = 0;
      setChatMessages((prev) => [...prev, { role: "assistant", content: "", hasSuggestions: true }]);
      const interval = setInterval(() => {
        charIndex += 3;
        if (charIndex >= response.length) {
          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: response, hasSuggestions: true };
            return updated;
          });
          setIsChatStreaming(false);
          clearInterval(interval);
        } else {
          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: response.slice(0, charIndex), hasSuggestions: true };
            return updated;
          });
        }
      }, 20);
    } else {
      // Normal Q&A response
      const lowerQ = (question + " " + (selectedText || "")).toLowerCase();
      let responseKey = "default";
      if (lowerQ.includes("terminat")) responseKey = "termination";
      else if (lowerQ.includes("payment") || lowerQ.includes("pay")) responseKey = "payment";
      else if (lowerQ.includes("liabil")) responseKey = "liability";

      const fullResponse = MOCK_AI_RESPONSES[responseKey];
      let charIndex = 0;
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
    }
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim() || isChatStreaming) return;
    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
      selectedText: quotedText || undefined,
    };
    setChatMessages((prev) => [...prev, userMessage]);
    const q = chatInput.trim();
    const selText = quotedText || undefined;
    setChatInput("");
    setQuotedText(null);
    handleAiResponse(q, selText);
  };

  const handleAcceptAll = () => {
    setAiSuggestions(prev => prev.map(s => s.status === "pending" ? { ...s, status: "accepted" as const } : s));
    toast.success("All suggestions accepted");
  };

  const handleRejectAll = () => {
    setAiSuggestions(prev => prev.map(s => s.status === "pending" ? { ...s, status: "rejected" as const } : s));
    toast.success("All suggestions rejected");
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

      {activeAction === "ask" ? (
        <>
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
                  {msg.role === "assistant" && msg.hasSuggestions && (
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles size={10} className="text-violet-600" />
                      <span className="text-[9px] text-violet-600 font-medium uppercase">Inline edits</span>
                    </div>
                  )}
                  {msg.content}
                  {msg.role === "assistant" && isChatStreaming && i === chatMessages.length - 1 && (
                    <span className="inline-block w-1 h-3 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
                {/* Accept/Reject all buttons after suggestion messages */}
                {msg.role === "assistant" && msg.hasSuggestions && !isChatStreaming && pendingSuggestions.length > 0 && i === chatMessages.length - 1 && (
                  <div className="max-w-[90%] mt-1.5 space-y-1 w-full">
                    <Button size="sm" className="w-full h-7 text-[10px]" onClick={handleAcceptAll}>
                      Accept all suggestions
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full h-7 text-[10px]" onClick={handleRejectAll}>
                      Reject all suggestions
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

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
