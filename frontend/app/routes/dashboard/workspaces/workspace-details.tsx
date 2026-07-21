import { useParams } from "react-router";
import { useState } from "react";
import { useGetWorkspaceQuery } from "@/hooks/use-workspace";
import type { Project, Workspace } from "@/types";
import { Loader } from "@/components/loader";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { ProjectList } from "@/components/workspace/project-list";
import { CreateProjectDialog } from "@/components/project/create-project";
const WorkspaceDetails = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreateProject, setIsCreateProject] = useState(false);
  const [isInviteMember, setIsInviteMember] = useState(false);
  if (!workspaceId) return <div>Workspace not found</div>;

  const { data, isPending, isError } = useGetWorkspaceQuery(workspaceId) as {
    data: { workspace: Workspace; projects: Project[] } | undefined;
    isPending: boolean;
    isError: boolean;
  };

  if (isPending) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (isError || !data) {
    return <div>Échec du chargement du workspace.</div>;
  }
  return (
    <div className="space-y-8">
      <WorkspaceHeader
        workspace={data.workspace}
        members={data?.workspace?.members as any}
        onCreateProject={() => setIsCreateProject(true)}
        onInviteMember={() => setIsInviteMember(true)}
      />

      <ProjectList
        workspaceId={workspaceId}
        projects={data.projects}
        onCreateProject={() => setIsCreateProject(true)}
      />

      <CreateProjectDialog
        isOpen={isCreateProject}
        onOpenChange={setIsCreateProject}
        workspaceId={workspaceId}
        workspaceMembers={data.workspace.members as any}
      />

      {/* <InviteMemberDialog
        isOpen={isInviteMember}
        onOpenChange={setIsInviteMember}
        workspaceId={workspaceId}
      /> */}
    </div>
  );
};

export default WorkspaceDetails;
