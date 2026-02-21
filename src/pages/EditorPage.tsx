import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, AiGenerativeIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AiIcon from "@/components/AiIcon";

const MOCK_DRAFTS: Record<string, string> = {
  "Sales Proposal": `SALES PROPOSAL

Prepared for: [Client Name]
Prepared by: [Company Name]
Date: February 2025

1. Executive Summary

We are pleased to present this proposal outlining our comprehensive solution designed to address your organization's specific needs. Our approach combines industry-leading technology with proven methodologies to deliver measurable results.

2. Proposed Solution

Our team will deliver the following key components:
- Strategic assessment and gap analysis
- Custom implementation roadmap
- Full deployment and integration support
- Ongoing optimization and support

3. Pricing Structure

The investment for this engagement is structured as follows...`,

  "Non-Disclosure Agreement": `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of [Date] by and between:

Party A: [Company/Individual Name]
Party B: [Company/Individual Name]

1. Purpose

The parties wish to explore a potential business relationship regarding [Business Purpose]. In connection with this opportunity, each party may disclose confidential information to the other party.

2. Definition of Confidential Information

"Confidential Information" means any data or information that is proprietary to the disclosing party...`,

  "Service Contract": `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of [Start Date] between:

Service Provider: [Provider Name]
Client: [Client Name]

1. Scope of Services

The Service Provider agrees to perform the following services:
- [Service Description]
- [Deliverable 1]
- [Deliverable 2]

2. Payment Terms

Client shall pay Service Provider according to the following schedule...`,

  "Employment Offer Letter": `EMPLOYMENT OFFER LETTER

[Company Name]
[Company Address]

Dear [Candidate Name],

We are pleased to extend an offer of employment for the position of [Job Title] at [Company Name].

Position Details:
- Title: [Job Title]
- Department: [Department]
- Start Date: [Date]
- Employment Type: [Full-time / Part-time]

Compensation:
- Base Salary: $[Amount] per year
- Benefits: Health, dental, vision insurance...`,

  "Consulting Agreement": `CONSULTING AGREEMENT

This Consulting Agreement ("Agreement") is effective as of [Date] between:

Consultant: [Consultant Name/Firm]
Client: [Client Company]

1. Engagement Scope

The Consultant shall provide consulting services in the area of [Consulting Area], including:
- Strategic advisory and recommendations
- Analysis and deliverable preparation
- Stakeholder presentations

2. Fee Structure

The Consultant shall be compensated at a rate of...`,
};

const EditorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAI = searchParams.get("ai") === "true";
  const docType = searchParams.get("type") || "";
  const [title, setTitle] = useState("Untitled Document");
  const [streamedText, setStreamedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(showAI);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!showAI) return;

    // Analyzing phase
    const analyzeTimer = setTimeout(() => {
      setIsAnalyzing(false);
      setIsStreaming(true);

      // Find the closest matching draft
      const draftKey = Object.keys(MOCK_DRAFTS).find((k) =>
        docType.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(docType.toLowerCase())
      ) || Object.keys(MOCK_DRAFTS)[0];

      const fullText = MOCK_DRAFTS[draftKey] || MOCK_DRAFTS["Sales Proposal"];
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

    return () => {
      clearTimeout(analyzeTimer);
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, [showAI, docType]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1.5"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Back to Documents
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-[280px] text-center font-semibold border-none shadow-none focus-visible:ring-0 bg-transparent"
        />
        <Button size="sm">Save</Button>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        <div className={`flex-1 overflow-y-auto p-8 ${showAI ? "border-r" : ""}`}>
          <div className="max-w-2xl mx-auto">
            <div className="min-h-[600px] bg-background border rounded-lg p-8 shadow-sm">
              <div className="w-1 h-5 bg-foreground animate-pulse" />
            </div>
          </div>
        </div>

        {/* AI Draft panel */}
        {showAI && (
          <div className="w-[380px] flex flex-col bg-muted/30 flex-shrink-0">
            <div className="h-12 px-4 flex items-center gap-2 border-b flex-shrink-0">
              <AiIcon size={16} />
              <span className="font-semibold text-sm">AI Draft</span>
              <div className={`h-2 w-2 rounded-full ml-1 ${
                streamComplete ? "bg-emerald-500" : "bg-primary animate-pulse"
              }`} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
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

            <div className="p-4 border-t flex gap-2 flex-shrink-0">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                disabled={!streamComplete}
              >
                Accept Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isStreaming || isAnalyzing}
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
