import { BackButton } from "@/components/back-button";
import { CreateProjectDialog } from "@/components/project/create-project";
import { InviteMemberDialog } from "@/components/workspace/invite-member";
import { ProjectList } from "@/components/workspace/project-list";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { useGetWorkspaceQuery } from "@/hooks/use-workspace";
import { useRoom } from "@/hooks/use-room";
import type { Project, Workspace } from "@/types";
import { useState } from "react";
import { useParams } from "react-router";
import { CreateFromTemplateDialog } from "@/components/workspace/create-from-template-dialog";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceRole } from "@/hooks/use-workspace-role";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// Skeleton de chargement pour la page de détail d'un workspace
const WorkspaceDetailsSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton BackButton */}
      <div className="h-9 w-24 bg-muted rounded-md" />

      {/* Skeleton WorkspaceHeader */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-muted rounded-md" />
          <div className="h-10 w-32 bg-muted rounded-md" />
        </div>
      </div>

      {/* Skeleton ProjectList Header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-9 w-28 bg-muted rounded-md" />
      </div>

      {/* Skeleton Projects Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="h-35 animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded-full" />
              </div>
              <div className="mt-3 h-3 w-3/4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-1/3 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const WorkspaceDetails = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreateProject, setIsCreateProject] = useState(false);
  const [isInviteMember, setIsInviteMember] = useState(false);
  const [isFromTemplate, setIsFromTemplate] = useState(false);

  useRoom(workspaceId ? `workspace:${workspaceId}` : null);

  const { data, isLoading } = useGetWorkspaceQuery(workspaceId!) as {
    data: {
      workspace: Workspace;
      projects: Project[];
    };
    isLoading: boolean;
  };

  const { canCreateProject, canInvite } = useWorkspaceRole(data?.workspace);

  if (!workspaceId) {
    return <div>No workspace found</div>;
  }

  // Remplacement du Loader par le Skeleton
  if (isLoading) {
    return <WorkspaceDetailsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <BackButton />
      <WorkspaceHeader
        workspace={data.workspace}
        members={data?.workspace?.members as any}
        onCreateProject={() => setIsCreateProject(true)}
        onInviteMember={() => setIsInviteMember(true)}
        canCreateProject={canCreateProject}
        canInvite={canInvite}
      />

      <ProjectList
        workspaceId={workspaceId}
        projects={data.projects}
        onCreateProject={() => setIsCreateProject(true)}
      />

      {canCreateProject && (
        <CreateProjectDialog
          isOpen={isCreateProject}
          onOpenChange={setIsCreateProject}
          workspaceId={workspaceId}
          workspaceMembers={data.workspace.members as any}
        />
      )}

      {canCreateProject && (
        <Button variant="outline" onClick={() => setIsFromTemplate(true)}>
          <LayoutTemplate className="size-4 mr-2" />
          From Template
        </Button>
      )}

      {canInvite && (
        <InviteMemberDialog
          isOpen={isInviteMember}
          onOpenChange={setIsInviteMember}
          workspaceId={workspaceId}
        />
      )}

      {canCreateProject && (
        <CreateFromTemplateDialog
          open={isFromTemplate}
          onOpenChange={setIsFromTemplate}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
};

export default WorkspaceDetails;
