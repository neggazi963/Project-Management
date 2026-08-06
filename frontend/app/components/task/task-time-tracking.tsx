import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Square, Clock, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/provider/auth-context";
import {
  useStartTimerMutation,
  useStopTimerMutation,
  useAddManualTimeEntryMutation,
  useDeleteTimeEntryMutation,
} from "@/hooks/use-task";
import type { TimeEntry } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";

interface TaskTimeTrackingProps {
  taskId: string;
  timeEntries: TimeEntry[];
}

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

export const TaskTimeTracking = ({
  taskId,
  timeEntries,
}: TaskTimeTrackingProps) => {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");

  const { mutate: startTimer, isPending: isStarting } = useStartTimerMutation();
  const { mutate: stopTimer, isPending: isStopping } = useStopTimerMutation();
  const { mutate: addManualEntry, isPending: isAddingManual } =
    useAddManualTimeEntryMutation();
  const { mutate: deleteEntry } = useDeleteTimeEntryMutation();

  const activeEntry = timeEntries.find(
    (entry) =>
      !entry.endTime &&
      (typeof entry.user === "string"
        ? entry.user === user?._id
        : entry.user._id === user?._id),
  );

  useEffect(() => {
    if (!activeEntry) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const liveElapsed = activeEntry
    ? Math.floor((now - new Date(activeEntry.startTime).getTime()) / 1000)
    : 0;

  const totalSeconds = useMemo(
    () =>
      timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0) +
      (activeEntry ? liveElapsed : 0),
    [timeEntries, activeEntry, liveElapsed],
  );

  const handleStart = () => {
    startTimer(
      { taskId },
      {
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to start timer");
        },
      },
    );
  };

  const handleStop = () => {
    stopTimer(
      { taskId },
      {
        onSuccess: () => toast.success("Timer stopped"),
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to stop timer");
        },
      },
    );
  };

  const handleAddManual = () => {
    if (!manualStart || !manualEnd) {
      toast.error("Please fill in both start and end time");
      return;
    }

    addManualEntry(
      {
        taskId,
        startTime: new Date(manualStart).toISOString(),
        endTime: new Date(manualEnd).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("Time entry added");
          setShowManualForm(false);
          setManualStart("");
          setManualEnd("");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to add time entry",
          );
        },
      },
    );
  };

  const handleDelete = (entryId: string) => {
    const confirmed = window.confirm("Delete this time entry?");
    if (!confirmed) return;

    deleteEntry(
      { taskId, entryId },
      {
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete entry",
          );
        },
      },
    );
  };

  const loggedEntries = timeEntries.filter((e) => e.endTime);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Time Tracking
        </h3>
        <span className="text-sm font-medium flex items-center gap-1">
          <Clock className="size-4 text-muted-foreground" />
          {formatDuration(totalSeconds)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {activeEntry ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={isStopping}
          >
            <Square className="size-4 mr-2" />
            Stop ({formatDuration(liveElapsed)})
          </Button>
        ) : (
          <Button size="sm" onClick={handleStart} disabled={isStarting}>
            <Play className="size-4 mr-2" />
            Start Timer
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManualForm((v) => !v)}
        >
          <Plus className="size-4 mr-2" />
          Log time
        </Button>
      </div>

      {showManualForm && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 p-3 border rounded-md">
          <Input
            type="datetime-local"
            value={manualStart}
            onChange={(e) => setManualStart(e.target.value)}
            className="text-sm"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="datetime-local"
            value={manualEnd}
            onChange={(e) => setManualEnd(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" onClick={handleAddManual} disabled={isAddingManual}>
            Add
          </Button>
        </div>
      )}

      {loggedEntries.length > 0 && (
        <div className="space-y-1">
          {loggedEntries.map((entry) => {
            const entryUser =
              typeof entry.user === "string" ? null : entry.user;
            return (
              <div
                key={entry._id}
                className="flex items-center justify-between text-xs text-muted-foreground border-b py-1.5 last:border-0"
              >
                <span>
                  {entryUser?.name || "Someone"} —{" "}
                  {format(new Date(entry.startTime), "MMM d, HH:mm")} (
                  {formatDuration(entry.duration || 0)})
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => handleDelete(entry._id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
