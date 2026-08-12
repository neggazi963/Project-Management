import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/loader";
import { ReputationBadges } from "@/components/learning/reputation-badges";
import {
  useGetMyProgressQuery,
  useGetReputationQuery,
} from "@/hooks/use-learning";
import { useAuth } from "@/provider/auth-context";
import { CheckCircle2, PlayCircle, Trophy } from "lucide-react";
import type { LearningReputation } from "@/types";

interface ProgressEntry {
  _id: string;
  path: {
    _id: string;
    title: string;
    domain: { name: string; slug: string };
    noteOrder: string[];
  };
  completedNotes: string[];
  completedAt?: string;
}

const MyProgress = () => {
  const { user } = useAuth();

  const { data: progressList, isLoading } = useGetMyProgressQuery() as {
    data: ProgressEntry[] | undefined;
    isLoading: boolean;
  };

  const { data: reputation } = useGetReputationQuery(user?._id || "") as {
    data: LearningReputation | undefined;
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const inProgress = (progressList || []).filter((p) => !p.completedAt);
  const completed = (progressList || []).filter((p) => p.completedAt);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="text-sm text-muted-foreground">
          Track the paths you're learning
        </p>
      </div>

      {/* Résumé réputation */}
      {reputation && reputation.score > 0 && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Trophy className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Your reputation score
                </p>
                <p className="text-xl font-bold">{reputation.score}</p>
              </div>
            </div>
            <ReputationBadges badges={reputation.badges} />
          </CardContent>
        </Card>
      )}

      {/* En cours */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          In Progress ({inProgress.length})
        </h2>
        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No paths in progress. Head to{" "}
            <Link to="/learning" className="underline">
              Discover
            </Link>{" "}
            to start one.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {inProgress.map((entry) => {
              const total = entry.path.noteOrder.length;
              const done = entry.completedNotes.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link key={entry._id} to={`/learning/paths/${entry.path._id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {entry.path.domain.name}
                        </Badge>
                        <PlayCircle className="size-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold line-clamp-1">
                        {entry.path.title}
                      </h3>
                      <div className="space-y-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {done} / {total} notes · {pct}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Terminés */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Completed ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed paths yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {completed.map((entry) => (
              <Link key={entry._id} to={`/learning/paths/${entry.path._id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {entry.path.domain.name}
                      </Badge>
                      <h3 className="font-semibold line-clamp-1">
                        {entry.path.title}
                      </h3>
                    </div>
                    <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProgress;
