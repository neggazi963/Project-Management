import { useEffect } from "react";
import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/types";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "../ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Link, useLoaderData, useLocation, useNavigate } from "react-router";
import { WorkspaceAvatar } from "../workspace/workspace-avatar";
import { ModeToggle } from "../mode-toggle";
import { GlobalSearch } from "../global-search";
import { NotificationBell } from "../notification-bell";
import { useGetWorkspacesQuery } from "@/hooks/use-workspace"; // Ajustez le chemin vers vos hooks

interface HeaderProps {
  onWorkspaceSelected: (workspace: Workspace) => void;
  selectedWorkspace: Workspace | null;
  onCreateWorkspace: () => void;
}

export const Header = ({
  onWorkspaceSelected,
  selectedWorkspace,
  onCreateWorkspace,
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // 1. Récupération dynamique via React Query pour réagir en temps réel aux mutations
  const loaderData = useLoaderData() as any;
  const initialWorkspaces: Workspace[] = Array.isArray(loaderData)
    ? loaderData
    : loaderData?.workspaces || loaderData?.data || [];

  const { data: workspacesQuery } = useGetWorkspacesQuery();
  const workspaces: Workspace[] = workspacesQuery || initialWorkspaces;

  const isOnWorkspacePage = location.pathname.includes("/workspace");

  // 🔄 RESTAURATION AUTOMATIQUE ET SUIVI DES CHANGEMENTS
  useEffect(() => {
    if (!workspaces || workspaces.length === 0) return;

    if (selectedWorkspace) {
      localStorage.setItem("active-workspace-id", selectedWorkspace._id);
      return;
    }

    const queryParams = new URLSearchParams(location.search);
    const queryWorkspaceId = queryParams.get("workspaceId");

    const pathSegments = location.pathname.split("/");
    const workspaceIndex = pathSegments.indexOf("workspaces");
    const pathWorkspaceId =
      workspaceIndex !== -1 ? pathSegments[workspaceIndex + 1] : null;

    const urlWorkspaceId = queryWorkspaceId || pathWorkspaceId;
    const savedWorkspaceId = localStorage.getItem("active-workspace-id");
    const targetId = urlWorkspaceId || savedWorkspaceId;

    const activeWorkspace =
      workspaces.find((w) => w._id === targetId) || workspaces[0];

    if (activeWorkspace) {
      onWorkspaceSelected(activeWorkspace);
      localStorage.setItem("active-workspace-id", activeWorkspace._id);
    }
  }, [workspaces, selectedWorkspace, location, onWorkspaceSelected]);

  const handleOnClick = (workspace: Workspace) => {
    onWorkspaceSelected(workspace);
    localStorage.setItem("active-workspace-id", workspace._id);

    if (isOnWorkspacePage) {
      navigate(`/workspaces/${workspace._id}`);
    } else {
      const basePath = location.pathname;
      navigate(`${basePath}?workspaceId=${workspace._id}`);
    }
  };

  return (
    <div className="bg-background sticky top-0 z-40 border-b">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant={"outline"}>
                  {selectedWorkspace ? (
                    <>
                      {selectedWorkspace.color && (
                        <WorkspaceAvatar
                          color={selectedWorkspace.color}
                          name={selectedWorkspace.name}
                        />
                      )}
                      <span className="font-medium ml-2">
                        {selectedWorkspace?.name}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">Select Workspace</span>
                  )}
                </Button>
              }
            />

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </DropdownMenuGroup>

              <DropdownMenuGroup>
                {workspaces && workspaces.length > 0 ? (
                  workspaces.map((ws) => (
                    <DropdownMenuItem
                      key={ws._id}
                      onClick={() => handleOnClick(ws)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {ws.color && (
                          <WorkspaceAvatar color={ws.color} name={ws.name} />
                        )}
                        <span className="ml-2 font-medium">{ws.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No workspaces found
                  </div>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={onCreateWorkspace}
                  className="cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Workspace
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="rounded-full border p-1 w-8 h-8">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profilePicture} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <ModeToggle />

            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
              <DropdownMenuItem>
                <Link to="/user/profile" className="w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
