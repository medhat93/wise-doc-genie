import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, X } from "lucide-react";
import { toast } from "sonner";
import { useEditorContext } from "./EditorContext";
import type {
  Participant,
  ParticipantRole,
  SendingMethod,
  VerificationMethodType,
  VerificationSpecs,
} from "./EditorParticipantsPanel";

const COLORS = [
  "#4F46E5", "#DC2626", "#059669", "#D97706",
  "#7C3AED", "#0891B2", "#BE185D", "#65A30D",
];

const CONTACTS = [
  { name: "Ahmed Al-Rashid", email: "ahmed@signit.sa", phone: "+966 50 111 2222" },
  { name: "Sarah Johnson", email: "sarah@acme.com", phone: "+1 555 123 4567" },
  { name: "Adel Al-Dossary", email: "adel@enterprise.sa", phone: "+966 55 333 4444" },
  { name: "Mohammed Al-Faisal", email: "mohammed@legal.sa", phone: "+966 50 123 4567" },
  { name: "Fatima Al-Zahra", email: "fatima@company.com", phone: "+966 54 555 6666" },
  { name: "Ali Hassan", email: "ali@corp.sa", phone: "+966 56 777 8888" },
  { name: "Amal Khouri", email: "amal@design.sa", phone: "+966 50 999 0000" },
  { name: "David Chen", email: "david@company.com", phone: "+1 555 987 6543" },
];

const VERIFICATION_METHOD_LABELS: Record<VerificationMethodType, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  absher: "Absher",
  nafath_only: "Nafath only",
  nafath_digital: "Nafath & Digital certificate",
};

const VERIFICATION_SPECS_LABELS: Record<VerificationSpecs, { label: string; tooltip: string }> = {
  without_id: { label: "Without national ID", tooltip: "Signer verifies via Nafath app without pre-filled ID" },
  with_id: { label: "With national ID", tooltip: "Signer's national ID is pre-validated before Nafath prompt" },
  with_id_biometrics: { label: "With national ID & Biometrics", tooltip: "Highest security — requires national ID plus biometric verification via Nafath" },
};

const hasSpecs = (method?: VerificationMethodType) => method === "nafath_only" || method === "nafath_digital";
const needsNationalId = (method?: VerificationMethodType, specs?: VerificationSpecs) => {
  if (method === "absher") return true;
  if ((method === "nafath_only" || method === "nafath_digital") && (specs === "with_id" || specs === "with_id_biometrics")) return true;
  return false;
};
const showNafathBanner = (method?: VerificationMethodType) => method === "absher" || method === "nafath_only" || method === "nafath_digital";

interface FormState {
  role: ParticipantRole;
  language: "en" | "ar";
  sendingMethod: SendingMethod;
  name: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  needsVerification: boolean;
  verificationMethod: VerificationMethodType;
  verificationSpecs: VerificationSpecs;
  nationalId: string;
}

const INITIAL_FORM: FormState = {
  role: "signer",
  language: "en",
  sendingMethod: "email",
  name: "",
  email: "",
  phoneCode: "+966",
  phoneNumber: "",
  needsVerification: false,
  verificationMethod: "sms",
  verificationSpecs: "without_id",
  nationalId: "",
};

const participantToForm = (p: Participant): FormState => {
  const phoneCode = p.sendingPhone?.match(/^\+\d+/)?.[0] || "+966";
  const phoneNumber = p.sendingPhone?.replace(/^\+\d+\s*/, "") || "";
  return {
    role: p.role,
    language: p.language,
    sendingMethod: p.sendingMethod,
    name: p.name,
    email: p.email,
    phoneCode,
    phoneNumber,
    needsVerification: p.needsVerification,
    verificationMethod: p.verificationMethod || "sms",
    verificationSpecs: p.verificationSpecs || "without_id",
    nationalId: p.nationalId || "",
  };
};

const buildParticipant = (f: FormState, id: string, color: string, order: number): Participant => ({
  id,
  name: f.name.trim(),
  email: f.sendingMethod === "email" ? f.email.trim() : "",
  role: f.role,
  color,
  order: f.role === "signer" ? order : 0,
  language: f.language,
  sendingMethod: f.sendingMethod,
  sendingPhone: f.sendingMethod !== "email" ? `${f.phoneCode} ${f.phoneNumber}` : undefined,
  needsVerification: f.needsVerification,
  verificationMethod: f.needsVerification ? f.verificationMethod : undefined,
  verificationSpecs: f.needsVerification && hasSpecs(f.verificationMethod) ? f.verificationSpecs : undefined,
  nationalId: f.needsVerification && needsNationalId(f.verificationMethod, f.verificationSpecs) ? f.nationalId : undefined,
  phone: f.needsVerification && (f.verificationMethod === "sms" || f.verificationMethod === "whatsapp") && f.sendingMethod === "email"
    ? `${f.phoneCode} ${f.phoneNumber}` : undefined,
});

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editParticipant?: Participant | null;
  onAdded?: (participant: Participant) => void;
}

const AddParticipantDialog = ({ open, onOpenChange, editParticipant, onAdded }: AddParticipantDialogProps) => {
  const { participants, setParticipants } = useEditorContext();
  const [form, setForm] = useState<FormState>(editParticipant ? participantToForm(editParticipant) : INITIAL_FORM);

  const updateForm = (updates: Partial<FormState>) => setForm((prev) => ({ ...prev, ...updates }));

  // Reset form when dialog opens
  const handleOpenChange = (val: boolean) => {
    if (val) {
      setForm(editParticipant ? participantToForm(editParticipant) : INITIAL_FORM);
    }
    onOpenChange(val);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    if (editParticipant) {
      const updated = buildParticipant(form, editParticipant.id, editParticipant.color, editParticipant.order);
      if (updated.role === "signer") updated.order = editParticipant.order;
      setParticipants((prev) => prev.map((p) => (p.id === editParticipant.id ? updated : p)));
      toast.success("Participant updated");
    } else {
      const maxOrder = Math.max(0, ...participants.filter(p => p.role === "signer").map(p => p.order));
      const color = COLORS[participants.length % COLORS.length];
      const newP = buildParticipant(form, `p${Date.now()}`, color, maxOrder + 1);
      setParticipants((prev) => [...prev, newP]);
      onAdded?.(newP);
      toast.success(`${newP.name} added`);
    }

    setForm(INITIAL_FORM);
    onOpenChange(false);
  };

  const nameMatches = form.name.length >= 1
    ? CONTACTS.filter(c =>
        c.name.toLowerCase().includes(form.name.toLowerCase()) &&
        c.name.toLowerCase() !== form.name.toLowerCase()
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{editParticipant ? "Edit Participant" : "Add Participant"}</DialogTitle>
          <DialogDescription>
            {editParticipant ? "Update participant details." : "Add a new participant to the document."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Row 1: Role, Language, Sending method */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={form.role} onValueChange={(v) => updateForm({ role: v as ParticipantRole })}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="signer" className="text-xs">Signer</SelectItem>
                <SelectItem value="approver" className="text-xs">Approver</SelectItem>
                <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.language} onValueChange={(v) => updateForm({ language: v as "en" | "ar" })}>
              <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en" className="text-xs">English</SelectItem>
                <SelectItem value="ar" className="text-xs">Arabic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.sendingMethod} onValueChange={(v) => updateForm({ sendingMethod: v as SendingMethod })}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email" className="text-xs">Email</SelectItem>
                <SelectItem value="sms" className="text-xs">SMS</SelectItem>
                <SelectItem value="whatsapp" className="text-xs">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name with contact autocomplete */}
          <div className="relative">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              className="h-9 text-sm"
              autoComplete="off"
              autoFocus
            />
            {nameMatches.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 border rounded-lg bg-popover shadow-md max-h-[160px] overflow-y-auto">
                {nameMatches.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                    onClick={() => {
                      updateForm({
                        name: c.name,
                        email: c.email,
                        phoneNumber: c.phone.replace(/^\+\d+\s*/, ""),
                      });
                    }}
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-primary">
                        {c.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Email or Phone */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {form.sendingMethod === "email" ? "Email" : "Phone number"}
            </label>
            {form.sendingMethod === "email" ? (
              <Input
                placeholder="Email address"
                type="email"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                className="h-9 text-sm"
              />
            ) : (
              <div className="flex gap-1.5">
                <Select value={form.phoneCode} onValueChange={(v) => updateForm({ phoneCode: v })}>
                  <SelectTrigger className="h-9 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+966" className="text-xs">+966</SelectItem>
                    <SelectItem value="+1" className="text-xs">+1</SelectItem>
                    <SelectItem value="+44" className="text-xs">+44</SelectItem>
                    <SelectItem value="+971" className="text-xs">+971</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Phone number"
                  value={form.phoneNumber}
                  onChange={(e) => updateForm({ phoneNumber: e.target.value })}
                  className="h-9 text-sm flex-1"
                />
              </div>
            )}
          </div>

          {/* Verification section */}
          <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Identity verification</span>
              <Switch
                checked={form.needsVerification}
                onCheckedChange={(checked) => updateForm({
                  needsVerification: checked,
                  verificationMethod: "sms",
                  verificationSpecs: "without_id",
                  nationalId: "",
                })}
              />
            </div>

            {form.needsVerification && (
              <div className="space-y-3 animate-in slide-in-from-top-1 duration-150">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground mb-1 block">Method</label>
                    <Select
                      value={form.verificationMethod}
                      onValueChange={(v) => {
                        const method = v as VerificationMethodType;
                        updateForm({
                          verificationMethod: method,
                          verificationSpecs: "without_id",
                          nationalId: "",
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(VERIFICATION_METHOD_LABELS) as VerificationMethodType[]).map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">{VERIFICATION_METHOD_LABELS[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hasSpecs(form.verificationMethod) && (
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground mb-1 block">Specs</label>
                      <Select
                        value={form.verificationSpecs}
                        onValueChange={(v) => updateForm({ verificationSpecs: v as VerificationSpecs })}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(VERIFICATION_SPECS_LABELS) as VerificationSpecs[]).map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              <div className="flex items-center gap-1">
                                {VERIFICATION_SPECS_LABELS[s].label}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info size={10} className="text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-[200px] text-xs">
                                    {VERIFICATION_SPECS_LABELS[s].tooltip}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {needsNationalId(form.verificationMethod, form.verificationSpecs) && (
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">National ID</label>
                    <Input
                      placeholder="National ID number"
                      value={form.nationalId}
                      onChange={(e) => updateForm({ nationalId: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {(form.verificationMethod === "sms" || form.verificationMethod === "whatsapp") && form.sendingMethod === "email" && (
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Phone for verification</label>
                    <div className="flex gap-1.5">
                      <Select value={form.phoneCode} onValueChange={(v) => updateForm({ phoneCode: v })}>
                        <SelectTrigger className="h-8 w-[72px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+966" className="text-xs">+966</SelectItem>
                          <SelectItem value="+1" className="text-xs">+1</SelectItem>
                          <SelectItem value="+44" className="text-xs">+44</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Phone number"
                        value={form.phoneNumber}
                        onChange={(e) => updateForm({ phoneNumber: e.target.value })}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  </div>
                )}

                {showNafathBanner(form.verificationMethod) && (
                  <div className="flex items-start gap-2 rounded-lg p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed">
                      {form.verificationMethod === "absher"
                        ? "Absher service is available only for Saudi citizens or expats with an active Absher account."
                        : "Nafath service is available only for Saudi citizens or expats with an active Nafath account."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!form.name.trim()} onClick={handleSubmit}>
            {editParticipant ? "Save changes" : "Add participant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { COLORS };
export default AddParticipantDialog;
