import { recordActivity } from "../libs/index.js";
import { notify } from "../libs/notify.js";
import { emitInvalidate } from "../libs/socket.js";
import cloudinary from "../libs/cloudinary.js";
import ActivityLog from "../models/activity.model.js";
import Comment from "../models/comment.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Workspace from "../models/workspace.model.js";
import { hasProjectPermission } from "../libs/permissions.js";

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assignees } =
      req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const workspace = await Workspace.findById(project.workspace);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const { allowed } = hasProjectPermission(
      project,
      req.user._id,
      "contributor",
    );

    if (!allowed) {
      return res.status(403).json({
        message: "You need at least contributor access to create tasks",
      });
    }

    const newTask = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignees,
      project: projectId,
      createdBy: req.user._id,
    });

    project.tasks.push(newTask._id);
    await project.save();

    for (const assigneeId of assignees || []) {
      await notify({
        recipient: assigneeId,
        sender: req.user._id,
        type: "task_assigned",
        message: `${req.user.name} assigned you a task: "${title}"`,
        link: `/workspaces/${workspace._id}/projects/${projectId}/tasks/${newTask._id}`,
      });
    }

    emitInvalidate(`project:${projectId}`, ["project", projectId]);
    emitInvalidate(`workspace:${workspace._id}`, [
      "workspace",
      workspace._id.toString(),
      "stats",
    ]);

    res.status(201).json(newTask);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignees", "name profilePicture")
      .populate("watchers", "name profilePicture")
      .populate("timeEntries.user", "name profilePicture")
      .populate("dependencies", "title status");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project).populate(
      "members.user",
      "name profilePicture",
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const allProjectTasks = await Task.find({ project: task.project }).select(
      "_id title status",
    );

    res.status(200).json({
      task,
      project: {
        ...project.toObject(),
        tasks: allProjectTasks,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const oldTitle = task.title;

    task.title = title;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task title from ${oldTitle} to ${title}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);
    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateTaskDescription = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const oldDescription =
      task.description.substring(0, 50) +
      (task.description.length > 50 ? "..." : "");
    const newDescription =
      description.substring(0, 50) + (description.length > 50 ? "..." : "");

    task.description = description;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task description from ${oldDescription} to ${newDescription}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const oldStatus = task.status;

    task.status = status;
    await task.save();

    if (status === "Done" && oldStatus !== "Done") {
      const recipients = new Set([
        task.createdBy.toString(),
        ...task.watchers.map((w) => w.toString()),
      ]);

      for (const recipientId of recipients) {
        await notify({
          recipient: recipientId,
          sender: req.user._id,
          type: "task_completed",
          message: `${req.user.name} completed task: "${task.title}"`,
          link: `/workspaces/${project.workspace}/projects/${project._id}/tasks/${task._id}`,
        });
      }
    }

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task status from ${oldStatus} to ${status}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);
    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);
    emitInvalidate(`workspace:${project.workspace}`, [
      "workspace",
      project.workspace.toString(),
      "stats",
    ]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const oldAssignees = task.assignees;

    task.assignees = assignees;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task assignees from ${oldAssignees.length} to ${assignees.length}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);
    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateTaskPriority = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { priority } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const oldPriority = task.priority;

    task.priority = priority;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated task priority from ${oldPriority} to ${priority}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);
    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const addSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const newSubTask = {
      title,
      completed: false,
    };

    task.subtasks.push(newSubTask);
    await task.save();

    await recordActivity(req.user._id, "created_subtask", "Task", taskId, {
      description: `created subtask ${title}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(201).json(task);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateSubTask = async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { completed } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const subTask = task.subtasks.find(
      (subTask) => subTask._id.toString() === subTaskId,
    );

    if (!subTask) {
      return res.status(404).json({
        message: "Subtask not found",
      });
    }

    subTask.completed = completed;
    await task.save();

    await recordActivity(req.user._id, "updated_subtask", "Task", taskId, {
      description: `updated subtask ${subTask.title}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getActivityByResourceId = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const activity = await ActivityLog.find({ resourceId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(activity);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .populate("mentions.user", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text, mentions } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project).populate(
      "members.user",
      "name",
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { allowed } = hasProjectPermission(
      project,
      req.user._id,
      "contributor",
    );

    if (!allowed) {
      return res.status(403).json({
        message: "You need at least contributor access to comment",
      });
    }

    const projectMemberIds = new Set(
      project.members.map((m) => m.user._id.toString()),
    );

    // 1. Mentions structurées envoyées par l'autocomplete
    const structuredMentions = (mentions || []).filter(
      (m) => m.user && projectMemberIds.has(m.user.toString()),
    );

    // 2. Filet de sécurité : détecte "@Nom" tapé à la main
    const alreadyMatchedOffsets = new Set(
      structuredMentions.map((m) => m.offset),
    );
    const fallbackMentions = [];

    for (const member of project.members) {
      const name = member.user.name;
      if (!name) continue;

      const pattern = `@${name}`;
      let searchFrom = 0;
      let idx = text.indexOf(pattern, searchFrom);

      while (idx !== -1) {
        if (!alreadyMatchedOffsets.has(idx)) {
          fallbackMentions.push({
            user: member.user._id,
            offset: idx,
            length: pattern.length,
          });
          alreadyMatchedOffsets.add(idx);
        }
        searchFrom = idx + pattern.length;
        idx = text.indexOf(pattern, searchFrom);
      }
    }

    const validMentions = [...structuredMentions, ...fallbackMentions];

    const newComment = await Comment.create({
      text,
      task: taskId,
      author: req.user._id,
      mentions: validMentions,
    });

    task.comments.push(newComment._id);
    await task.save();

    const mentionedIds = new Set(validMentions.map((m) => m.user.toString()));

    for (const mentionedId of mentionedIds) {
      await notify({
        recipient: mentionedId,
        sender: req.user._id,
        type: "mentioned",
        message: `${req.user.name} mentioned you in a comment on: "${task.title}"`,
        link: `/workspaces/${project.workspace}/projects/${project._id}/tasks/${task._id}`,
      });
    }

    const commentRecipients = new Set([
      ...task.assignees.map((a) => a.toString()),
      ...task.watchers.map((w) => w.toString()),
    ]);

    for (const recipientId of commentRecipients) {
      if (mentionedIds.has(recipientId)) continue;

      await notify({
        recipient: recipientId,
        sender: req.user._id,
        type: "comment_added",
        message: `${req.user.name} commented on task: "${task.title}"`,
        link: `/workspaces/${project.workspace}/projects/${project._id}/tasks/${task._id}`,
      });
    }

    await recordActivity(req.user._id, "added_comment", "Task", taskId, {
      description: `added comment ${
        text.substring(0, 50) + (text.length > 50 ? "..." : "")
      }`,
    });

    const populated = await newComment.populate([
      { path: "author", select: "name profilePicture" },
      { path: "mentions.user", select: "name profilePicture" },
    ]);

    emitInvalidate(`task:${taskId}`, ["comments", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(201).json(populated);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const watchTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const isWatching = task.watchers.includes(req.user._id);

    if (!isWatching) {
      task.watchers.push(req.user._id);
    } else {
      task.watchers = task.watchers.filter(
        (watcher) => watcher.toString() !== req.user._id.toString(),
      );
    }

    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `${
        isWatching ? "stopped watching" : "started watching"
      } task ${task.title}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const achievedTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const isAchieved = task.isArchived;

    task.isArchived = !isAchieved;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `${isAchieved ? "unachieved" : "achieved"} task ${
        task.title
      }`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);
    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignees: { $in: [req.user._id] } })
      .populate("project", "title workspace")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const { allowed } = hasProjectPermission(project, req.user._id, "manager");

    if (!allowed) {
      return res.status(403).json({
        message: "You need manager access to delete tasks",
      });
    }

    await Task.findByIdAndDelete(taskId);

    await recordActivity(req.user._id, "deleted_task", "Task", taskId, {
      description: `deleted task ${task.title}`,
    });

    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);
    emitInvalidate(`workspace:${project.workspace}`, [
      "workspace",
      project.workspace.toString(),
      "stats",
    ]);

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const addAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "taskhub/attachments",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(req.file.buffer);
    });

    task.attachments.push({
      fileName: req.file.originalname,
      fileUrl: uploadResult.secure_url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });

    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `added attachment ${req.file.originalname}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(201).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

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

    const attachment = task.attachments.id(attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const fileName = attachment.fileName;
    task.attachments.pull({ _id: attachmentId });
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `removed attachment ${fileName}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const startTimer = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

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

    const hasActiveEntry = task.timeEntries.some(
      (entry) =>
        entry.user.toString() === req.user._id.toString() && !entry.endTime,
    );

    if (hasActiveEntry) {
      return res.status(400).json({
        message: "You already have a timer running on this task",
      });
    }

    task.timeEntries.push({
      user: req.user._id,
      startTime: new Date(),
    });

    await task.save();

    emitInvalidate(`task:${taskId}`, ["task", taskId]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const stopTimer = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

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

    const activeEntry = task.timeEntries.find(
      (entry) =>
        entry.user.toString() === req.user._id.toString() && !entry.endTime,
    );

    if (!activeEntry) {
      return res.status(400).json({
        message: "No active timer found for this task",
      });
    }

    activeEntry.endTime = new Date();
    activeEntry.duration = Math.round(
      (activeEntry.endTime - activeEntry.startTime) / 1000,
    );

    const totalSeconds = task.timeEntries.reduce(
      (acc, entry) => acc + (entry.duration || 0),
      0,
    );
    task.actualHours = Math.round((totalSeconds / 3600) * 100) / 100;

    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `logged ${Math.round(
        activeEntry.duration / 60,
      )} minutes on task ${task.title}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addManualTimeEntry = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { startTime, endTime } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

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

    const duration = Math.round((end - start) / 1000);

    task.timeEntries.push({
      user: req.user._id,
      startTime: start,
      endTime: end,
      duration,
    });

    const totalSeconds = task.timeEntries.reduce(
      (acc, entry) => acc + (entry.duration || 0),
      0,
    );
    task.actualHours = Math.round((totalSeconds / 3600) * 100) / 100;

    await task.save();

    emitInvalidate(`task:${taskId}`, ["task", taskId]);

    res.status(201).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTimeEntry = async (req, res) => {
  try {
    const { taskId, entryId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

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

    task.timeEntries.pull({ _id: entryId });

    const totalSeconds = task.timeEntries.reduce(
      (acc, entry) => acc + (entry.duration || 0),
      0,
    );
    task.actualHours = Math.round((totalSeconds / 3600) * 100) / 100;

    await task.save();

    emitInvalidate(`task:${taskId}`, ["task", taskId]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskSchedule = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { startDate, dueDate } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

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

    if (startDate) task.startDate = new Date(startDate);
    if (dueDate) task.dueDate = new Date(dueDate);

    if (task.startDate && task.dueDate && task.startDate > task.dueDate) {
      return res
        .status(400)
        .json({ message: "Start date must be before due date" });
    }

    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated schedule for task ${task.title}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);
    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dependencies } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

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

    if (dependencies.includes(taskId)) {
      return res
        .status(400)
        .json({ message: "A task cannot depend on itself" });
    }

    const allProjectTasks = await Task.find({ project: task.project }).select(
      "_id dependencies",
    );
    const projectTaskIds = new Set(
      allProjectTasks.map((t) => t._id.toString()),
    );

    for (const depId of dependencies) {
      if (!projectTaskIds.has(depId)) {
        return res.status(400).json({
          message: "All dependencies must belong to the same project",
        });
      }
    }

    const graph = new Map();
    for (const t of allProjectTasks) {
      graph.set(
        t._id.toString(),
        (t.dependencies || []).map((d) => d.toString()),
      );
    }
    graph.set(taskId, dependencies);

    const visiting = new Set();
    const visited = new Set();

    const hasCycle = (nodeId) => {
      if (visiting.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visiting.add(nodeId);
      for (const dep of graph.get(nodeId) || []) {
        if (hasCycle(dep)) return true;
      }
      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };

    if (hasCycle(taskId)) {
      return res.status(400).json({
        message: "This would create a circular dependency",
      });
    }

    task.dependencies = dependencies;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", taskId, {
      description: `updated dependencies for task ${task.title}`,
    });

    emitInvalidate(`task:${taskId}`, ["task", taskId]);
    emitInvalidate(`task:${taskId}`, ["task-activity", taskId]);
    emitInvalidate(`project:${project._id}`, [
      "project",
      project._id.toString(),
    ]);

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createTask,
  getTaskById,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskStatus,
  updateTaskAssignees,
  updateTaskPriority,
  addSubTask,
  updateSubTask,
  getActivityByResourceId,
  getCommentsByTaskId,
  addComment,
  watchTask,
  achievedTask,
  getMyTasks,
  deleteTask,
  addAttachment,
  deleteAttachment,
  startTimer,
  stopTimer,
  addManualTimeEntry,
  deleteTimeEntry,
  updateTaskDependencies,
  updateTaskSchedule,
};
