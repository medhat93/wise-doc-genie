import { useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Folder01Icon,
  File01Icon,
  Image01Icon,
  ArrowRight01Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DriveFile, DRIVE_PROVIDERS } from "@/types/document";
import { getDriveFiles, getDriveProviderRootName } from "@/data/driveFiles";

interface DriveBrowserViewProps {
  providerId: string;
  onImportFiles: (files: DriveFile[], providerName: string) => void;
}

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

const DriveBrowserView = ({ providerId, onImportFiles }: DriveBrowserViewProps) => {
  const providerData = DRIVE_PROVIDERS.find((p) => p.id === providerId);
  const rootName = getDriveProviderRootName(providerId);

  const [breadcrumb, setBreadcrumb] = useState([{ id: "root", name: rootName }]);
  const [currentFiles, setCurrentFiles] = useState<DriveFile[]>(getDriveFiles(providerId, "root"));
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const navigateToFolder = (folder: DriveFile) => {
    const files = getDriveFiles(providerId, folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFiles(files);
    setSelectedFiles([]);
    setSearchQuery("");
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    const folderId = newBreadcrumb[newBreadcrumb.length - 1].id;
    const files = getDriveFiles(providerId, folderId);
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
    onImportFiles(filesToImport, providerData?.name || "Drive");
    setSelectedFiles([]);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
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

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search in ${providerData?.name || "Drive"}...`}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* File list */}
      <div className="border rounded-lg">
        {selectableFiles.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 border-b cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={toggleSelectAll}
          >
            <Checkbox checked={allFilesSelected} onCheckedChange={toggleSelectAll} />
            <span className="text-xs text-muted-foreground font-medium">Select all files</span>
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
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b last:border-b-0 ${
                isSelected ? "bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => {
                if (isFolder) navigateToFolder(file);
                else toggleFileSelection(file.id);
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

      {/* Selection bar */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
          </p>
          <Button size="sm" onClick={handleImport}>
            <HugeiconsIcon icon={Download04Icon} size={16} className="mr-1.5" />
            Import Selected
          </Button>
        </div>
      )}
    </div>
  );
};

export default DriveBrowserView;
