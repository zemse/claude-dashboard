import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyUsage, DateRange } from "@/lib/types";
import { formatCost } from "@/lib/pricing";

interface DailyChartProps {
  dailyUsage: DailyUsage[];
  topProjects: string[];
}

const COLORS = [
  "oklch(0.646 0.222 41.116)",
  "oklch(0.6 0.118 184.714)",
  "oklch(0.398 0.07 227.392)",
  "oklch(0.828 0.189 84.429)",
  "oklch(0.769 0.188 70.08)",
  "oklch(0.7 0.15 300)",
  "oklch(0.65 0.2 150)",
  "oklch(0.55 0.15 50)",
];

const RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All", value: "all" },
];

export function DailyChart({ dailyUsage, topProjects }: DailyChartProps) {
  const [range, setRange] = useState<DateRange>("30d");

  const filteredData = useMemo(() => {
    if (range === "all") return dailyUsage;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return dailyUsage.filter((d) => d.date >= cutoffStr);
  }, [dailyUsage, range]);

  const chartData = useMemo(() => {
    return filteredData.map((day) => {
      const entry: Record<string, string | number> = {
        date: day.date,
      };
      for (const project of topProjects) {
        entry[project] = Number((day.projects[project] ?? 0).toFixed(4));
      }
      // Sum remaining projects as "Other"
      const topSet = new Set(topProjects);
      let other = 0;
      for (const [p, cost] of Object.entries(day.projects)) {
        if (!topSet.has(p)) other += cost;
      }
      if (other > 0) entry["Other"] = Number(other.toFixed(4));
      return entry;
    });
  }, [filteredData, topProjects]);

  const allKeys = useMemo(() => {
    const keys = [...topProjects];
    if (chartData.some((d) => (d["Other"] as number) > 0)) keys.push("Other");
    return keys;
  }, [topProjects, chartData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Daily Usage</CardTitle>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                range === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            No data for selected range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) =>
                  new Date(v + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload?.length) return null;
                  const total = payload.reduce(
                    (sum, p) => sum + (Number(p.value) || 0),
                    0
                  );
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-md">
                      <p className="text-sm font-medium mb-1">
                        {new Date(label + "T00:00:00").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                      {payload.map((p) => (
                        <div
                          key={p.dataKey}
                          className="flex justify-between gap-4 text-xs"
                        >
                          <span style={{ color: p.color as string }}>
                            {p.dataKey as string}
                          </span>
                          <span>{formatCost(Number(p.value))}</span>
                        </div>
                      ))}
                      <div className="border-t border-border mt-1 pt-1 flex justify-between text-xs font-medium">
                        <span>Total</span>
                        <span>{formatCost(total)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              {allKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={COLORS[i % COLORS.length]}
                  radius={
                    i === allKeys.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
