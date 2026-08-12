import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import type { LearningDomain } from "@/types";
import * as Icons from "lucide-react";
import { BookOpen } from "lucide-react";

export const DomainPill = ({ domain }: { domain: LearningDomain }) => {
  const IconComponent =
    domain.icon && (Icons as any)[domain.icon]
      ? (Icons as any)[domain.icon]
      : BookOpen;

  return (
    <Link to={`/learning/domains/${domain.slug}`}>
      <Card className="p-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <IconComponent className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{domain.name}</p>
          <p className="text-xs text-muted-foreground">
            {domain.pathCount ?? 0} paths
          </p>
        </div>
      </Card>
    </Link>
  );
};
