import React, { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const QUICK_CHIPS = [
  "Summarize this contract",
  "When does it expire?",
  "What are the key terms?",
  "Who are the parties?",
];

const MOCK_RESPONSES: Record<string, { text: string; citations: string[] }> = {
  "Summarize this contract": {
    text: "This is a Master Services Agreement between Ahmad Medhat (Company) and the counterparty. It establishes the framework for professional services engagement, including scope of work definitions, payment terms (Net 30), confidentiality obligations, and intellectual property rights. The agreement has a 12-month initial term with automatic renewal.",
    citations: ["p.1", "p.3", "p.5"],
  },
  "When does it expire?": {
    text: "The agreement has an initial term of 12 months from the effective date. It includes an auto-renewal clause that extends the term for successive 12-month periods unless either party provides 30 days written notice before the end of the current term.",
    citations: ["p.7"],
  },
  "What are the key terms?": {
    text: "Key terms include: (1) Payment terms of Net 30 days from invoice date, (2) Mutual confidentiality obligations surviving 3 years post-termination, (3) Liability cap equal to fees paid in the preceding 12 months, (4) Governing law under Saudi Arabian jurisdiction, (5) 30-day cure period for material breach.",
    citations: ["p.2", "p.4", "p.6"],
  },
  "Who are the parties?": {
    text: "The parties to this agreement are Ahmad Medhat representing the Company as the service provider, and the counterparty organization as the client. Additional signatories include designated representatives from both organizations.",
    citations: ["p.1"],
  },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
}

export default function DocumentViewAIPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleChip = (chip: string) => {
    const response = MOCK_RESPONSES[chip] || { text: "I'll analyze this document for you.", citations: [] };
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: chip },
      { id: `a-${Date.now()}`, role: "assistant", text: response.text, citations: response.citations },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: input },
      { id: `a-${Date.now()}`, role: "assistant", text: "I've analyzed the document. Based on the content, the relevant sections address your query in detail. Please refer to the highlighted sections.", citations: ["p.2", "p.4"] },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-violet-500" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <p className="text-xs text-muted-foreground">Ask questions about this document</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg border border-violet-200 bg-violet-50/50 hover:bg-violet-100/50 transition-colors text-violet-700"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : ""}>
            <div className={msg.role === "user" ? "bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm max-w-[85%]" : "bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 text-sm max-w-[95%]"}>
              <p className="leading-relaxed">{msg.text}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {msg.citations.map((c) => (
                    <Badge key={c} variant="secondary" className="text-[9px] h-4 px-1.5 bg-violet-100 text-violet-600 hover:bg-violet-200 cursor-pointer">
                      [{c}]
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this document..."
            className="flex-1 h-9 text-sm border rounded-lg px-3 bg-background outline-none focus:ring-1 focus:ring-ring"
          />
          <Button size="sm" className="h-9 w-9 p-0" onClick={handleSend} disabled={!input.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
