import { BackButton } from "@/components/back-button";
import { Loader } from "@/components/loader";
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

  const { canCreateProject, canInvite } = useWorkspaceRole(data?.workspace); // 👈 avant tout return

  if (!workspaceId) {
    return <div>No workspace found</div>;
  }

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
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
        canInvite={canInvite} // 👈 ajoute
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

      {canCreateProject && ( // 👈 masque "From Template" pour un viewer
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
