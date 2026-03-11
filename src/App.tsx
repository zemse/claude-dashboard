import { useEffect, useMemo, useState } from "react";
import { useFolder } from "@/hooks/useFolder";
import { useUsageData } from "@/hooks/useUsageData";
import { Onboarding } from "@/components/Onboarding";
import { OverviewCards } from "@/components/OverviewCards";
import { DailyChart } from "@/components/DailyChart";
import { MonthlyTable } from "@/components/MonthlyTable";
import { ProjectsList } from "@/components/ProjectsList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { Settings } from "@/components/Settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/lib/types";
import { RefreshCw, Settings as SettingsIcon, Star } from "lucide-react";

function BrowserCheck() {
  if (typeof window.showDirectoryPicker === "undefined") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold">Unsupported Browser</h1>
          <p className="text-muted-foreground">
            This app requires the File System Access API, which is not supported
            in your browser. Please use Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default function App() {
  const { state, selectFolder, setHandle, reconnect, disconnect } = useFolder();
  const { data, loading, progress, error, loadData } = useUsageData();
  const [selectedProject, setSelectedProject] =
    useState<ProjectSummary | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const browserUnsupported =
    typeof window.showDirectoryPicker === "undefined";

  useEffect(() => {
    if (state.status === "ready") {
      loadData(state.handle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === "ready" ? state.handle : null]);

  const handleRefresh = () => {
    if (state.status === "ready") {
      loadData(state.handle);
    }
  };

  const topProjects = useMemo(() => {
    if (!data) return [];
    return data.projects.slice(0, 7).map((p) => p.projectName);
  }, [data]);

  if (browserUnsupported) return <BrowserCheck />;

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (state.status === "no-handle") {
    return <Onboarding onSelectFolder={selectFolder} onDropHandle={setHandle} />;
  }

  if (state.status === "needs-permission") {
    return (
      <Onboarding
        onSelectFolder={selectFolder}
        onDropHandle={setHandle}
        onReconnect={reconnect}
        isReconnect
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Claude Code Dashboard</h1>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/zemse/claude-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              title="Star on GitHub"
              className="inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium h-9 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Star</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading && (
          <div className="text-center py-12 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {progress
                ? `Parsing files... ${progress.current}/${progress.total}`
                : "Loading..."}
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-3" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        )}

        {data && !loading && (
          <>
            {selectedProject ? (
              <ProjectDetail
                project={selectedProject}
                sessions={data.sessions}
                onBack={() => setSelectedProject(null)}
              />
            ) : (
              <>
                <OverviewCards data={data} />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div
                    className={
                      showSettings ? "lg:col-span-3" : "lg:col-span-4"
                    }
                  >
                    <Tabs defaultValue="daily">
                      <TabsList>
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                      </TabsList>
                      <TabsContent value="daily" className="mt-4">
                        <DailyChart
                          dailyUsage={data.dailyUsage}
                          topProjects={topProjects}
                        />
                      </TabsContent>
                      <TabsContent value="monthly" className="mt-4">
                        <MonthlyTable monthlyUsage={data.monthlyUsage} />
                      </TabsContent>
                      <TabsContent value="projects" className="mt-4">
                        <ProjectsList
                          projects={data.projects}
                          onSelectProject={setSelectedProject}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {showSettings && (
                    <div className="lg:col-span-1">
                      <Settings
                        data={data}
                        onDisconnect={disconnect}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
