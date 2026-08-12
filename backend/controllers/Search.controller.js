import Workspace from "../models/workspace.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Note from "../models/note.model.js";

const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();

    if (q.length < 2) {
      return res
        .status(200)
        .json({ workspaces: [], projects: [], tasks: [], notes: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    // 1. Récupérer les IDs des projets accessibles par l'utilisateur
    const memberProjectIds = await Project.find({
      members: { $elemMatch: { user: req.user._id } },
    }).distinct("_id");

    // 2. Lancer l'ensemble des recherches en parallèle
    const [workspaces, projects, tasks, notes] = await Promise.all([
      Workspace.find({
        "members.user": req.user._id,
        name: regex,
      })
        .limit(5)
        .select("name color"),

      Project.find({
        _id: { $in: memberProjectIds },
        title: regex,
      })
        .limit(5)
        .select("title workspace status"),

      Task.find({
        project: { $in: memberProjectIds },
        title: regex,
      })
        .limit(8)
        .select("title status project")
        .populate("project", "title workspace"),

      // 👇 VOTRE CODE EST PLACÉ ICI
      Note.find({
        project: { $in: memberProjectIds },
        $or: [{ title: regex }, { content: regex }],
      })
        .limit(5)
        .select("title project")
        .populate("project", "title workspace"),
    ]);

    return res.status(200).json({ workspaces, projects, tasks, notes });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { globalSearch };
