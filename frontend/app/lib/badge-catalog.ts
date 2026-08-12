import { BookOpen, Star, Users } from "lucide-react";

export const BADGE_CATALOG: Record<
  string,
  { label: string; description: string; icon: typeof BookOpen }
> = {
  five_paths_published: {
    label: "5 Paths Published",
    description: "Published 5 or more learning paths",
    icon: BookOpen,
  },
  high_rated_creator: {
    label: "Highly Rated",
    description: "Average rating above 4.5 across published paths",
    icon: Star,
  },
  hundred_learners: {
    label: "100 Learners Reached",
    description: "100+ learners completed your paths",
    icon: Users,
  },
};
