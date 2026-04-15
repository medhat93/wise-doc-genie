import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEditorContext } from "./EditorContext";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import {
  X,
  Plus,
  FileText,
  AlertTriangle,
  Check,
  Loader2,
  Paperclip,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ── Mock documents ── */
const MOCK_DOCUMENTS = [
  { id: "d1", name: "Master Services Agreement 2026.pdf", type: "Primary", pages: 12 },
  { id: "d2", name: "Appendix A — Statement of Work.pdf", type: "Supplement", pages: 4 },
];

const TYPE_BADGE: Record<string, string> = {
  Primary: "bg-primary/10 text-primary border-primary/20",
  Supplement: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
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

/* ── Participant chip ── */
const ParticipantChip = ({
  name,
  email,
  color,
  hasFields,
  role,
}: {
  name: string;
  email: string;
  color: string;
  hasFields: boolean;
  role: string;
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");
  const needsWarning = !hasFields && role !== "viewer";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full pl-0.5 pr-2.5 py-0.5 text-xs font-medium border transition-colors",
            needsWarning
              ? "border-amber-400/60 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
              : "border-border bg-muted/40 text-foreground"
          )}
        >
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
          <span className="truncate max-w-[120px]">{name}</span>
          {needsWarning && <AlertTriangle size={10} className="text-amber-500 shrink-0" />}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p>{email}</p>
        {needsWarning && (
          <p className="text-amber-500 mt-0.5">No signature fields assigned</p>
        )}
      </TooltipContent>
    </Tooltip>
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
  const { participants, placedFields } = useEditorContext();
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [ccEmails, setCcEmails] = useState("");
  const [subject, setSubject] = useState("Untitled Document");
  const [message, setMessage] = useState(
    "Hi,\n\nPlease review and sign the attached document(s).\n\nThank you,\nAhmed Al-Rashid"
  );

  const fieldsByParticipant = participants.map((p) => ({
    ...p,
    fieldCount: placedFields.filter((f) => f.participantId === p.id).length,
  }));

  const signersWithoutFields = fieldsByParticipant.filter(
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* ── Header ── */}
          <DialogHeader className="px-5 pt-5 pb-0">
            <DialogTitle className="text-base font-semibold">Send for signature</DialogTitle>
          </DialogHeader>

          {/* ── Email-like body ── */}
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-3 space-y-0">

            {/* To field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                {!showCc && (
                  <button
                    onClick={() => setShowCc(true)}
                    className="text-[10px] font-medium text-primary hover:underline"
                  >
                    + Cc
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[32px] rounded-md border bg-background px-2 py-1.5">
                {participants.length === 0 ? (
                  <span className="text-xs text-muted-foreground py-0.5">No participants added</span>
                ) : (
                  fieldsByParticipant.map((p) => (
                    <ParticipantChip
                      key={p.id}
                      name={p.name}
                      email={p.email}
                      color={p.color}
                      hasFields={p.fieldCount > 0}
                      role={p.role}
                    />
                  ))
                )}
              </div>
              {signersWithoutFields.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={11} />
                  <span className="text-[11px]">
                    {signersWithoutFields.length} signer{signersWithoutFields.length !== 1 ? "s" : ""} without signature fields
                  </span>
                </div>
              )}
            </div>

            {/* Cc field */}
            <AnimatePresence>
              {showCc && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Cc</label>
                      <button
                        onClick={() => { setShowCc(false); setCcEmails(""); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <Input
                      value={ccEmails}
                      onChange={(e) => setCcEmails(e.target.value)}
                      placeholder="email@example.com, ..."
                      className="h-8 text-xs"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="border-b my-3" />

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-8 text-sm border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>

            {/* Message */}
            <div className="pt-3 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-sm min-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 px-0"
                placeholder="Write a message to the recipients..."
              />
            </div>

            {/* Divider */}
            <div className="border-b my-3" />

            {/* Attachments (documents) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Paperclip size={12} className="text-muted-foreground" />
                <label className="text-xs font-medium text-muted-foreground">
                  Attached documents ({MOCK_DOCUMENTS.length})
                </label>
              </div>
              <div className="space-y-1">
                {MOCK_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-md bg-muted/40 border px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium truncate">{doc.name}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] px-1.5 h-4 shrink-0", TYPE_BADGE[doc.type])}
                      >
                        {doc.type}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {doc.pages} pages
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t px-5 py-3 flex items-center justify-between flex-shrink-0 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground h-8"
              onClick={() => toast("Settings dialog coming soon")}
            >
              <HugeiconsIcon icon={Settings02Icon} size={12} />
              Advanced settings
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-8"
                disabled={participants.length === 0 || sending}
                onClick={handleSend}
              >
                {sending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={SentIcon} size={13} />
                )}
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showSuccess && <SuccessOverlay participantCount={participants.length} />}
      </AnimatePresence>
    </>
  );
};

export default ReviewSendDialog;
