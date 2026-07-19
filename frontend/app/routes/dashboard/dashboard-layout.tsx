import { useAuth } from "@/provider/auth-context";
import { Navigate, Outlet } from "react-router";
import { Loader } from "@/components/ui/loader";
import { Header } from "@/components/layout/header";
import { useState } from "react";
import type { Workspace } from "@/types";
import { SidebarComponent } from "@/components/layout/SidebarComponent";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { fetchtData } from "@/lib/fetch-util";

export const clientLoader = async () => {
  try {
    const [workspaces] = await Promise.all([fetchtData("/workspaces")]);
    return { workspaces };
  } catch (error) {
    console.log(error);
  }
};

function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  const handleWorkspaceSelected = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
  };

  return (
    <div className="flex h-screen w-full">
      <SidebarComponent currentWorkspace={currentWorkspace} />
      <div className="flex flex-1 flex-col h-full">
        <Header
          onWorkspaceSelected={handleWorkspaceSelected}
          selectedWorkspace={currentWorkspace}
          onCreateWorkspace={() => {
            setIsCreatingWorkspace(true);
          }}
        />
        <main className="flex-1 overflow-y-auto h-full w-full">
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <CreateWorkspace
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
      />
    </div>
  );
}

export default DashboardLayout;
