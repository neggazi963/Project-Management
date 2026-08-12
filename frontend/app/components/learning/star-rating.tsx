import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRateMutation, useGetMyRatingQuery } from "@/hooks/use-learning";
import { toast } from "sonner";

interface StarRatingProps {
  targetType: "path" | "note";
  targetId: string;
  averageRating: number;
  ratingCount: number;
  size?: "sm" | "md";
}

export const StarRating = ({
  targetType,
  targetId,
  averageRating,
  ratingCount,
  size = "md",
}: StarRatingProps) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const { data: myRating } = useGetMyRatingQuery(targetType, targetId) as {
    data: { stars: number } | undefined;
  };
  const { mutate: rate, isPending } = useRateMutation();

  const currentStars = myRating?.stars || 0;
  const starSize = size === "sm" ? "size-4" : "size-5";

  const handleRate = (stars: number) => {
    rate(
      { targetType, targetId, stars },
      {
        onSuccess: () => toast.success("Thanks for rating!"),
        onError: () => toast.error("Failed to submit rating"),
      },
    );
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isPending}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => handleRate(star)}
            className="disabled:opacity-50"
          >
            <Star
              className={cn(
                starSize,
                "transition-colors",
                (hoveredStar || currentStars) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
        {ratingCount > 0 && ` (${ratingCount})`}
      </span>
    </div>
  );
};