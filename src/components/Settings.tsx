import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DashboardData } from "@/lib/types";
import { formatCost, formatTokens, getModelDisplayName } from "@/lib/pricing";

interface SettingsProps {
  data: DashboardData | null;
  onDisconnect: () => void;
}

export function Settings({ data, onDisconnect }: SettingsProps) {
  const exportData = (format: "json" | "csv") => {
    if (!data) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = "claude-usage.json";
      mimeType = "application/json";
    } else {
      const rows = [
        [
          "Date",
          "Project",
          "Model",
          "Cost",
          "Input Tokens",
          "Output Tokens",
          "Cache Read",
          "Cache Write",
        ],
      ];
      for (const session of data.sessions) {
        rows.push([
          session.firstTimestamp?.slice(0, 10) ?? "",
          session.projectName,
          session.model ?? "unknown",
          session.cost.toFixed(4),
          session.usage.input_tokens.toString(),
          session.usage.output_tokens.toString(),
          session.usage.cache_read_input_tokens.toString(),
          session.usage.cache_creation_input_tokens.toString(),
        ]);
      }
      content = rows.map((r) => r.join(",")).join("\n");
      filename = "claude-usage.csv";
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modelEntries = data
    ? Object.entries(data.modelBreakdown).sort(([, a], [, b]) => b.cost - a.cost)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {modelEntries.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Detected Models</label>
            <div className="space-y-2">
              {modelEntries.map(([model, info]) => (
                <div
                  key={model}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {getModelDisplayName(model)}
                  </span>
                  <div className="text-right">
                    <span className="font-mono">{formatCost(info.cost)}</span>
                    {info.tokens > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTokens(info.tokens)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pricing is auto-detected from model IDs in session data.
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Export Data</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData("csv")}
              disabled={!data}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData("json")}
              disabled={!data}
            >
              Export JSON
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Folder Access</label>
          <Button variant="destructive" size="sm" onClick={onDisconnect}>
            Disconnect Folder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
