import Workspace from "../models/workspace.model.js";
import Project from "../models/project.model.js";

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, startDate, dueDate, members, tags } =
      req.body;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this workspace" });
    }
    const tagArray = tags ? tags.split(",") : [];
    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      members,
      tags: tagArray,
      workspace: workspaceId,
      createdBy: req.user._id,
    });
    workspace.projects.push(newProject);
    await workspace.save();

    res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { createProject };
