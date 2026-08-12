import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTaskPresence } from "@/hooks/use-task-presence";
import { useAuth } from "@/provider/auth-context";

export const TaskPresence = ({ taskId }: { taskId: string }) => {
  const { user } = useAuth();
  const viewers = useTaskPresence(taskId);

  // Comparaison sécurisée des IDs (transformés en string)
  const currentUserId = user?._id?.toString() || user?._id?.toString();
  const others = viewers.filter((v) => v._id?.toString() !== currentUserId);

  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-green-500" />
      </span>
      <div className="flex -space-x-2">
        {others.slice(0, 4).map((viewer) => (
          <Avatar
            key={viewer._id}
            className="size-6 border-2 border-background"
            title={`${viewer.name} is viewing this task`}
          >
            <AvatarImage src={viewer.profilePicture} />
            <AvatarFallback className="text-[10px]">
              {viewer.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {others.length === 1
          ? `${others[0].name} is here`
          : `${others.length} people here`}
      </span>
    </div>
  );
};
