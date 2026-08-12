// ==========================================
// USER & WORKSPACE TYPES
// ==========================================

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  isEmailVerified: boolean;
  updatedAt: Date;
  profilePicture?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner: User | string;
  color: string;
  members: {
    user: User;
    role: "admin" | "member" | "owner" | "viewer";
    joinedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberProps {
  _id: string;
  user: User;
  role: "admin" | "member" | "owner" | "viewer";
  joinedAt: Date;
}

// ==========================================
// PROJECT TYPES
// ==========================================

export enum ProjectStatus {
  PLANNING = "Planning",
  IN_PROGRESS = "In Progress",
  ON_HOLD = "On Hold",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

export enum ProjectMemberRole {
  MANAGER = "manager",
  CONTRIBUTOR = "contributor",
  VIEWER = "viewer",
}

export interface Project {
  coverPosition: number | undefined;
  _id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  workspace: Workspace;
  startDate: Date;
  dueDate: Date;
  progress: number;
  tasks: Task[];
  members: {
    user: User;
    role: "manager" | "contributor" | "viewer";
  }[];
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  coverImage?: string | null;
  tags?: string[];
  smartObjective?: SmartObjective;
}

export interface TaskTemplateItem {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface ProjectTemplate {
  _id: string;
  title: string;
  description?: string;
  workspace: string;
  createdBy: { _id: string; name: string };
  tags: string[];
  taskTemplates: TaskTemplateItem[];
  createdAt: string;
}

// ==========================================
// TASK & TIME TRACKING TYPES
// ==========================================

export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface TaskDependency {
  _id: string;
  title: string;
  status: TaskStatus;
}

export interface TimeEntry {
  _id: string;
  user: User | string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  _id: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  project: Project;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  dueDate: Date;
  priority: TaskPriority;
  assignee: User | string;
  createdBy: User | string;
  assignees: User[];
  subtasks?: Subtask[];
  watchers?: User[];
  attachments?: Attachment[];
  timeEntries?: TimeEntry[];
  startDate?: Date;
  dependencies?: (TaskDependency | string)[];
}

// ==========================================
// COMMENT & ACTIVITY TYPES
// ==========================================

export interface CommentReaction {
  emoji: string;
  user: User;
}

export interface CommentMention {
  user: User;
  offset: number;
  length: number;
}

export interface Comment {
  _id: string;
  author: User;
  text: string;
  createdAt: Date;
  reactions?: CommentReaction[];
  mentions?: CommentMention[];
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }[];
}

export type ResourceType =
  "Task" | "Project" | "Workspace" | "Comment" | "User";

export type ActionType =
  | "created_task"
  | "updated_task"
  | "created_subtask"
  | "updated_subtask"
  | "completed_task"
  | "created_project"
  | "updated_project"
  | "completed_project"
  | "created_workspace"
  | "updated_workspace"
  | "added_comment"
  | "added_member"
  | "removed_member"
  | "joined_workspace"
  | "added_attachment";

export interface ActivityLog {
  _id: string;
  user: User;
  action: ActionType;
  resourceType: ResourceType;
  resourceId: string;
  details: any;
  createdAt: Date;
}

// ==========================================
// MISC & DASHBOARD / STATS TYPES
// ==========================================

export interface Note {
  _id: string;
  title: string;
  content: string;
  project?: {
    _id: string;
    title: string;
    workspace: string; // ObjectId
  };
  createdBy?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StatsCardProps {
  totalProjects: number;
  totalTasks: number;
  totalProjectInProgress: number;
  totalTaskCompleted: number;
  totalTaskToDo: number;
  totalTaskInProgress: number;
  totalTaskOverdue: number;
  completionRate: number; // pourcentage, ex: 62.5
  avgCompletionDays: number | null; // null si aucune tâche "Done"
}

export interface TaskTrendsData {
  name: string;
  completed: number;
  inProgress: number;
  todo: number;
}

export interface TaskPriorityData {
  name: string;
  value: number;
  color: string;
}

export interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

export interface WorkspaceProductivityData {
  name: string;
  completed: number;
  total: number;
}

export interface WorkloadData {
  name: string;
  tasks: number;
}

export interface UpcomingDeadline {
  _id: string;
  title: string;
  dueDate: Date;
  status: TaskStatus;
  priority: TaskPriority;
  projectTitle: string;
}

// ==========================================
// LEARNING TYPES
// ==========================================

export interface LearningDomain {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  slug: string;
  createdBy: string;
  pathCount?: number;
  createdAt: string;
}

export type PathDifficulty = "beginner" | "intermediate" | "advanced";
export type PublishStatus = "draft" | "published";

export interface LearningPath {
  _id: string;
  domain: LearningDomain | string;
  title: string;
  description?: string;
  difficulty: PathDifficulty;
  status: PublishStatus;
  noteOrder: LearningNote[] | string[];
  createdBy: { _id: string; name: string; profilePicture?: string } | string;
  tags: string[];
  prerequisites:
    | {
        _id: string;
        title: string;
        difficulty: PathDifficulty;
        stats: { averageRating: number };
      }[]
    | string[];
  stats: {
    averageRating: number;
    ratingCount: number;
    completionCount: number;
    enrolledCount: number;
  };
  createdAt: string;
}

export interface LearningNote {
  _id: string;
  path: string;
  title: string;
  content: string;
  order: number;
  status: PublishStatus;
  createdBy: { _id: string; name: string; profilePicture?: string } | string;
  linkedNotes: { _id: string; title: string; status: PublishStatus }[];
  relatedNotes?: {
    _id: string;
    title: string;
    status: PublishStatus;
    path: { _id: string; title: string } | string;
  }[];
  stats: { averageRating: number; ratingCount: number };
  createdAt: string;
}

export interface LearningProgress {
  _id: string;
  user: string;
  path: string | LearningPath;
  completedNotes: string[];
  currentNote: string | null;
  completedAt?: string;
}

export interface LearningBadge {
  key: string;
  unlockedAt: string;
}

export interface LearningReputation {
  _id?: string;
  user: string | { _id: string; name: string; profilePicture?: string };
  score: number;
  breakdown: {
    qualityScore: number;
    impactScore: number;
  };
  badges: LearningBadge[];
}

export interface GraphNode {
  id: string;
  title: string;
  status: PublishStatus;
  order: number;
  averageRating: number;
  ratingCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type?: "sequence" | "wikilink" | "reference";
}

export interface LearningGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DomainGraphNode {
  id: string;
  title: string;
  pathId: string;
  pathTitle: string;
  averageRating: number;
  ratingCount: number;
}

export interface DomainGraph {
  domain: { name: string; slug: string };
  pathCount: number;
  nodes: DomainGraphNode[];
  edges: GraphEdge[];
}

export interface PrerequisiteStatus {
  _id: string;
  title: string;
  difficulty: PathDifficulty;
  completed: boolean;
}

export interface RoadmapNode {
  id: string;
  title: string;
  difficulty: PathDifficulty;
  averageRating: number;
  status: "not-started" | "in-progress" | "completed";
}

export interface DomainRoadmap {
  domain: { name: string; slug: string };
  nodes: RoadmapNode[];
  edges: GraphEdge[];
}

export interface SuggestedPath {
  _id: string;
  title: string;
  difficulty: PathDifficulty;
  stats: { averageRating: number; ratingCount: number };
}

export interface DomainNoteForLinking {
  _id: string;
  title: string;
  pathId: string;
  pathTitle: string;
}

export type ReportStatus = "open" | "reviewed" | "dismissed";

export interface LearningReport {
  _id: string;
  reportedBy: { _id: string; name: string; profilePicture?: string } | null;
  targetType: "path" | "note" | "domain";
  targetId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  target: {
    _id: string;
    title?: string;
    name?: string;
    status?: PublishStatus;
    createdBy: { _id: string; name: string; isBanned?: boolean } | string;
    path?: string;
  } | null;
  createdAt: string;
}

export interface SmartObjective {
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
}
