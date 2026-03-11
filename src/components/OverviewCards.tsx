import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCost, formatTokens } from "@/lib/pricing";
import type { DashboardData } from "@/lib/types";
import { DollarSign, Hash, Coins, FolderOpen, Calendar } from "lucide-react";

interface OverviewCardsProps {
  data: DashboardData;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const cards = [
    {
      title: "Total Spend",
      value: formatCost(data.totalCost),
      icon: DollarSign,
    },
    {
      title: "Sessions",
      value: data.totalSessions.toLocaleString(),
      icon: Hash,
    },
    {
      title: "Total Tokens",
      value: formatTokens(data.totalTokens),
      icon: Coins,
    },
    {
      title: "Top Project",
      value: data.mostExpensiveProject ?? "-",
      icon: FolderOpen,
      small: true,
    },
    {
      title: "Busiest Day",
      value: data.busiestDay
        ? new Date(data.busiestDay + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "-",
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`font-bold ${card.small ? "text-sm truncate" : "text-2xl"}`}
              title={card.value}
            >
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
