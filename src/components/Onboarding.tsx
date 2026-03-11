import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Shield, Terminal } from "lucide-react";

interface OnboardingProps {
  onSelectFolder: () => void;
  onReconnect?: () => void;
  isReconnect?: boolean;
}

export function Onboarding({
  onSelectFolder,
  onReconnect,
  isReconnect,
}: OnboardingProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      // Dropping a folder triggers the select flow
      // The FSA API doesn't support drops directly on all browsers
      // so we fall back to the picker
      onSelectFolder();
    },
    [onSelectFolder]
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
            Visualize your Claude Code token usage and estimated API costs.
            All data stays on your machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Step
              number={1}
              icon={<Terminal className="h-4 w-4" />}
              text="Open Terminal and run:"
              code="open ~/.claude/projects"
            />
            <Step
              number={2}
              icon={<FolderOpen className="h-4 w-4" />}
              text='Select the "projects" folder below'
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Shield className="h-3 w-3" />
            <span>All data stays on your machine - nothing is uploaded</span>
          </div>
        </CardContent>
      </Card>
    </div>
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
          <code className="block text-xs bg-muted px-2 py-1 rounded font-mono">
            {code}
          </code>
        )}
      </div>
    </div>
  );
}
