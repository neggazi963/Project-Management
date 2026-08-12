import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/loader";
import { ReputationBadges } from "@/components/learning/reputation-badges";
import { useGetLeaderboardQuery } from "@/hooks/use-learning";
import { Trophy } from "lucide-react";
import type { LearningReputation } from "@/types";

const rankStyles: Record<number, string> = {
  0: "bg-amber-400/20 text-amber-600 border-amber-400/30",
  1: "bg-slate-300/20 text-slate-500 border-slate-300/30",
  2: "bg-orange-400/20 text-orange-600 border-orange-400/30",
};

const Leaderboard = () => {
  const { data: leaderboard, isLoading } = useGetLeaderboardQuery() as {
    data: LearningReputation[] | undefined;
    isLoading: boolean;
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Trophy className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Top Contributors</h1>
          <p className="text-sm text-muted-foreground">
            Ranked by reputation: quality of content and learner impact
          </p>
        </div>
      </div>

      {!leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No contributors yet. Publish a path to be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const contributor =
              typeof entry.user !== "string" ? entry.user : null;
            return (
              <Card key={entry._id}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div
                    className={`size-8 rounded-full border flex items-center justify-center font-semibold text-sm shrink-0 ${
                      rankStyles[index] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {contributor?.profilePicture ? (
                    <img
                      src={contributor.profilePicture}
                      alt={contributor.name}
                      className="size-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
                      {contributor?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {contributor?.name || "Unknown user"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.score} points
                    </p>
                  </div>

                  <ReputationBadges badges={entry.badges} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
