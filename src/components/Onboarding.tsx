import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Shield, Terminal, Copy, Check } from "lucide-react";

interface OnboardingProps {
  onSelectFolder: () => void;
  onDropHandle: (handle: FileSystemDirectoryHandle) => void;
  onReconnect?: () => void;
  isReconnect?: boolean;
}

const COMMAND = "open ~/.claude";

export function Onboarding({
  onSelectFolder,
  onDropHandle,
  onReconnect,
  isReconnect,
}: OnboardingProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDropError(null);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setDropError(null);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) {
        onSelectFolder();
        return;
      }

      const item = items[0];
      if (typeof item.getAsFileSystemHandle !== "function") {
        // Browser doesn't support getAsFileSystemHandle, fall back to picker
        setDropError(
          "Drag & drop not supported in this browser. Use the button instead."
        );
        return;
      }

      try {
        const handle = await item.getAsFileSystemHandle();
        if (!handle || handle.kind !== "directory") {
          setDropError("Please drop a folder, not a file.");
          return;
        }
        onDropHandle(handle as FileSystemDirectoryHandle);
      } catch {
        setDropError("Could not read dropped folder. Try the button instead.");
      }
    },
    [onSelectFolder, onDropHandle]
  );

  if (isReconnect) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reconnect Folder</CardTitle>
            <CardDescription>
              Permission to read your Claude projects folder has expired. Click
              below to reconnect.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={onReconnect} size="lg" className="w-full">
              <FolderOpen className="mr-2 h-4 w-4" />
              Reconnect Folder
            </Button>
            <Button
              onClick={onSelectFolder}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Select Different Folder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Claude Code Dashboard</CardTitle>
          <CardDescription className="text-base mt-2">
            Visualize your Claude Code token usage and estimated API costs. All
            data stays on your machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Step
              number={1}
              icon={<Terminal className="h-4 w-4" />}
              text="Open Terminal and run:"
              code={COMMAND}
            />
            <Step
              number={2}
              icon={<FolderOpen className="h-4 w-4" />}
              text='Drag the "projects" folder below, or click to browse'
            />
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onClick={onSelectFolder}
          >
            <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drop folder here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to select
            </p>
          </div>

          {dropError && (
            <p className="text-sm text-destructive text-center">{dropError}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Shield className="h-3 w-3" />
            <span>All data stays on your machine - nothing is uploaded</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [text]
  );

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-foreground/10 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

function Step({
  number,
  icon,
  text,
  code,
}: {
  number: number;
  icon: React.ReactNode;
  text: string;
  code?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0 mt-0.5">
        {number}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-sm">
          {icon}
          <span>{text}</span>
        </div>
        {code && (
          <div className="flex items-center gap-1 bg-muted rounded px-2 py-1">
            <code className="text-xs font-mono flex-1">{code}</code>
            <CopyButton text={code} />
          </div>
        )}
      </div>
    </div>
  );
}
