import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/auth/auth-layout.tsx", [
    index("routes/root/home.tsx"),
    route("sign-in", "routes/auth/sign-in.tsx"),
    route("sign-up", "routes/auth/sign-up.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
    route("reset-password", "routes/auth/reset-password.tsx"),
    route("verify-email", "routes/auth/verify-email.tsx"),
  ]),

  layout("routes/dashboard/dashboard-layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("workspaces", "routes/dashboard/workspaces/index.tsx"),
    route(
      "workspaces/:workspaceId",
      "routes/dashboard/workspaces/workspace-details.tsx",
    ),
    route(
      "workspaces/:workspaceId/projects/:projectId",
      "routes/dashboard/project/project-details.tsx",
    ),
    route(
      "workspaces/:workspaceId/projects/:projectId/tasks/:taskId",
      "routes/dashboard/task/task-details.tsx",
    ),
    route("my-tasks", "routes/dashboard/my-tasks.tsx"),
    route("members", "routes/dashboard/members.tsx"),
    route("my-notes", "routes/dashboard/my-notes.tsx"),
    route("learning", "routes/dashboard/learning/discover.tsx"),
    route(
      "learning/domains/:slug",
      "routes/dashboard/learning/domain-view.tsx",
    ),
    route(
      "learning/domains/:slug/graph",
      "routes/dashboard/learning/domain-graph.tsx",
    ),
    route(
      "learning/domains/:slug/roadmap",
      "routes/dashboard/learning/domain-roadmap.tsx",
    ),
    route("learning/paths/:pathId", "routes/dashboard/learning/path-view.tsx"),
    route("learning/my-paths", "routes/dashboard/learning/my-paths.tsx"),
    route(
      "learning/paths/:pathId/edit",
      "routes/dashboard/learning/path-editor.tsx",
    ),
    route("learning/moderation", "routes/dashboard/learning/moderation.tsx"),
    route(
      "learning/paths/:pathId/graph",
      "routes/dashboard/learning/path-graph.tsx",
    ),
    route("learning/my-progress", "routes/dashboard/learning/my-progress.tsx"),
    route("learning/leaderboard", "routes/dashboard/learning/leaderboard.tsx"),
  ]),

  route(
    "workspace-invite/:workspaceId",
    "routes/dashboard/workspaces/workspace-invite.tsx",
  ),

  layout("routes/user/user-layout.tsx", [
    route("user/profile", "routes/user/profile.tsx"),
  ]),
] satisfies RouteConfig;
