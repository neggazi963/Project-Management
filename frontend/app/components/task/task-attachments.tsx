import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  useAddAttachmentMutation,
  useDeleteAttachmentMutation,
} from "@/hooks/use-task";
import type { Attachment } from "@/types";
import { toast } from "sonner";
import {
  Paperclip,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";

interface TaskAttachmentsProps {
  taskId: string;
  attachments: Attachment[];
  canEdit?: boolean;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType?: string) => {
  if (fileType?.startsWith("image/")) return ImageIcon;
  if (fileType === "application/pdf" || fileType?.includes("text"))
    return FileText;
  return FileIcon;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const TaskAttachments = ({
  taskId,
  attachments,
  canEdit = true,
}: TaskAttachmentsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: addAttachment, isPending: isUploading } =
    useAddAttachmentMutation();
  const { mutate: deleteAttachment } = useDeleteAttachmentMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large (max 10MB)");
      e.target.value = "";
      return;
    }

    addAttachment(
      { taskId, file },
      {
        onSuccess: () => {
          toast.success("Attachment added");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to upload attachment",
          );
        },
      },
    );

    e.target.value = "";
  };

  const handleDelete = (attachmentId: string) => {
    const confirmed = window.confirm("Remove this attachment?");
    if (!confirmed) return;

    deleteAttachment(
      { taskId, attachmentId },
      {
        onSuccess: () => toast.success("Attachment removed"),
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to remove attachment",
          );
        },
      },
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Attachments
        </h3>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <Paperclip className="size-4 mr-2" />
              {isUploading ? "Uploading..." : "Add File"}
            </Button>
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments yet</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.fileType);
            return (
              <div
                key={attachment._id}
                className="flex items-center justify-between gap-2 border rounded-md px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => window.open(attachment.fileUrl, "_blank")}
                    title="Download"
                  >
                    <Download className="size-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(attachment._id)}
                      title="Remove"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
