import ProjectTemplate from "../models/project-template.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Workspace from "../models/workspace.model.js";
import { hasProjectPermission } from "../libs/permissions.js";

const isWorkspaceManager = (workspace, userId) => {
  const member = workspace.members.find(
    (m) => m.user.toString() === userId.toString(),
  );
  return member && ["admin", "owner"].includes(member.role);
};

export const createTemplateFromProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");
    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to save this project as a template",
      });
    }

    const tasks = await Task.find({
      project: projectId,
      isArchived: false,
    }).select("title description status priority");

    const template = await ProjectTemplate.create({
      title: title || `${project.title} template`,
      description: description || project.description,
      workspace: project.workspace,
      createdBy: req.user._id,
      tags: project.tags,
      taskTemplates: tasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: "To Do",
        priority: t.priority,
      })),
    });

    res.status(201).json(template);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getWorkspaceTemplates = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }

    const templates = await ProjectTemplate.find({ workspace: workspaceId })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(templates);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await ProjectTemplate.findById(templateId);
    if (!template)
      return res.status(404).json({ message: "Template not found" });

    const workspace = await Workspace.findById(template.workspace);
    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    if (!isWorkspaceManager(workspace, req.user._id)) {
      return res.status(403).json({
        message: "You need admin/owner access to delete templates",
      });
    }

    await template.deleteOne();
    res.status(200).json({ message: "Template deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createProjectFromTemplate = async (req, res) => {
  try {
    const { workspaceId, templateId } = req.params;
    const { title, startDate, dueDate } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    if (!isWorkspaceManager(workspace, req.user._id)) {
      return res.status(403).json({
        message:
          "You need admin/owner access to create a project from a template",
      });
    }

    const template = await ProjectTemplate.findById(templateId);
    if (!template)
      return res.status(404).json({ message: "Template not found" });

    if (template.workspace.toString() !== workspaceId) {
      return res
        .status(400)
        .json({ message: "Template does not belong to this workspace" });
    }

    const project = await Project.create({
      title: title || template.title,
      description: template.description,
      status: "Planning",
      startDate,
      dueDate,
      tags: template.tags,
      workspace: workspaceId,
      members: [{ user: req.user._id, role: "manager" }],
      createdBy: req.user._id,
    });

    workspace.projects.push(project._id);
    await workspace.save();

    if (template.taskTemplates.length > 0) {
      const tasksToCreate = template.taskTemplates.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        project: project._id,
        createdBy: req.user._id,
      }));

      const createdTasks = await Task.insertMany(tasksToCreate);
      project.tasks = createdTasks.map((t) => t._id);
      await project.save();
    }

    res.status(201).json(project);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
