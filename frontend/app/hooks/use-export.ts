export const useExportProject = () => {
  const exportProject = async (
    projectId: string,
    format: "csv" | "pdf",
    projectTitle?: string,
  ) => {
    const token = localStorage.getItem("token");
    const baseUrl =
      import.meta.env.VITE_BASE_URL || "http://localhost:5000/api-v1";

    const response = await fetch(
      `${baseUrl}/projects/${projectId}/export/${format}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      throw new Error("Export failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle || "project"}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return { exportProject };
};
