import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useUploadProjectCoverMutation,
  useSetProjectCoverUrlMutation,
  useRemoveProjectCoverMutation,
  useUpdateProjectCoverPositionMutation,
} from "@/hooks/use-project";
import { toast } from "sonner";
import { Image, Link2, Trash2, X, MoveVertical, Check } from "lucide-react";

interface ProjectCoverProps {
  projectId: string;
  coverImage?: string | null;
  coverPosition?: number;
}

export const ProjectCover = ({
  projectId,
  coverImage,
  coverPosition = 50,
}: ProjectCoverProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const [showControls, setShowControls] = useState(false);

  const [isRepositioning, setIsRepositioning] = useState(false);

  const [dragging, setDragging] = useState(false);

  const [position, setPosition] = useState(coverPosition);

  useEffect(() => {
    setPosition(coverPosition);
  }, [coverPosition]);

  const { mutate: uploadCover, isPending: isUploading } =
    useUploadProjectCoverMutation();

  const { mutate: setCoverUrl, isPending: isSettingUrl } =
    useSetProjectCoverUrlMutation();

  const { mutate: removeCover } = useRemoveProjectCoverMutation();

  const { mutate: updatePosition, isPending: isSavingPosition } =
    useUpdateProjectCoverPositionMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maximum 10MB");
      return;
    }

    uploadCover(
      { projectId, file },
      {
        onSuccess: () => toast.success("Cover updated"),
      },
    );

    e.target.value = "";
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    setCoverUrl(
      {
        projectId,
        coverImage: urlInput.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Cover updated");
          setShowUrlForm(false);
          setUrlInput("");
        },
      },
    );
  };

  const handleRemove = () => {
    removeCover(
      { projectId },
      {
        onSuccess: () => toast.success("Cover removed"),
      },
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const percent = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition(Math.max(0, Math.min(100, percent)));
  };

  const handleSavePosition = () => {
    updatePosition(
      {
        projectId,
        position,
      },
      {
        onSuccess: () => {
          toast.success("Cover position saved");
          setIsRepositioning(false);
        },
      },
    );
  };

  if (!coverImage) {
    return (
      <div className="mb-4">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {!showUrlForm ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <Image className="mr-2 h-4 w-4" />
              Add cover
            </Button>

            <Button variant="ghost" onClick={() => setShowUrlForm(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Image URL
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
            />

            <Button onClick={handleUrlSubmit} disabled={isSettingUrl}>
              Set
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setShowUrlForm(false);
                setUrlInput("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-56 rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        setShowControls(false);
        setDragging(false);
      }}
      onMouseMove={handleMouseMove}
    >
      <img
        src={coverImage}
        alt="cover"
        draggable={false}
        className={`w-full h-full object-cover select-none ${
          isRepositioning ? "cursor-grab" : ""
        }`}
        style={{
          objectPosition: `center ${position}%`,
        }}
        onMouseDown={() => {
          if (isRepositioning) setDragging(true);
        }}
        onMouseUp={() => setDragging(false)}
      />

      {showControls && !isRepositioning && (
        <div className="absolute top-3 right-3 flex gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          <Button
            size="sm"
            variant="secondary"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Image className="h-4 w-4 mr-2" />
            Change
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsRepositioning(true)}
          >
            <MoveVertical className="h-4 w-4 mr-2" />
            Reposition
          </Button>

          <Button size="sm" variant="secondary" onClick={handleRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isRepositioning && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-md rounded-full p-2">
          <Button
            size="sm"
            onClick={handleSavePosition}
            disabled={isSavingPosition}
          >
            <Check className="mr-2 h-4 w-4" />
            Save
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPosition(coverPosition);
              setIsRepositioning(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {isRepositioning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            Drag vertically to reposition
          </div>
        </div>
      )}
    </div>
  );
};
