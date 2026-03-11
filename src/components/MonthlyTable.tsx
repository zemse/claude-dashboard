import { useState } from "react";
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
import type { MonthlyUsage } from "@/lib/types";
import { formatCost, formatTokens } from "@/lib/pricing";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MonthlyTableProps {
  monthlyUsage: MonthlyUsage[];
}

export function MonthlyTable({ monthlyUsage }: MonthlyTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const reversed = [...monthlyUsage].reverse();

  const toggle = (month: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Input
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Output
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Cache Read
              </TableHead>
              <TableHead className="text-right">Sessions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reversed.map((m) => {
              const isExpanded = expanded.has(m.month);
              const projectEntries = Object.entries(m.projects).sort(
                ([, a], [, b]) => b - a
              );
              return (
                <>
                  <TableRow
                    key={m.month}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggle(m.month)}
                  >
                    <TableCell className="w-8 p-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Date(m.month + "-01T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "long", year: "numeric" }
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCost(m.totalCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono hidden sm:table-cell">
                      {formatTokens(m.usage.input_tokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono hidden sm:table-cell">
                      {formatTokens(m.usage.output_tokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono hidden md:table-cell">
                      {formatTokens(m.usage.cache_read_input_tokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.sessionCount}
                    </TableCell>
                  </TableRow>
                  {isExpanded &&
                    projectEntries.map(([project, cost]) => (
                      <TableRow
                        key={`${m.month}-${project}`}
                        className="bg-muted/30"
                      >
                        <TableCell></TableCell>
                        <TableCell className="text-sm text-muted-foreground pl-6">
                          {project}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {formatCost(cost)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"></TableCell>
                        <TableCell className="hidden sm:table-cell"></TableCell>
                        <TableCell className="hidden md:table-cell"></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                </>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
