export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

export interface ParsedSession {
  sessionId: string;
  projectPath: string;
  projectName: string;
  usage: TokenUsage;
  cost: number;
  messageCount: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  model: string | null;
  costByModel: Record<string, number>;
}

export interface ProjectSummary {
  projectPath: string;
  projectName: string;
  totalCost: number;
  totalUsage: TokenUsage;
  sessionCount: number;
  lastActive: string | null;
  dailyUsage: Record<string, { cost: number; usage: TokenUsage }>;
}

export interface DailyUsage {
  date: string;
  totalCost: number;
  projects: Record<string, number>;
  models: Record<string, number>;
  usage: TokenUsage;
}

export interface MonthlyUsage {
  month: string;
  totalCost: number;
  usage: TokenUsage;
  sessionCount: number;
  projects: Record<string, number>;
}

export interface PricingConfig {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface DashboardData {
  sessions: ParsedSession[];
  projects: ProjectSummary[];
  dailyUsage: DailyUsage[];
  monthlyUsage: MonthlyUsage[];
  totalCost: number;
  totalSessions: number;
  totalTokens: number;
  mostExpensiveProject: string | null;
  busiestDay: string | null;
  modelBreakdown: Record<string, { cost: number; tokens: number }>;
}

export type DateRange = "7d" | "30d" | "90d" | "all";
