import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEditorContext, type AcknowledgmentLevel } from "./EditorContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import {
  ChevronDown,
  FileText,
  Eye,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ── Mock documents data ── */
const MOCK_DOCUMENTS = [
  { id: "d1", name: "Master Services Agreement 2026.pdf", type: "Primary", pages: 12 },
  { id: "d2", name: "Appendix A — Statement of Work.pdf", type: "Supplement", pages: 4 },
];

const TYPE_BADGE: Record<string, string> = {
  Primary: "bg-primary/10 text-primary border-primary/20",
  Supplement: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Attachment: "bg-muted text-muted-foreground border-border",
};

/* ── Collapsible section ── */
const Section = ({
  title,
  defaultOpen = true,
  children,
  warning,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  warning?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full group">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      {warning && (
        <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 dark:text-amber-400">
          <AlertTriangle size={12} />
          <span className="text-xs">{warning}</span>
        </div>
      )}
      <CollapsibleContent className="mt-3 space-y-2">{children}</CollapsibleContent>
    </Collapsible>
  );
};

/* ── Success overlay ── */
const SuccessOverlay = ({ participantCount }: { participantCount: number }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/?sent=true"), 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
    >
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="mx-auto h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
        >
          <Check size={36} className="text-emerald-600" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Document sent!</h2>
          <p className="text-muted-foreground mt-1">
            Your document has been sent to {participantCount} participant{participantCount !== 1 ? "s" : ""} for signing.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => toast("Status page coming soon")}>
            View status
          </Button>
          <Button onClick={() => navigate("/?sent=true")}>Go to workspace</Button>
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════ MAIN DIALOG ══════════ */
const ReviewSendDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const navigate = useNavigate();
  const { participants, placedFields, documentAcknowledgments } = useEditorContext();
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ccEmails, setCcEmails] = useState("");
  const [subject, setSubject] = useState("Untitled Document");
  const [message, setMessage] = useState(
    "Hi,\n\nCan you please review and sign this document?\n\nThank you, Ahmed Al-Rashid"
  );

  const signers = participants.filter((p) => p.role === "signer");
  const approvers = participants.filter((p) => p.role === "approver");
  const viewers = participants.filter((p) => p.role === "viewer");
  const hasSequential = participants.some((p) => p.order > 0);

  // Field counts per participant
  const fieldsByParticipant = participants.map((p) => ({
    ...p,
    fieldCount: placedFields.filter((f) => f.participantId === p.id).length,
  }));
  const noFieldParticipants = fieldsByParticipant.filter(
    (p) => p.fieldCount === 0 && p.role !== "viewer"
  );

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onOpenChange(false);
      setShowSuccess(true);
    }, 1000);
  };

  const ParticipantRow = ({ p }: { p: (typeof participants)[0] }) => (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {hasSequential && p.role === "signer" && (
          <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-mono">
            {p.order}
          </Badge>
        )}
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
          style={{ backgroundColor: p.color }}
        >
          {p.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <span className="text-sm font-medium">{p.name}</span>
      </div>
      <span className="text-xs text-muted-foreground">{p.email}</span>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Review & send</DialogTitle>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ── Recipients ── */}
            <Section
              title="Recipients"
              warning={
                participants.length === 0
                  ? "No participants added. Add at least one participant before sending."
                  : undefined
              }
            >
              {signers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Signers</p>
                  {signers.map((p) => (
                    <ParticipantRow key={p.id} p={p} />
                  ))}
                </div>
              )}
              {approvers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Approvers</p>
                  {approvers.map((p) => (
                    <ParticipantRow key={p.id} p={p} />
                  ))}
                </div>
              )}
              {viewers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Viewers</p>
                  {viewers.map((p) => (
                    <ParticipantRow key={p.id} p={p} />
                  ))}
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Send a copy to</p>
                <Input
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="Email"
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can use a comma to separate multiple emails
                </p>
              </div>
            </Section>

            {/* ── Documents ── */}
            <Section title="Documents">
              {MOCK_DOCUMENTS.map((doc) => (
                <div key={doc.id} className="space-y-1 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-muted-foreground" />
                      <span className="text-sm">{doc.name}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 h-5", TYPE_BADGE[doc.type])}
                      >
                        {doc.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{doc.pages} pages</span>
                  </div>
                </div>
              ))}
            </Section>


            {/* ── Message to recipients ── */}
            <Section title="Message to recipients">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="text-sm mt-1 min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This message will be included in the signing invitation email
                  </p>
                </div>
              </div>
            </Section>

          </div>

          {/* ── Footer ── */}
          <div className="border-t p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Back
              </Button>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => toast("Settings dialog coming soon")}>
                <HugeiconsIcon icon={Settings02Icon} size={12} />
                Advanced settings
              </Button>
            </div>
            <Button
              className="gap-1.5"
              disabled={participants.length === 0 || sending}
              onClick={handleSend}
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={SentIcon} size={14} />
              )}
              {sending ? "Sending..." : "Send now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && <SuccessOverlay participantCount={participants.length} />}
      </AnimatePresence>
    </>
  );
};

export default ReviewSendDialog;
