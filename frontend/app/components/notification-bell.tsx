import { Bell, CheckCheck } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/hooks/use-notification";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  type: string;
  message: string;
  link?: string;
  isRead: boolean;
  sender?: { name: string; profilePicture?: string };
  createdAt: string;
}

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { data } = useGetNotificationsQuery() as {
    data: { notifications: Notification[]; unreadCount: number } | undefined;
  };
  const { mutate: markAsRead } = useMarkNotificationAsReadMutation();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsReadMutation();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead({ notificationId: notification._id });
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[10px] font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="size-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications yet
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={cn(
                  "flex flex-col items-start gap-0.5 whitespace-normal py-2",
                  !notification.isRead && "bg-muted/50",
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-center gap-2 w-full">
                  {!notification.isRead && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  <p className="text-sm flex-1">{notification.message}</p>
                </div>
                <span className="text-xs text-muted-foreground pl-3.5">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
