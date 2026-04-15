import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Mail, MessageSquare, Phone, UserPlus } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onTransfer: (data: { name: string; contact: string; method: string; message?: string }) => void;
}

export default function TransferDocumentDialog({ open, onClose, onTransfer }: Props) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [method, setMethod] = useState('email');
  const [message, setMessage] = useState('');

  const contactLabel = method === 'email' ? 'Email address' : 'Phone number';
  const contactPlaceholder = method === 'email' ? 'name@company.com' : '+1 (555) 000-0000';

  const isValid = name.trim() && contact.trim();

  const handleTransfer = () => {
    if (isValid) {
      onTransfer({ name: name.trim(), contact: contact.trim(), method, message: message.trim() || undefined });
      setName('');
      setContact('');
      setMethod('email');
      setMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            Transfer to Another Signer
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Transfer this signing request to someone else. They will receive an invitation to sign in your place.
          </p>

          <div className="space-y-2">
            <Label htmlFor="transfer-name">Full name</Label>
            <Input
              id="transfer-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>

          <div className="space-y-2">
            <Label>Send via</Label>
            <ToggleGroup type="single" value={method} onValueChange={v => v && setMethod(v)} className="justify-start">
              <ToggleGroupItem value="email" className="gap-1.5 text-xs px-3">
                <Mail size={14} /> Email
              </ToggleGroupItem>
              <ToggleGroupItem value="whatsapp" className="gap-1.5 text-xs px-3">
                <MessageSquare size={14} /> WhatsApp
              </ToggleGroupItem>
              <ToggleGroupItem value="sms" className="gap-1.5 text-xs px-3">
                <Phone size={14} /> SMS
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-contact">{contactLabel}</Label>
            <Input
              id="transfer-contact"
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder={contactPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-message">Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="transfer-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Hi Jane, could you please review and sign this on my behalf?"
              className="min-h-[70px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!isValid} onClick={handleTransfer}>
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
