import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudIcon, Loading02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DRIVE_PROVIDERS } from "@/types/document";
import { toast } from "@/hooks/use-toast";

interface DriveConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedProviders: Record<string, boolean>;
  onConnect: (providerId: string) => void;
  mode?: "connect" | "select";
  onSelectDrive?: (providerId: string) => void;
}

const DriveConnectDialog = ({
  open,
  onOpenChange,
  connectedProviders,
  onConnect,
  mode = "connect",
  onSelectDrive,
}: DriveConnectDialogProps) => {
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    setConnectingId(providerId);
    await new Promise((r) => setTimeout(r, 1500));
    onConnect(providerId);
    setConnectingId(null);
    toast({
      title: "Drive connected",
      description: `${DRIVE_PROVIDERS.find((p) => p.id === providerId)?.name} has been connected successfully.`,
    });
    onOpenChange(false);
  };

  const connectedDrives = DRIVE_PROVIDERS.filter((p) => connectedProviders[p.id]);
  const disconnectedDrives = DRIVE_PROVIDERS.filter((p) => !connectedProviders[p.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "select" ? "Choose a Drive" : "Connect a Drive"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {mode === "select" && connectedDrives.length > 0 && (
            <>
              {connectedDrives.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    onSelectDrive?.(provider.id);
                    onOpenChange(false);
                  }}
                >
                  <div className={`rounded-full p-2 ${provider.bgClass}`}>
                    <HugeiconsIcon icon={CloudIcon} size={18} className={provider.textClass} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Browse {provider.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-600">Connected</span>
                  </div>
                </div>
              ))}
              {disconnectedDrives.length > 0 && (
                <div className="pt-2 border-t mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Connect another drive</p>
                </div>
              )}
            </>
          )}

          {(mode === "connect" ? DRIVE_PROVIDERS : disconnectedDrives).map((provider) => {
            if (mode === "connect" && connectedProviders[provider.id]) return null;
            const isConnecting = connectingId === provider.id;
            return (
              <div
                key={provider.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div className={`rounded-full p-2 ${provider.bgClass}`}>
                  <HugeiconsIcon icon={CloudIcon} size={18} className={provider.textClass} />
                </div>
                <span className="text-sm font-medium flex-1">{provider.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!connectingId}
                  onClick={() => handleConnect(provider.id)}
                >
                  {isConnecting ? (
                    <>
                      <HugeiconsIcon icon={Loading02Icon} size={14} className="mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriveConnectDialog;
