import Note from "../models/note.model.js";
import Project from "../models/project.model.js";

const checkProjectMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, isMember: false };

  const isMember = project.members.some(
    (member) => member.user.toString() === userId.toString(),
  );

  return { project, isMember };
};

const createNote = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content } = req.body;

    const { project, isMember } = await checkProjectMembership(
      projectId,
      req.user._id,
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const note = await Note.create({
      title,
      content,
      project: projectId,
      createdBy: req.user._id,
    });

    return res.status(201).json(note);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProjectNotes = async (req, res) => {
  try {
    const { projectId } = req.params;

    const { project, isMember } = await checkProjectMembership(
      projectId,
      req.user._id,
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    const notes = await Note.find({ project: projectId })
      .populate("createdBy", "name profilePicture")
      .sort({ updatedAt: -1 });

    return res.status(200).json(notes);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content } = req.body;

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const { isMember } = await checkProjectMembership(
      note.project,
      req.user._id,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    await note.save();

    return res.status(200).json(note);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const { isMember } = await checkProjectMembership(
      note.project,
      req.user._id,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    await note.deleteOne();

    return res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMyNotes = async (req, res) => {
  try {
    const projects = await Project.find({
      members: { $elemMatch: { user: req.user._id } },
    }).select("_id");

    const projectIds = projects.map((p) => p._id);

    const notes = await Note.find({ project: { $in: projectIds } })
      .populate("createdBy", "name profilePicture")
      .populate("project", "title workspace")
      .sort({ updatedAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { createNote, getProjectNotes, updateNote, deleteNote, getMyNotes };
