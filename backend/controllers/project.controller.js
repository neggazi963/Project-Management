import Workspace from "../models/workspace.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import cloudinary from "../libs/cloudinary.js";
import { emitInvalidate } from "../libs/socket.js";
import { hasProjectPermission } from "../libs/permissions.js";

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } =
      req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const workspaceMember = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!workspaceMember) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    // Un viewer du workspace ne peut pas créer de projet
    if (workspaceMember.role === "viewer") {
      return res.status(403).json({
        message: "Viewers cannot create projects",
      });
    }

    const tagArray = tags ? tags.split(",") : [];

    const memberList = (members || []).filter(
      (m) => m.user !== req.user._id.toString(),
    );
    memberList.push({ user: req.user._id, role: "manager" });

    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      tags: tagArray,
      workspace: workspaceId,
      members: memberList,
      createdBy: req.user._id,
    });

    workspace.projects.push(newProject._id);
    await workspace.save();

    emitInvalidate(`workspace:${workspaceId}`, ["workspace", workspaceId]);
    emitInvalidate(`workspace:${workspaceId}`, [
      "workspace",
      workspaceId,
      "stats",
    ]);

    return res.status(201).json(newProject);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate("members.user");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) =>
        member.user && member.user._id.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const tasks = await Task.find({
      project: projectId,
      isArchived: false,
    })
      .populate("assignees", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      project,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to delete this project",
      });
    }

    const workspaceId = project.workspace.toString();

    await Task.deleteMany({ project: projectId });

    await Workspace.findByIdAndUpdate(project.workspace, {
      $pull: { projects: project._id },
    });

    await project.deleteOne();

    emitInvalidate(`workspace:${workspaceId}`, ["workspace", workspaceId]);
    emitInvalidate(`workspace:${workspaceId}`, [
      "workspace",
      workspaceId,
      "stats",
    ]);

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectRoadmap = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).select("roadmap members");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    return res.status(200).json({ roadmap: project.roadmap || null });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateProjectRoadmap = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { roadmap } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // La roadmap est collaborative en temps réel : contributor suffit pour
    // dessiner, pas besoin d'être manager.
    const { allowed } = hasProjectPermission(
      project,
      req.user._id,
      "contributor",
    );

    if (!allowed) {
      return res.status(403).json({
        message: "You need at least contributor access to do this",
      });
    }

    project.roadmap = roadmap;
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    return res.status(200).json({ roadmap: project.roadmap });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const uploadProjectCover = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to change the project cover",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "taskhub/project-covers",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(req.file.buffer);
    });

    project.coverImage = uploadResult.secure_url;
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const setProjectCoverUrl = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { coverImage } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to change the project cover",
      });
    }

    project.coverImage = coverImage;
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const removeProjectCover = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to change the project cover",
      });
    }

    project.coverImage = null;
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProjectCoverPosition = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { position } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Repositionner la cover est un ajustement cosmétique mineur, on laisse
    // n'importe quel contributeur le faire.
    const { allowed } = hasProjectPermission(
      project,
      req.user._id,
      "contributor",
    );

    if (!allowed) {
      return res.status(403).json({
        message: "You need at least contributor access to do this",
      });
    }

    project.coverPosition = Math.min(100, Math.max(0, position));
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, startDate, dueDate, tags } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        error: "You need manager access to modify this project",
      });
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (tags !== undefined) project.tags = tags;

    await project.save();

    const workspaceId = project.workspace.toString();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);
    emitInvalidate(`workspace:${workspaceId}`, ["workspace", workspaceId]);
    emitInvalidate(`workspace:${workspaceId}`, [
      "workspace",
      workspaceId,
      "stats",
    ]);

    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

const updateProjectMemberRole = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;

    if (!["manager", "contributor", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to change member roles",
      });
    }

    const member = project.members.find((m) => m.user.toString() === memberId);

    if (!member) {
      return res.status(404).json({ message: "Member not found in project" });
    }

    const managerCount = project.members.filter(
      (m) => m.role === "manager",
    ).length;

    // Empêche de retirer le dernier accès manager restant du projet.
    if (
      member.user.toString() === req.user._id.toString() &&
      member.role === "manager" &&
      role !== "manager" &&
      managerCount <= 1
    ) {
      return res.status(400).json({
        message: "Cannot change your own role: you are the only manager",
      });
    }

    member.role = role;
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res
      .status(200)
      .json({ message: "Member role updated", members: project.members });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to remove members",
      });
    }

    const managerCount = project.members.filter(
      (m) => m.role === "manager",
    ).length;
    const targetMember = project.members.find(
      (m) => m.user.toString() === memberId,
    );

    if (targetMember?.role === "manager" && managerCount <= 1) {
      return res.status(400).json({
        message: "Cannot remove the only manager of this project",
      });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== memberId,
    );
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res
      .status(200)
      .json({ message: "Member removed", members: project.members });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    if (!["manager", "contributor", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to add members",
      });
    }

    const workspace = await Workspace.findById(project.workspace);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isWorkspaceMember = workspace.members.some(
      (m) => m.user.toString() === userId,
    );

    if (!isWorkspaceMember) {
      return res.status(400).json({
        message: "User must be a member of the workspace first",
      });
    }

    const alreadyInProject = project.members.some(
      (m) => m.user.toString() === userId,
    );

    if (alreadyInProject) {
      return res.status(400).json({
        message: "User is already a member of this project",
      });
    }

    project.members.push({ user: userId, role });
    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res.status(200).json({ message: "Member added", members: project.members });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProjectObjective = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { specific, measurable, achievable, relevant } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to set the project objective",
      });
    }

    project.smartObjective = {
      specific: specific ?? project.smartObjective?.specific ?? "",
      measurable: measurable ?? project.smartObjective?.measurable ?? "",
      achievable: achievable ?? project.smartObjective?.achievable ?? "",
      relevant: relevant ?? project.smartObjective?.relevant ?? "",
    };

    await project.save();

    emitInvalidate(`project:${projectId}`, ["project", projectId]);

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export {
  createProject,
  getProjectDetails,
  getProjectTasks,
  deleteProject,
  getProjectRoadmap,
  updateProjectRoadmap,
  uploadProjectCover,
  setProjectCoverUrl,
  removeProjectCover,
  updateProjectCoverPosition,
  updateProject,
  updateProjectMemberRole,
  removeProjectMember,
  addProjectMember,
  updateProjectObjective,
};
