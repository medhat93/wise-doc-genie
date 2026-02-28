import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon } from "@hugeicons/core-free-icons";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DRIVE_PROVIDERS } from "@/types/document";
import { toast } from "@/hooks/use-toast";
import { GoogleDriveLogo, DropboxLogo, OneDriveLogo } from "@/components/DriveLogos";

interface DriveConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedProviders: Record<string, boolean>;
  onConnect: (providerId: string) => void;
  mode?: "connect" | "select";
  onSelectDrive?: (providerId: string) => void;
}

const driveLogo: Record<string, React.ReactNode> = {
  google_drive: <GoogleDriveLogo size={32} />,
  dropbox: <DropboxLogo size={32} />,
  onedrive: <OneDriveLogo size={32} />,
};

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

  const handleCardClick = (provider: (typeof DRIVE_PROVIDERS)[0]) => {
    if (connectedProviders[provider.id]) {
      onSelectDrive?.(provider.id);
      onOpenChange(false);
    } else {
      handleConnect(provider.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute left-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogTitle>
            {mode === "select" ? "Choose a drive" : "Connect a drive"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Import documents directly from your cloud storage
          </p>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {DRIVE_PROVIDERS.map((provider) => {
            const isConnected = connectedProviders[provider.id];
            const isConnecting = connectingId === provider.id;

            return (
              <button
                key={provider.id}
                disabled={!!connectingId}
                onClick={() => handleCardClick(provider)}
                className={`group relative flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isConnected
                    ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                } ${isConnecting ? "opacity-70 pointer-events-none" : ""}`}
              >
                {/* Connected badge */}
                {isConnected && (
                  <span className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                )}

                {/* Logo */}
                <div className="h-10 w-10 flex items-center justify-center">
                  {isConnecting ? (
                    <HugeiconsIcon icon={Loading02Icon} size={28} className="animate-spin text-muted-foreground" />
                  ) : (
                    driveLogo[provider.id]
                  )}
                </div>

                {/* Name */}
                <span className="text-sm font-medium text-foreground">{provider.name}</span>

                {/* Status / Action */}
                {isConnected ? (
                  <span className="text-xs text-emerald-600 font-medium">Connected</span>
                ) : isConnecting ? (
                  <span className="text-xs text-muted-foreground">Connecting...</span>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs pointer-events-none">
                    Connect
                  </Button>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriveConnectDialog;
