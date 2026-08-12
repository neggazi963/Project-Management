import { BADGE_CATALOG } from "@/lib/badge-catalog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LearningBadge } from "@/types";

export const ReputationBadges = ({ badges }: { badges: LearningBadge[] }) => {
  if (!badges || badges.length === 0) {
    return <span className="text-xs text-muted-foreground">No badges yet</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {badges.map((badge) => {
        const meta = BADGE_CATALOG[badge.key];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <Tooltip key={badge.key}>
            <TooltipTrigger>
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="size-4 text-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{meta.label}</p>
              <p className="text-xs text-muted-foreground">
                {meta.description}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};
