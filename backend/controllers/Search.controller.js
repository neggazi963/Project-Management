import Workspace from "../models/workspace.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";

const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();

    if (q.length < 2) {
      return res.status(200).json({ workspaces: [], projects: [], tasks: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [workspaces, projects] = await Promise.all([
      Workspace.find({
        "members.user": req.user._id,
        name: regex,
      })
        .limit(5)
        .select("name color"),
      Project.find({
        members: { $elemMatch: { user: req.user._id } },
        title: regex,
      })
        .limit(5)
        .select("title workspace status"),
    ]);

    const memberProjectIds = await Project.find({
      members: { $elemMatch: { user: req.user._id } },
    }).distinct("_id");

    const tasks = await Task.find({
      project: { $in: memberProjectIds },
      title: regex,
    })
      .limit(8)
      .select("title status project")
      .populate("project", "title workspace");

    return res.status(200).json({ workspaces, projects, tasks });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { globalSearch };