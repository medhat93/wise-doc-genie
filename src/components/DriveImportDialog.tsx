import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CloudIcon,
  ArrowLeft01Icon,
  Search01Icon,
  Folder01Icon,
  File01Icon,
  Image01Icon,
  ArrowRight01Icon,
  Download04Icon,
  Loading02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DriveFile, DRIVE_PROVIDERS } from "@/types/document";
import { getDriveFiles, getDriveProviderRootName } from "@/data/driveFiles";

interface DriveImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedProviders: Record<string, boolean>;
  setConnectedProviders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onImportFiles: (files: DriveFile[], providerName: string) => void;
}

type DialogView = "providers" | "activating" | "activated" | "browser";

function getFileIcon(mimeType?: string) {
  if (!mimeType) return { icon: File01Icon, colorClass: "text-muted-foreground" };
  if (mimeType.includes("pdf")) return { icon: File01Icon, colorClass: "text-red-500" };
  if (mimeType.includes("word") || mimeType.includes("document")) return { icon: File01Icon, colorClass: "text-blue-500" };
  if (mimeType.startsWith("image/")) return { icon: Image01Icon, colorClass: "text-green-500" };
  return { icon: File01Icon, colorClass: "text-muted-foreground" };
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const DriveImportDialog = ({
  open,
  onOpenChange,
  connectedProviders,
  setConnectedProviders,
  onImportFiles,
}: DriveImportDialogProps) => {
  const [view, setView] = useState<DialogView>("providers");
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState(false);

  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [currentFiles, setCurrentFiles] = useState<DriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const resetState = useCallback(() => {
    setView("providers");
    setActiveProvider(null);
    setConnectingProvider(false);
    setBreadcrumb([]);
    setCurrentFiles([]);
    setSelectedFiles([]);
    setSearchQuery("");
  }, []);

  const handleOpenChange = (o: boolean) => {
    if (!o) resetState();
    onOpenChange(o);
  };

  const openFileBrowser = useCallback((providerId: string) => {
    const rootName = getDriveProviderRootName(providerId);
    const files = getDriveFiles(providerId, "root");
    setActiveProvider(providerId);
    setBreadcrumb([{ id: "root", name: rootName }]);
    setCurrentFiles(files);
    setSelectedFiles([]);
    setSearchQuery("");
    setView("browser");
  }, []);

  const handleProviderClick = (providerId: string) => {
    if (connectedProviders[providerId]) {
      openFileBrowser(providerId);
    } else {
      setActiveProvider(providerId);
      setView("activating");
    }
  };

  const handleConnect = async () => {
    if (!activeProvider) return;
    setConnectingProvider(true);
    await new Promise((r) => setTimeout(r, 1500));
    setConnectedProviders((prev) => ({ ...prev, [activeProvider]: true }));
    setConnectingProvider(false);
    setView("activated");
    setTimeout(() => {
      openFileBrowser(activeProvider);
    }, 800);
  };

  const navigateToFolder = (folder: DriveFile) => {
    if (!activeProvider) return;
    const files = getDriveFiles(activeProvider, folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFiles(files);
    setSelectedFiles([]);
    setSearchQuery("");
  };

  const navigateToBreadcrumb = (index: number) => {
    if (!activeProvider) return;
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    const folderId = newBreadcrumb[newBreadcrumb.length - 1].id;
    const files = getDriveFiles(activeProvider, folderId);
    setBreadcrumb(newBreadcrumb);
    setCurrentFiles(files);
    setSelectedFiles([]);
    setSearchQuery("");
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const selectableFiles = currentFiles.filter((f) => f.type === "file");
  const allFilesSelected = selectableFiles.length > 0 && selectableFiles.every((f) => selectedFiles.includes(f.id));

  const toggleSelectAll = () => {
    if (allFilesSelected) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(selectableFiles.map((f) => f.id));
    }
  };

  const filteredFiles = searchQuery
    ? currentFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentFiles;

  const handleImport = () => {
    const filesToImport = currentFiles.filter((f) => selectedFiles.includes(f.id));
    const providerData = DRIVE_PROVIDERS.find((p) => p.id === activeProvider);
    onImportFiles(filesToImport, providerData?.name || "Drive");
    handleOpenChange(false);
  };

  const providerData = activeProvider ? DRIVE_PROVIDERS.find((p) => p.id === activeProvider) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <AnimatePresence mode="wait">
          {view === "providers" && (
            <motion.div
              key="providers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle>Import from Drive</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {DRIVE_PROVIDERS.map((provider) => {
                  const isConnected = connectedProviders[provider.id];
                  return (
                    <Card
                      key={provider.id}
                      className="p-6 text-center cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleProviderClick(provider.id)}
                    >
                      <div className={`rounded-full p-3 w-fit mx-auto ${provider.bgClass}`}>
                        <HugeiconsIcon icon={CloudIcon} size={24} className={provider.textClass} />
                      </div>
                      <p className="font-medium text-sm mt-3">{provider.name}</p>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                        <span className={`text-xs ${isConnected ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {isConnected ? "Connected" : "Not connected"}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Select a provider to browse and import files
              </p>
            </motion.div>
          )}

          {(view === "activating" || view === "activated") && providerData && (
            <motion.div
              key="activating"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="p-6"
            >
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 -ml-2"
                onClick={() => { setView("providers"); setActiveProvider(null); }}
                disabled={connectingProvider}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-1" />
                Back
              </Button>

              <div className="flex flex-col items-center text-center py-8">
                {view === "activated" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={48} className="text-emerald-500" />
                  </motion.div>
                ) : (
                  <div className={`rounded-full p-4 ${providerData.bgClass}`}>
                    <HugeiconsIcon icon={CloudIcon} size={48} className={providerData.textClass} />
                  </div>
                )}

                <h3 className="text-lg font-semibold mt-4">
                  {view === "activated" ? "Connected successfully!" : providerData.name}
                </h3>

                {view !== "activated" && (
                  <>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                      Connect your {providerData.name} account to import documents directly
                    </p>

                    <Button
                      className="mt-6"
                      onClick={handleConnect}
                      disabled={connectingProvider}
                    >
                      {connectingProvider ? (
                        <>
                          <HugeiconsIcon icon={Loading02Icon} size={16} className="mr-1.5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>Connect {providerData.name}</>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground mt-3">
                      You can disconnect at any time from Settings
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {view === "browser" && providerData && (
            <motion.div
              key="browser"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-h-0 flex-1"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setView("providers"); setActiveProvider(null); }}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </Button>
                  <div className={`rounded-full p-1.5 ${providerData.bgClass}`}>
                    <HugeiconsIcon icon={CloudIcon} size={14} className={providerData.textClass} />
                  </div>
                  <span className="font-medium text-sm">{providerData.name}</span>
                </div>
                <Button
                  size="sm"
                  disabled={selectedFiles.length === 0}
                  onClick={handleImport}
                >
                  <HugeiconsIcon icon={Download04Icon} size={16} className="mr-1.5" />
                  Import selected ({selectedFiles.length})
                </Button>
              </div>

              <div className="flex items-center gap-1 px-6 text-xs text-muted-foreground flex-shrink-0">
                {breadcrumb.map((crumb, idx) => (
                  <span key={crumb.id} className="flex items-center gap-1">
                    {idx > 0 && <HugeiconsIcon icon={ArrowRight01Icon} size={12} />}
                    <button
                      className={`hover:text-foreground transition-colors ${
                        idx === breadcrumb.length - 1 ? "text-foreground font-medium" : ""
                      }`}
                      onClick={() => navigateToBreadcrumb(idx)}
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
              </div>

              <div className="px-6 mt-3 flex-shrink-0">
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`Search in ${providerData.name}...`}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 mt-3 min-h-0 max-h-[400px] scrollbar-thin">
                {selectableFiles.length > 0 && (
                  <div
                    className="flex items-center gap-3 px-3 py-2 rounded-md border-b cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={toggleSelectAll}
                  >
                    <Checkbox
                      checked={allFilesSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      Select all files
                    </span>
                  </div>
                )}

                {filteredFiles.map((file) => {
                  const isFolder = file.type === "folder";
                  const isSelected = selectedFiles.includes(file.id);
                  const fileIconInfo = getFileIcon(file.mimeType);
                  const iconToUse = isFolder ? Folder01Icon : fileIconInfo.icon;
                  const iconColor = isFolder ? "text-amber-500" : fileIconInfo.colorClass;

                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        if (isFolder) {
                          navigateToFolder(file);
                        } else {
                          toggleFileSelection(file.id);
                        }
                      }}
                    >
                      {!isFolder && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFileSelection(file.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {isFolder && <div className="w-4" />}

                      <HugeiconsIcon icon={iconToUse} size={16} className={`flex-shrink-0 ${iconColor}`} />

                      <span className="text-sm font-medium flex-1 truncate">{file.name}</span>

                      {isFolder && (
                        <>
                          <span className="text-xs text-muted-foreground w-20 text-right hidden sm:block">
                            {file.itemCount} items
                          </span>
                          <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground flex-shrink-0" />
                        </>
                      )}

                      {!isFolder && (
                        <>
                          <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">
                            {formatFileSize(file.size)}
                          </span>
                          <span className="text-xs text-muted-foreground w-28 text-right flex-shrink-0 hidden md:block">
                            {formatDate(file.modifiedDate)}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}

                {filteredFiles.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No files found</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0">
                <p className="text-sm text-muted-foreground">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedFiles.length === 0}
                    onClick={handleImport}
                  >
                    <HugeiconsIcon icon={Download04Icon} size={16} className="mr-1.5" />
                    Import {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default DriveImportDialog;
