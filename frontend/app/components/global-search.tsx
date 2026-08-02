import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGlobalSearchQuery } from "@/hooks/use-search";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Layers, FolderKanban, CheckSquare } from "lucide-react";

interface SearchWorkspace {
  _id: string;
  name: string;
}

interface SearchProject {
  _id: string;
  title: string;
  workspace: string;
}

interface SearchTask {
  _id: string;
  title: string;
  project: { _id: string; title: string; workspace: string };
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const { data, isFetching } = useGlobalSearchQuery(debouncedQuery) as {
    data:
      | {
          workspaces: SearchWorkspace[];
          projects: SearchProject[];
          tasks: SearchTask[];
        }
      | undefined;
    isFetching: boolean;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const hasResults =
    !!data &&
    (data.workspaces.length > 0 ||
      data.projects.length > 0 ||
      data.tasks.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline ml-4 text-xs bg-muted px-1.5 py-0.5 rounded border">
          /
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="size-4 text-muted-foreground mr-2 shrink-0" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search workspaces, projects, tasks..."
              className="border-0 focus-visible:ring-0 shadow-none"
            />
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {query.trim().length < 2 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Type at least 2 characters to search
              </p>
            )}

            {query.trim().length >= 2 && !isFetching && !hasResults && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No results found
              </p>
            )}

            {data && data.workspaces.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Workspaces
                </p>
                {data.workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => goTo(`/workspaces/${ws._id}`)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-muted text-left"
                  >
                    <Layers className="size-4 text-muted-foreground shrink-0" />
                    {ws.name}
                  </button>
                ))}
              </div>
            )}

            {data && data.projects.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Projects
                </p>
                {data.projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() =>
                      goTo(`/workspaces/${p.workspace}/projects/${p._id}`)
                    }
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-muted text-left"
                  >
                    <FolderKanban className="size-4 text-muted-foreground shrink-0" />
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            {data && data.tasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Tasks
                </p>
                {data.tasks.map((t) => (
                  <button
                    key={t._id}
                    onClick={() =>
                      goTo(
                        `/workspaces/${t.project.workspace}/projects/${t.project._id}/tasks/${t._id}`,
                      )
                    }
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-muted text-left"
                  >
                    <CheckSquare className="size-4 text-muted-foreground shrink-0" />
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
