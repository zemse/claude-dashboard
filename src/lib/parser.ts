import type {
  TokenUsage,
  ParsedSession,
  ProjectSummary,
  DailyUsage,
  MonthlyUsage,
  DashboardData,
} from "./types";
import { calculateCost, getPricingForModel, DEFAULT_PRICING } from "./pricing";

function emptyUsage(): TokenUsage {
  return {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  };
}

function addUsage(target: TokenUsage, source: TokenUsage): void {
  target.input_tokens += source.input_tokens;
  target.output_tokens += source.output_tokens;
  target.cache_read_input_tokens += source.cache_read_input_tokens;
  target.cache_creation_input_tokens += source.cache_creation_input_tokens;
}

function projectNameFromFolder(folderName: string): string {
  const parts = folderName.replace(/^-/, "").split("-");
  const meaningfulParts: string[] = [];
  let foundWorkspace = false;
  for (const part of parts) {
    if (
      !foundWorkspace &&
      ["Users", "home", "Workspace", "workspace", "projects", "repos"].includes(
        part
      )
    ) {
      foundWorkspace = true;
      continue;
    }
    if (!foundWorkspace) continue;
    meaningfulParts.push(part);
  }
  if (meaningfulParts.length === 0) {
    return parts.slice(-3).join("/");
  }
  return meaningfulParts.join("/");
}

interface JsonlLine {
  type?: string;
  cwd?: string;
  sessionId?: string;
  timestamp?: string;
  message?: {
    role?: string;
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

function extractUsage(line: JsonlLine): TokenUsage | null {
  const u = line.message?.usage ?? line.usage;
  if (!u) return null;
  if (
    !u.input_tokens &&
    !u.output_tokens &&
    !u.cache_read_input_tokens &&
    !u.cache_creation_input_tokens
  )
    return null;
  return {
    input_tokens: u.input_tokens ?? 0,
    output_tokens: u.output_tokens ?? 0,
    cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
  };
}

async function parseJsonlFile(
  file: File,
  folderName: string
): Promise<ParsedSession | null> {
  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());

  const sessionUsage = emptyUsage();
  const costByModel: Record<string, number> = {};
  let totalCost = 0;
  let messageCount = 0;
  let firstTimestamp: string | null = null;
  let lastTimestamp: string | null = null;
  let projectCwd: string | null = null;
  let primaryModel: string | null = null;
  const modelCounts: Record<string, number> = {};

  for (const line of lines) {
    try {
      const parsed: JsonlLine = JSON.parse(line);

      if (parsed.cwd && !projectCwd) {
        projectCwd = parsed.cwd;
      }

      if (parsed.timestamp) {
        if (!firstTimestamp || parsed.timestamp < firstTimestamp)
          firstTimestamp = parsed.timestamp;
        if (!lastTimestamp || parsed.timestamp > lastTimestamp)
          lastTimestamp = parsed.timestamp;
      }

      const usage = extractUsage(parsed);
      if (usage) {
        addUsage(sessionUsage, usage);
        messageCount++;

        // Detect model and calculate cost per-message
        const model = parsed.message?.model;
        if (model && model !== "<synthetic>") {
          modelCounts[model] = (modelCounts[model] ?? 0) + 1;
          const pricing = getPricingForModel(model);
          const msgCost = calculateCost(usage, pricing);
          totalCost += msgCost;
          costByModel[model] = (costByModel[model] ?? 0) + msgCost;
        }
      }
    } catch {
      // skip malformed lines
    }
  }

  if (messageCount === 0) return null;

  // Primary model = most frequently used
  if (Object.keys(modelCounts).length > 0) {
    primaryModel = Object.entries(modelCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0];
  }

  // If no model was detected on any message, use fallback pricing
  if (totalCost === 0 && messageCount > 0) {
    totalCost = calculateCost(sessionUsage, DEFAULT_PRICING);
    costByModel["unknown"] = totalCost;
  }

  const sessionId = file.name.replace(".jsonl", "");
  const projectName = projectCwd
    ? projectCwd.split("/").slice(-2).join("/")
    : projectNameFromFolder(folderName);

  return {
    sessionId,
    projectPath: folderName,
    projectName,
    usage: sessionUsage,
    cost: totalCost,
    messageCount,
    firstTimestamp,
    lastTimestamp,
    model: primaryModel,
    costByModel,
  };
}

export async function parseDirectory(
  handle: FileSystemDirectoryHandle,
  onProgress?: (current: number, total: number) => void
): Promise<DashboardData> {
  const sessions: ParsedSession[] = [];
  const jsonlFiles: { file: File; folderName: string }[] = [];

  for await (const [projectDirName, projectEntry] of handle.entries()) {
    if (projectEntry.kind !== "directory") continue;
    const projectDir = projectEntry as FileSystemDirectoryHandle;

    for await (const [fileName, fileEntry] of projectDir.entries()) {
      if (fileEntry.kind !== "file" || !fileName.endsWith(".jsonl")) continue;
      const file = await (fileEntry as FileSystemFileHandle).getFile();
      jsonlFiles.push({ file, folderName: projectDirName });
    }
  }

  const total = jsonlFiles.length;
  let current = 0;

  for (const { file, folderName } of jsonlFiles) {
    const session = await parseJsonlFile(file, folderName);
    if (session) sessions.push(session);
    current++;
    onProgress?.(current, total);
  }

  return aggregateData(sessions);
}

function aggregateData(sessions: ParsedSession[]): DashboardData {
  const projectMap = new Map<string, ProjectSummary>();
  const dailyMap = new Map<string, DailyUsage>();
  const monthlyMap = new Map<string, MonthlyUsage>();
  const modelBreakdown: Record<string, { cost: number; tokens: number }> = {};

  let totalCost = 0;
  let totalTokens = 0;

  for (const session of sessions) {
    totalCost += session.cost;
    const sessionTokens =
      session.usage.input_tokens +
      session.usage.output_tokens +
      session.usage.cache_read_input_tokens +
      session.usage.cache_creation_input_tokens;
    totalTokens += sessionTokens;

    // Model breakdown
    for (const [model, cost] of Object.entries(session.costByModel)) {
      if (!modelBreakdown[model]) {
        modelBreakdown[model] = { cost: 0, tokens: 0 };
      }
      modelBreakdown[model].cost += cost;
    }
    if (session.model && modelBreakdown[session.model]) {
      modelBreakdown[session.model].tokens += sessionTokens;
    }

    // Project aggregation
    let project = projectMap.get(session.projectPath);
    if (!project) {
      project = {
        projectPath: session.projectPath,
        projectName: session.projectName,
        totalCost: 0,
        totalUsage: emptyUsage(),
        sessionCount: 0,
        lastActive: null,
        dailyUsage: {},
      };
      projectMap.set(session.projectPath, project);
    }
    project.totalCost += session.cost;
    addUsage(project.totalUsage, session.usage);
    project.sessionCount++;
    if (
      session.lastTimestamp &&
      (!project.lastActive || session.lastTimestamp > project.lastActive)
    ) {
      project.lastActive = session.lastTimestamp;
    }

    // Daily aggregation
    const date = session.firstTimestamp
      ? session.firstTimestamp.slice(0, 10)
      : "unknown";
    if (date !== "unknown") {
      let daily = dailyMap.get(date);
      if (!daily) {
        daily = {
          date,
          totalCost: 0,
          projects: {},
          usage: emptyUsage(),
        };
        dailyMap.set(date, daily);
      }
      daily.totalCost += session.cost;
      daily.projects[session.projectName] =
        (daily.projects[session.projectName] ?? 0) + session.cost;
      addUsage(daily.usage, session.usage);

      if (!project.dailyUsage[date]) {
        project.dailyUsage[date] = { cost: 0, usage: emptyUsage() };
      }
      project.dailyUsage[date].cost += session.cost;
      addUsage(project.dailyUsage[date].usage, session.usage);

      const month = date.slice(0, 7);
      let monthly = monthlyMap.get(month);
      if (!monthly) {
        monthly = {
          month,
          totalCost: 0,
          usage: emptyUsage(),
          sessionCount: 0,
          projects: {},
        };
        monthlyMap.set(month, monthly);
      }
      monthly.totalCost += session.cost;
      addUsage(monthly.usage, session.usage);
      monthly.sessionCount++;
      monthly.projects[session.projectName] =
        (monthly.projects[session.projectName] ?? 0) + session.cost;
    }
  }

  const projects = Array.from(projectMap.values()).sort(
    (a, b) => b.totalCost - a.totalCost
  );
  const dailyUsage = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const monthlyUsage = Array.from(monthlyMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const mostExpensiveProject =
    projects.length > 0 ? projects[0].projectName : null;
  const busiestDay =
    dailyUsage.length > 0
      ? dailyUsage.reduce((max, d) => (d.totalCost > max.totalCost ? d : max))
          .date
      : null;

  return {
    sessions,
    projects,
    dailyUsage,
    monthlyUsage,
    totalCost,
    totalSessions: sessions.length,
    totalTokens,
    mostExpensiveProject,
    busiestDay,
    modelBreakdown,
  };
}
