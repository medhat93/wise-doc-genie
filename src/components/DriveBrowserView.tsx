import { useState, useEffect, useRef, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Folder01Icon,
  File01Icon,
  Image01Icon,
  ArrowRight01Icon,
  Add01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DriveFile, DRIVE_PROVIDERS } from "@/types/document";
import { getDriveFiles, getDriveProviderRootName } from "@/data/driveFiles";

const PAGE_SIZE = 12;
const LOAD_DELAY_MS = 5000; // 5 seconds to see loading animation

interface DriveBrowserViewProps {
  providerId: string;
  onImportFiles: (files: DriveFile[], providerName: string) => void;
  onNavigate?: () => void;
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

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 h-10 border-b last:border-b-0">
          <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
          <Skeleton className="h-3.5 flex-1 max-w-[200px]" />
          <Skeleton className="h-3 w-14 ml-auto" />
        </div>
      ))}
    </>
  );
}

const DriveBrowserView = ({ providerId, onImportFiles, onNavigate }: DriveBrowserViewProps) => {
  const providerData = DRIVE_PROVIDERS.find((p) => p.id === providerId);
  const rootName = getDriveProviderRootName(providerId);

  const [breadcrumb, setBreadcrumb] = useState([{ id: "root", name: rootName }]);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load files for current folder (with initial delay)
  const loadFolder = useCallback((folderId: string) => {
    setInitialLoading(true);
    setDisplayCount(PAGE_SIZE);
    setLoadingMore(false);
    const files = getDriveFiles(providerId, folderId);
    // Simulate network delay
    const timer = setTimeout(() => {
      setAllFiles(files);
      setInitialLoading(false);
    }, LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [providerId]);

  // Initial load
  useEffect(() => {
    const cleanup = loadFolder("root");
    return cleanup;
  }, [loadFolder]);

  const filteredFiles = searchQuery
    ? allFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allFiles;

  const visibleFiles = filteredFiles.slice(0, displayCount);
  const hasMore = displayCount < filteredFiles.length;

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || initialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          // Simulate loading delay for next page
          setTimeout(() => {
            setDisplayCount((prev) => prev + PAGE_SIZE);
            setLoadingMore(false);
          }, LOAD_DELAY_MS);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, initialLoading, displayCount]);

  const navigateToFolder = (folder: DriveFile) => {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery("");
    loadFolder(folder.id);
    onNavigate?.();
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    const folderId = newBreadcrumb[newBreadcrumb.length - 1].id;
    setBreadcrumb(newBreadcrumb);
    setSearchQuery("");
    loadFolder(folderId);
    onNavigate?.();
  };

  const handleAddFile = (file: DriveFile) => {
    onImportFiles([file], providerData?.name || "Drive");
  };

  // Reset pagination when search changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery]);

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-md mb-3">
        <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search in ${providerData?.name || "Drive"}...`}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Breadcrumb — only when navigated into a folder */}
      {breadcrumb.length > 1 && (
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
      )}

      {/* File list */}
      <div className="border rounded-lg">
        {/* Initial loading state */}
        {initialLoading && (
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading files...</span>
            </div>
            <LoadingSkeleton />
          </>
        )}

        {/* Loaded files */}
        {!initialLoading && visibleFiles.map((file) => {
          const isFolder = file.type === "folder";
          const fileIconInfo = getFileIcon(file.mimeType);
          const iconToUse = isFolder ? Folder01Icon : fileIconInfo.icon;
          const iconColor = isFolder ? "text-amber-500" : fileIconInfo.colorClass;

          return (
            <div
              key={file.id}
              className={`group flex items-center gap-3 px-4 h-10 transition-colors border-b last:border-b-0 ${
                isFolder ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/50"
              }`}
              onClick={() => {
                if (isFolder) navigateToFolder(file);
              }}
            >
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
                  <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0 group-hover:hidden">
                    {formatFileSize(file.size)}
                  </span>
                  <span className="text-xs text-muted-foreground w-28 text-right flex-shrink-0 hidden md:block group-hover:!hidden">
                    {formatDate(file.modifiedDate)}
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    className="hidden group-hover:inline-flex h-7 text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFile(file);
                    }}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} />
                    Add to queue
                  </Button>
                </>
              )}
            </div>
          );
        })}

        {/* Loading more indicator */}
        {!initialLoading && loadingMore && <LoadingSkeleton />}

        {/* Infinite scroll sentinel */}
        {!initialLoading && hasMore && !loadingMore && (
          <div ref={sentinelRef} className="h-1" />
        )}

        {/* Items count footer when paginated */}
        {!initialLoading && filteredFiles.length > PAGE_SIZE && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Showing {visibleFiles.length} of {filteredFiles.length} items
              {loadingMore && " · Loading more..."}
            </span>
          </div>
        )}

        {/* Empty state */}
        {!initialLoading && filteredFiles.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No files found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveBrowserView;
