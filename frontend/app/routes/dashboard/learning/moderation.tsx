import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useModerateUnpublishMutation,
} from "@/hooks/use-learning";
import { useAuth } from "@/provider/auth-context";
import { toast } from "sonner";
import { ShieldAlert, EyeOff, Check, X } from "lucide-react";
import type { LearningReport } from "@/types";
import { useModerateDeleteContentMutation } from "@/hooks/use-learning";
import { Trash2 } from "lucide-react";
import {
  useModerateBanUserMutation,
  useModerateUnbanUserMutation,
} from "@/hooks/use-learning";
import { UserX, UserCheck } from "lucide-react";

const TABS = [
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

const targetLink = (report: LearningReport) => {
  if (!report.target) return null;
  if (report.targetType === "path") return `/learning/paths/${report.targetId}`;
  if (report.targetType === "note" && report.target.path)
    return `/learning/paths/${report.target.path}?note=${report.targetId}`;
  return null;
};

const Moderation = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("open");
  const { mutate: deleteContent, isPending: isDeleting } =
    useModerateDeleteContentMutation();
  const handleDelete = (report: LearningReport) => {
    if (report.targetType === "domain") return;
    const confirmed = window.confirm(
      "Permanently delete this content? This cannot be undone.",
    );
    if (!confirmed) return;

    deleteContent(
      { targetType: report.targetType, targetId: report.targetId },
      {
        onSuccess: () => toast.success("Content deleted"),
        onError: () => toast.error("Failed to delete content"),
      },
    );
  };
  const { mutate: banUser, isPending: isBanning } =
    useModerateBanUserMutation();
  const { mutate: unbanUser, isPending: isUnbanning } =
    useModerateUnbanUserMutation();

  const handleBan = (userId: string, userName: string) => {
    const confirmed = window.confirm(
      `Ban ${userName}? They won't be able to log in until unbanned.`,
    );
    if (!confirmed) return;

    banUser(userId, {
      onSuccess: () => toast.success(`${userName} has been banned`),
      onError: () => toast.error("Failed to ban user"),
    });
  };

  const handleUnban = (userId: string, userName: string) => {
    unbanUser(userId, {
      onSuccess: () => toast.success(`${userName} has been unbanned`),
      onError: () => toast.error("Failed to unban user"),
    });
  };
  const { data: reports, isLoading } = useGetReportsQuery(tab) as {
    data: LearningReport[] | undefined;
    isLoading: boolean;
  };

  const { mutate: updateStatus } = useUpdateReportStatusMutation();

  if (user && !user.isAdmin) {
    return <Navigate to="/learning" replace />;
  }

  const handleDismiss = (reportId: string) => {
    updateStatus(
      { reportId, status: "dismissed" },
      {
        onSuccess: () => toast.success("Report dismissed"),
        onError: () => toast.error("Failed to update report"),
      },
    );
  };

  const handleMarkReviewed = (reportId: string) => {
    updateStatus(
      { reportId, status: "reviewed" },
      {
        onSuccess: () => toast.success("Marked as reviewed"),
        onError: () => toast.error("Failed to update report"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="size-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Moderation</h1>
          <p className="text-sm text-muted-foreground">
            Review reported content from the community
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Loader />
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No reports {tab !== "all" ? `with status "${tab}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const link = targetLink(report);
            const title =
              report.target?.title ||
              report.target?.name ||
              "Content not found";
            const isDeleted = !report.target;

            return (
              <Card key={report._id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {report.targetType}
                        </Badge>
                        {report.target?.status && (
                          <Badge
                            variant="outline"
                            className={
                              report.target.status === "published"
                                ? "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"
                            }
                          >
                            {report.target.status}
                          </Badge>
                        )}
                      </div>
                      {link && !isDeleted ? (
                        <Link to={link} className="font-medium hover:underline">
                          {title}
                        </Link>
                      ) : (
                        <p className="font-medium text-muted-foreground">
                          {isDeleted ? "Content already deleted" : title}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        report.status === "open"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : report.status === "reviewed"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      {report.reason}
                    </p>
                    {report.details && (
                      <p className="text-muted-foreground">{report.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Reported by {report.reportedBy?.name || "Unknown user"} ·{" "}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {report.status === "open" && (
                    <div className="flex gap-2 pt-2 border-t flex-wrap">
                      {!isDeleted && report.targetType !== "domain" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(report)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="size-3.5 mr-1.5" />
                          Delete
                        </Button>
                      )}
                      {!isDeleted &&
                        report.target?.createdBy &&
                        typeof report.target.createdBy !== "string" && (
                          <div className="flex items-center justify-between pt-2 border-t text-xs">
                            <span className="text-muted-foreground">
                              Content by{" "}
                              <span className="font-medium text-foreground">
                                {report.target.createdBy.name}
                              </span>
                              {report.target.createdBy.isBanned && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-destructive/10 text-destructive border-destructive/20 text-xs"
                                >
                                  Banned
                                </Badge>
                              )}
                            </span>
                            {report.target.createdBy.isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUnban(
                                    (report.target!.createdBy as any)._id,
                                    (report.target!.createdBy as any).name,
                                  )
                                }
                                disabled={isUnbanning}
                              >
                                <UserCheck className="size-3.5 mr-1.5" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleBan(
                                    (report.target!.createdBy as any)._id,
                                    (report.target!.createdBy as any).name,
                                  )
                                }
                                disabled={isBanning}
                              >
                                <UserX className="size-3.5 mr-1.5" />
                                Ban User
                              </Button>
                            )}
                          </div>
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkReviewed(report._id)}
                      >
                        <Check className="size-3.5 mr-1.5" />
                        Mark Reviewed
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(report._id)}
                      >
                        <X className="size-3.5 mr-1.5" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Moderation;
