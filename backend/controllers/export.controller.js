import PDFDocument from "pdfkit";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import { hasProjectPermission } from "../libs/permissions.js";

const escapeCsvField = (field) => {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const getExportData = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project) return { project: null };

  const { allowed } = hasProjectPermission(project, userId, "viewer");
  if (!allowed) return { project, allowed: false };

  const tasks = await Task.find({ project: projectId, isArchived: false })
    .populate("assignees", "name")
    .sort({ createdAt: -1 });

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Done").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const todo = tasks.filter((t) => t.status === "To Do").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    project,
    allowed: true,
    tasks,
    stats: { total, done, inProgress, todo, progress },
  };
};

export const exportProjectCSV = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { project, allowed, tasks, stats } = await getExportData(
      projectId,
      req.user._id,
    );

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!allowed)
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });

    const header = [
      "Title",
      "Status",
      "Priority",
      "Assignees",
      "Start Date",
      "Due Date",
    ];

    const rows = tasks.map((t) => [
      t.title,
      t.status,
      t.priority,
      (t.assignees || []).map((a) => a.name).join("; "),
      t.startDate ? new Date(t.startDate).toLocaleDateString() : "",
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "",
    ]);

    const summaryLines = [
      `Project,${escapeCsvField(project.title)}`,
      `Progress,${stats.progress}%`,
      `Total Tasks,${stats.total}`,
      `To Do,${stats.todo}`,
      `In Progress,${stats.inProgress}`,
      `Done,${stats.done}`,
      "",
    ];

    const csvLines = [
      ...summaryLines,
      header.map(escapeCsvField).join(","),
      ...rows.map((r) => r.map(escapeCsvField).join(",")),
    ];

    const csv = csvLines.join("\n");
    const filename = `${project.title.replace(/[^a-z0-9]/gi, "_")}_export.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const exportProjectPDF = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { project, allowed, tasks, stats } = await getExportData(
      projectId,
      req.user._id,
    );

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!allowed)
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });

    const filename = `${project.title.replace(/[^a-z0-9]/gi, "_")}_report.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(20).font("Helvetica-Bold").text(project.title);
    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Generated on ${new Date().toLocaleDateString()}`);
    doc.moveDown(1);

    if (project.description) {
      doc.fontSize(11).fillColor("#333333").text(project.description);
      doc.moveDown(1);
    }

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Overview");
    doc.moveDown(0.5);

    const statsY = doc.y;
    const statBoxWidth = 100;
    const statItems = [
      { label: "Progress", value: `${stats.progress}%` },
      { label: "Total Tasks", value: stats.total },
      { label: "To Do", value: stats.todo },
      { label: "In Progress", value: stats.inProgress },
      { label: "Done", value: stats.done },
    ];

    statItems.forEach((item, i) => {
      const x = doc.page.margins.left + i * statBoxWidth;
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(String(item.value), x, statsY, { width: statBoxWidth });
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text(item.label, x, statsY + 24, { width: statBoxWidth });
      doc.fillColor("#000000");
    });

    doc.y = statsY + 50;
    doc.moveDown(1.5);

    const barWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const barY = doc.y;
    doc.rect(doc.page.margins.left, barY, barWidth, 8).fill("#e5e7eb");
    doc
      .rect(doc.page.margins.left, barY, (barWidth * stats.progress) / 100, 8)
      .fill("#3b82f6");
    doc.fillColor("#000000");
    doc.moveDown(2);

    doc.fontSize(14).font("Helvetica-Bold").text("Tasks");
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const columns = [
      { label: "Title", width: 160 },
      { label: "Status", width: 70 },
      { label: "Priority", width: 60 },
      { label: "Assignees", width: 110 },
      { label: "Due Date", width: 80 },
    ];

    let x = doc.page.margins.left;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
    columns.forEach((col) => {
      doc.text(col.label, x, tableTop, { width: col.width });
      x += col.width;
    });

    doc
      .moveTo(doc.page.margins.left, tableTop + 14)
      .lineTo(doc.page.width - doc.page.margins.right, tableTop + 14)
      .strokeColor("#d1d5db")
      .stroke();

    let y = tableTop + 20;
    doc.font("Helvetica").fillColor("#111111");

    tasks.forEach((task) => {
      if (y > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      x = doc.page.margins.left;
      const rowValues = [
        task.title,
        task.status,
        task.priority,
        (task.assignees || []).map((a) => a.name).join(", ") || "-",
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-",
      ];

      const rowHeight = doc.heightOfString(rowValues[0], {
        width: columns[0].width,
      });

      rowValues.forEach((val, i) => {
        doc.fontSize(9).text(String(val), x, y, { width: columns[i].width });
        x += columns[i].width;
      });

      y += Math.max(rowHeight, 16) + 6;
    });

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
