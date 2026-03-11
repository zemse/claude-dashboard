import { useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ParsedSession, ProjectSummary } from "@/lib/types";
import { formatCost, formatTokens } from "@/lib/pricing";
import { ArrowLeft } from "lucide-react";

interface ProjectDetailProps {
  project: ProjectSummary;
  sessions: ParsedSession[];
  onBack: () => void;
}

export function ProjectDetail({
  project,
  sessions,
  onBack,
}: ProjectDetailProps) {
  const projectSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.projectPath === project.projectPath)
        .sort((a, b) =>
          (b.firstTimestamp ?? "").localeCompare(a.firstTimestamp ?? "")
        ),
    [sessions, project.projectPath]
  );

  const dailyData = useMemo(() => {
    return Object.entries(project.dailyUsage)
      .map(([date, data]) => ({
        date,
        cost: Number(data.cost.toFixed(4)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [project.dailyUsage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{project.projectName}</h2>
          <p className="text-sm text-muted-foreground">
            {formatCost(project.totalCost)} across {project.sessionCount}{" "}
            sessions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Cost</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No daily data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
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
                    return (
                      <div className="bg-popover border border-border rounded-lg p-2 shadow-md text-sm">
                        <p className="font-medium">
                          {new Date(label + "T00:00:00").toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                        <p>{formatCost(Number(payload[0].value))}</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="cost"
                  fill="oklch(0.646 0.222 41.116)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Input
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Output
                </TableHead>
                <TableHead className="text-right">Messages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectSessions.map((session) => (
                <TableRow key={session.sessionId}>
                  <TableCell className="text-sm">
                    {session.firstTimestamp
                      ? new Date(session.firstTimestamp).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
                        )
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCost(session.cost)}
                  </TableCell>
                  <TableCell className="text-right font-mono hidden sm:table-cell">
                    {formatTokens(session.usage.input_tokens)}
                  </TableCell>
                  <TableCell className="text-right font-mono hidden sm:table-cell">
                    {formatTokens(session.usage.output_tokens)}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.messageCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
