import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedWorkspaceId: null,
      setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
    }),
    {
      name: "active-workspace-id", // Clé de stockage dans le localStorage
    },
  ),
);
