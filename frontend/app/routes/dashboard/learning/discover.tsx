import { useState } from "react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/loader";
import { PathCard } from "@/components/learning/path-card";
import { DomainPill } from "@/components/learning/domain-pill";
import { CreateDomainDialog } from "@/components/learning/create-domain-dialog";
import { useAuth } from "@/provider/auth-context";
import {
  useDiscoverPathsQuery,
  useGetDomainsQuery,
} from "@/hooks/use-learning";
import { Search, Plus, GraduationCap, Trophy, ShieldAlert } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { LearningDomain, LearningPath } from "@/types";

const SORT_TABS = [
  { value: "trending", label: "🔥 Trending" },
  { value: "best-rated", label: "⭐ Best Rated" },
  { value: "most-completed", label: "📈 Most Completed" },
  { value: "recent", label: "🆕 Recently Created" },
];

const Discover = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("trending");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [isCreatingDomain, setIsCreatingDomain] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data: domains, isLoading: isLoadingDomains } =
    useGetDomainsQuery() as {
      data: LearningDomain[] | undefined;
      isLoading: boolean;
    };

  const { data: paths, isLoading: isLoadingPaths } = useDiscoverPathsQuery({
    sort,
    difficulty: difficulty === "all" ? undefined : difficulty,
    search: debouncedSearch || undefined,
  }) as { data: LearningPath[] | undefined; isLoading: boolean };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Learning</h1>
            <p className="text-sm text-muted-foreground">
              Discover paths, learn at your own pace
            </p>
          </div>
        </div>

        {user?.isAdmin && (
          <Link to="/learning/moderation">
            <Button variant="outline">
              <ShieldAlert className="size-4 mr-2" />
              Moderation
            </Button>
          </Link>
        )}

        <div className="flex gap-2">
          <Link to="/learning/leaderboard">
            <Button variant="outline">
              <Trophy className="size-4 mr-2" />
              Leaderboard
            </Button>
          </Link>
          <Link to="/learning/my-progress">
            <Button variant="outline">My Progress</Button>
          </Link>
          <Link to="/learning/my-paths">
            <Button variant="outline">My Paths</Button>
          </Link>
          <Link to="/learning/paths/new/edit">
            <Button>
              <Plus className="size-4 mr-2" />
              Create Path
            </Button>
          </Link>
        </div>
      </div>

      {/* Domains */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Browse by Domain</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreatingDomain(true)}
          >
            <Plus className="size-4 mr-1" />
            New Domain
          </Button>
        </div>
        {isLoadingDomains ? (
          <Loader />
        ) : !domains || domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No domains yet. Be the first to create one.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {domains.map((domain) => (
              <DomainPill key={domain._id} domain={domain} />
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search paths..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={difficulty}
            onValueChange={(val) => setDifficulty(val || "all")}
          >
            <SelectTrigger className="w-full sm:w-45">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={sort} onValueChange={setSort}>
          <TabsList className="flex-wrap h-auto">
            {SORT_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Path grid */}
      <div>
        {isLoadingPaths ? (
          <Loader />
        ) : !paths || paths.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              No paths found. Try different filters, or create the first one!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((path) => (
              <PathCard key={path._id} path={path} />
            ))}
          </div>
        )}
      </div>

      <CreateDomainDialog
        open={isCreatingDomain}
        onOpenChange={setIsCreatingDomain}
      />
    </div>
  );
};

export default Discover;
