import { useMemo, useState } from "react";
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
import type { ProjectSummary } from "@/lib/types";
import { formatCost } from "@/lib/pricing";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ProjectsListProps {
  projects: ProjectSummary[];
  onSelectProject: (project: ProjectSummary) => void;
}

type SortKey = "cost" | "sessions" | "lastActive";

export function ProjectsList({
  projects,
  onSelectProject,
}: ProjectsListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...projects];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "cost":
          cmp = a.totalCost - b.totalCost;
          break;
        case "sessions":
          cmp = a.sessionCount - b.sessionCount;
          break;
        case "lastActive":
          cmp = (a.lastActive ?? "").localeCompare(b.lastActive ?? "");
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [projects, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ArrowDown className="h-3 w-3 opacity-0 group-hover:opacity-30" />;
    return sortAsc ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead
                className="text-right cursor-pointer group"
                onClick={() => handleSort("cost")}
              >
                <span className="inline-flex items-center gap-1">
                  Cost <SortIcon col="cost" />
                </span>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer group"
                onClick={() => handleSort("sessions")}
              >
                <span className="inline-flex items-center gap-1">
                  Sessions <SortIcon col="sessions" />
                </span>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer group hidden sm:table-cell"
                onClick={() => handleSort("lastActive")}
              >
                <span className="inline-flex items-center gap-1">
                  Last Active <SortIcon col="lastActive" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((project) => (
              <TableRow
                key={project.projectPath}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelectProject(project)}
              >
                <TableCell className="font-medium max-w-[200px] truncate">
                  {project.projectName}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCost(project.totalCost)}
                </TableCell>
                <TableCell className="text-right">
                  {project.sessionCount}
                </TableCell>
                <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                  {project.lastActive
                    ? new Date(project.lastActive).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
