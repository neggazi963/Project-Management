import { useParams, useNavigate, useSearchParams } from "react-router";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/learning/star-rating";
import { PathProgressSidebar } from "@/components/learning/path-progress-sidebar";
import { NoteContentRenderer } from "@/components/learning/note-content-renderer";
import { ReportButton } from "@/components/learning/report-button";
import {
  useGetPathQuery,
  useGetNoteQuery,
  useEnrollMutation,
  useMarkNoteCompleteMutation,
} from "@/hooks/use-learning";
import { useAuth } from "@/provider/auth-context";
import { ChevronLeft, ChevronRight, CheckCircle2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import type { LearningNote, LearningPath, LearningProgress } from "@/types";
import { SuggestedNextPaths } from "@/components/learning/suggested-next-paths";

const PathView = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ===== Tous les hooks d'abord, sans exception, avant tout return conditionnel =====

  const { data, isLoading } = useGetPathQuery(pathId!) as {
    data: { path: LearningPath; progress: LearningProgress | null } | undefined;
    isLoading: boolean;
  };

  const { mutate: enroll, isPending: isEnrolling } = useEnrollMutation();
  const { mutate: markComplete, isPending: isCompleting } =
    useMarkNoteCompleteMutation();

  const notes = (data?.path.noteOrder as LearningNote[]) || [];
  const progress = data?.progress || null;

  const noteIdFromUrl = searchParams.get("note");
  const currentNoteId =
    noteIdFromUrl || progress?.currentNote || notes[0]?._id || "";

  const currentIndex = notes.findIndex((n) => n._id === currentNoteId);

  const { data: currentNote, isLoading: isNoteLoading } = useGetNoteQuery(
    currentNoteId,
  ) as { data: LearningNote | undefined; isLoading: boolean };

  // ===== Fin des hooks — à partir d'ici, returns conditionnels autorisés =====

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const { path } = data;
  const isOwner =
    typeof path.createdBy !== "string" && path.createdBy._id === user?._id;

  const handleSelectNote = (noteId: string) => {
    setSearchParams({ note: noteId });
  };

  const handleEnroll = () => {
    enroll(pathId!, {
      onSuccess: () => toast.success("Enrolled! Let's start learning."),
      onError: () => toast.error("Failed to enroll"),
    });
  };

  const handleMarkComplete = () => {
    markComplete(
      { pathId: pathId!, noteId: currentNoteId },
      {
        onSuccess: () => {
          toast.success("Note completed!");
          const nextNote = notes[currentIndex + 1];
          if (nextNote) {
            setSearchParams({ note: nextNote._id });
          }
        },
        onError: () => toast.error("Failed to update progress"),
      },
    );
  };

  const goToPrevious = () => {
    const prev = notes[currentIndex - 1];
    if (prev) setSearchParams({ note: prev._id });
  };

  const goToNext = () => {
    const next = notes[currentIndex + 1];
    if (next) setSearchParams({ note: next._id });
  };

  const isEnrolled = !!progress;
  const isCurrentCompleted = progress?.completedNotes.includes(currentNoteId);

  if (!isEnrolled) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div>
          <Badge variant="outline" className="mb-3 capitalize">
            {path.difficulty}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{path.title}</h1>
          <p className="text-muted-foreground">{path.description}</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <StarRating
            targetType="path"
            targetId={path._id}
            averageRating={path.stats.averageRating}
            ratingCount={path.stats.ratingCount}
          />
          <ReportButton targetType="path" targetId={path._id} />
        </div>

        <div className="text-sm text-muted-foreground">
          {notes.length} notes · {path.stats.enrolledCount} learners enrolled ·{" "}
          {path.stats.completionCount} completed
        </div>

        <Button size="lg" onClick={handleEnroll} disabled={isEnrolling}>
          {isEnrolling ? "Enrolling..." : "Start this Path"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      {/* Sidebar de progression */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">{path.title}</h2>
          <Link to={`/learning/paths/${pathId}/graph`}>
            <Button variant="ghost" size="sm">
              <Share2 className="size-4" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {notes.length} notes in this path
        </p>
        <PathProgressSidebar
          notes={notes}
          progress={progress}
          currentNoteId={currentNoteId}
          onSelectNote={handleSelectNote}
          isOwner={isOwner}
        />
      </div>

      {/* Contenu de la note */}
      <div className="space-y-6">
        {isNoteLoading || !currentNote ? (
          <Loader />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Note {currentIndex + 1} of {notes.length}
                </p>
                <h1 className="text-2xl font-bold">{currentNote.title}</h1>
              </div>
              {isCurrentCompleted && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle2 className="size-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <StarRating
                targetType="note"
                targetId={currentNote._id}
                averageRating={currentNote.stats.averageRating}
                ratingCount={currentNote.stats.ratingCount}
                size="sm"
              />
              <ReportButton targetType="note" targetId={currentNote._id} />
            </div>

            <div className="bg-card border rounded-lg p-6">
              <NoteContentRenderer
                content={currentNote.content}
                linkedNotes={currentNote.linkedNotes}
                onNavigateToLinkedNote={handleSelectNote}
              />
            </div>

            {progress?.completedAt && <SuggestedNextPaths pathId={pathId!} />}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="size-4 mr-2" />
                Previous
              </Button>

              {!isCurrentCompleted ? (
                <Button onClick={handleMarkComplete} disabled={isCompleting}>
                  <CheckCircle2 className="size-4 mr-2" />
                  {isCompleting ? "Saving..." : "Mark as Complete"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={goToNext}
                  disabled={currentIndex === notes.length - 1}
                >
                  Next
                  <ChevronRight className="size-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PathView;
