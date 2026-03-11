import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { DashboardData, PricingConfig } from "@/lib/types";
import { MODEL_PRESETS } from "@/lib/pricing";

interface SettingsProps {
  pricing: PricingConfig;
  onPricingChange: (pricing: PricingConfig) => void;
  data: DashboardData | null;
  onDisconnect: () => void;
}

export function Settings({
  pricing,
  onPricingChange,
  data,
  onDisconnect,
}: SettingsProps) {
  const [customPricing, setCustomPricing] = useState(pricing);

  const handlePresetChange = (presetName: string | null) => {
    if (!presetName) return;
    const preset = MODEL_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setCustomPricing(preset.pricing);
      onPricingChange(preset.pricing);
    }
  };

  const handleCustomChange = (key: keyof PricingConfig, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    const updated = { ...customPricing, [key]: num };
    setCustomPricing(updated);
    onPricingChange(updated);
  };

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

  const currentPreset = MODEL_PRESETS.find(
    (p) =>
      p.pricing.input === customPricing.input &&
      p.pricing.output === customPricing.output &&
      p.pricing.cacheRead === customPricing.cacheRead &&
      p.pricing.cacheWrite === customPricing.cacheWrite
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Model Pricing</label>
          <Select
            value={currentPreset?.name ?? "custom"}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_PRESETS.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
              {!currentPreset && (
                <SelectItem value="custom" disabled>
                  Custom
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["input", "Input (per 1M)"],
                ["output", "Output (per 1M)"],
                ["cacheRead", "Cache Read (per 1M)"],
                ["cacheWrite", "Cache Write (per 1M)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-1">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customPricing[key]}
                    onChange={(e) => handleCustomChange(key, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

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
