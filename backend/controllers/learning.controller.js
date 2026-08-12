import LearningDomain from "../models/learning-domain.model.js";
import LearningPath from "../models/learning-path.model.js";
import LearningNote from "../models/learning-note.model.js";
import LearningProgress from "../models/learning-progress.model.js";
import LearningRating from "../models/learning-rating.model.js";
import LearningReport from "../models/learning-report.model.js";
import { recalculateRatingStats } from "../libs/learning-stats.js";
import { recalculateReputation } from "../libs/learning-reputation.js";
import LearningReputation from "../models/learning-reputation.model.js";
import User from "../models/user.model.js";
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

// ===== DOMAINS =====

export const createDomain = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    const slug = slugify(name);
    const existing = await LearningDomain.findOne({ slug });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A domain with this name already exists" });
    }

    const domain = await LearningDomain.create({
      name,
      description,
      icon,
      slug,
      createdBy: req.user._id,
    });

    res.status(201).json(domain);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDomains = async (req, res) => {
  try {
    const domains = await LearningDomain.find().sort({ name: 1 });

    // Nombre de paths publiés par domaine (agrégation légère)
    const domainsWithCounts = await Promise.all(
      domains.map(async (domain) => {
        const pathCount = await LearningPath.countDocuments({
          domain: domain._id,
          status: "published",
        });
        return { ...domain.toObject(), pathCount };
      }),
    );

    res.status(200).json(domainsWithCounts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDomainBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const domain = await LearningDomain.findOne({ slug });
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const paths = await LearningPath.find({
      domain: domain._id,
      status: "published",
    })
      .populate("createdBy", "name profilePicture")
      .sort({ "stats.averageRating": -1 });

    res.status(200).json({ domain, paths });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== PATHS =====

export const createPath = async (req, res) => {
  try {
    const { domainId, title, description, difficulty, tags, prerequisites } =
      req.body;

    const domain = await LearningDomain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    // On restreint les prérequis aux paths du même domaine, pour garder la roadmap cohérente
    let validPrerequisites = [];
    if (Array.isArray(prerequisites) && prerequisites.length > 0) {
      const found = await LearningPath.find({
        _id: { $in: prerequisites },
        domain: domainId,
      }).select("_id");
      validPrerequisites = found.map((p) => p._id);
    }

    const path = await LearningPath.create({
      domain: domainId,
      title,
      description,
      difficulty,
      tags: tags || [],
      prerequisites: validPrerequisites,
      createdBy: req.user._id,
    });

    res.status(201).json(path);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPathById = async (req, res) => {
  try {
    const { pathId } = req.params;

    const path = await LearningPath.findById(pathId)
      .populate("domain", "name slug")
      .populate("createdBy", "name profilePicture")
      .populate({
        path: "noteOrder",
        select: "title order status stats",
      })
      .populate({
        path: "prerequisites",
        select: "title difficulty stats",
      });

    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    if (
      path.status === "draft" &&
      path.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "This path is not published yet" });
    }

    const progress = await LearningProgress.findOne({
      user: req.user._id,
      path: pathId,
    });

    // Statut de complétion de chaque prérequis pour cet utilisateur (pour affichage indicatif)
    let prerequisitesStatus = [];
    if (path.prerequisites.length > 0) {
      const prereqProgress = await LearningProgress.find({
        user: req.user._id,
        path: { $in: path.prerequisites.map((p) => p._id) },
      }).select("path completedAt");

      const completedMap = new Map(
        prereqProgress.map((p) => [p.path.toString(), !!p.completedAt]),
      );

      prerequisitesStatus = path.prerequisites.map((p) => ({
        _id: p._id,
        title: p.title,
        difficulty: p.difficulty,
        completed: completedMap.get(p._id.toString()) || false,
      }));
    }

    res
      .status(200)
      .json({ path, progress: progress || null, prerequisitesStatus });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePath = async (req, res) => {
  try {
    const { pathId } = req.params;
    const { title, description, difficulty, tags, status, prerequisites } =
      req.body;

    const path = await LearningPath.findById(pathId);
    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    if (path.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own paths" });
    }

    if (title !== undefined) path.title = title;
    if (description !== undefined) path.description = description;
    if (difficulty !== undefined) path.difficulty = difficulty;
    if (tags !== undefined) path.tags = tags;

    if (prerequisites !== undefined) {
      const found = await LearningPath.find({
        _id: { $in: prerequisites, $ne: pathId }, // empêche l'auto-référence
        domain: path.domain,
      }).select("_id");
      path.prerequisites = found.map((p) => p._id);
    }

    if (status === "published" && path.status !== "published") {
      const publishedNotesCount = await LearningNote.countDocuments({
        path: pathId,
        status: "published",
      });
      if (publishedNotesCount === 0) {
        return res.status(400).json({
          message:
            "Add at least one published note before publishing this path",
        });
      }
    }
    const wasPublished = path.status === "published";
    if (status !== undefined) path.status = status;

    await path.save();

    if (!wasPublished && path.status === "published") {
      await recalculateReputation(path.createdBy);
    }

    res.status(200).json(path);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePath = async (req, res) => {
  try {
    const { pathId } = req.params;

    const path = await LearningPath.findById(pathId);
    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    if (path.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own paths" });
    }

    await LearningNote.deleteMany({ path: pathId });
    await LearningProgress.deleteMany({ path: pathId });
    await LearningRating.deleteMany({ targetType: "path", targetId: pathId });
    await path.deleteOne();

    res.status(200).json({ message: "Path deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyPaths = async (req, res) => {
  try {
    const paths = await LearningPath.find({ createdBy: req.user._id })
      .populate("domain", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json(paths);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== NOTES =====

const extractLinkedTitles = (content) => {
  const matches = [...content.matchAll(/\[\[([^\]]+)\]\]/g)];
  return matches.map((m) => m[1].trim());
};

export const createNote = async (req, res) => {
  try {
    const { pathId } = req.params;
    const { title, content, relatedNotes } = req.body;

    const path = await LearningPath.findById(pathId);
    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    if (path.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only add notes to your own paths" });
    }

    const linkedTitles = extractLinkedTitles(content);
    const linkedNotes = linkedTitles.length
      ? await LearningNote.find({
          path: pathId,
          title: { $in: linkedTitles },
        }).select("_id")
      : [];

    // Références manuelles vers des notes d'autres paths du même domaine
    let validRelated = [];
    if (Array.isArray(relatedNotes) && relatedNotes.length > 0) {
      const found = await LearningNote.find({
        _id: { $in: relatedNotes },
        status: "published",
      }).select("_id");
      validRelated = found.map((n) => n._id);
    }

    const order = path.noteOrder.length;

    const note = await LearningNote.create({
      path: pathId,
      title,
      content,
      order,
      createdBy: req.user._id,
      linkedNotes: linkedNotes.map((n) => n._id),
      relatedNotes: validRelated,
    });

    path.noteOrder.push(note._id);
    await path.save();

    res.status(201).json(note);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await LearningNote.findById(noteId)
      .populate("createdBy", "name profilePicture")
      .populate("linkedNotes", "title status")
      .populate({
        path: "relatedNotes",
        select: "title status path",
        populate: { path: "path", select: "title" },
      });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (
      note.status === "draft" &&
      note.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "This note is not published yet" });
    }

    res.status(200).json(note);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content, status, relatedNotes } = req.body;

    const note = await LearningNote.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own notes" });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) {
      note.content = content;
      const linkedTitles = extractLinkedTitles(content);
      const linkedNotes = linkedTitles.length
        ? await LearningNote.find({
            path: note.path,
            title: { $in: linkedTitles },
            _id: { $ne: note._id },
          }).select("_id")
        : [];
      note.linkedNotes = linkedNotes.map((n) => n._id);
    }

    if (relatedNotes !== undefined) {
      const found = await LearningNote.find({
        _id: { $in: relatedNotes, $ne: note._id },
        status: "published",
      }).select("_id");
      note.relatedNotes = found.map((n) => n._id);
    }

    const wasPublished = note.status === "published";
    if (status !== undefined) note.status = status;
    await note.save();

    if (!wasPublished && note.status === "published") {
      await recalculateReputation(note.createdBy);
    }

    res.status(200).json(note);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await LearningNote.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own notes" });
    }

    await LearningPath.findByIdAndUpdate(note.path, {
      $pull: { noteOrder: note._id },
    });
    await LearningRating.deleteMany({ targetType: "note", targetId: noteId });
    await note.deleteOne();

    res.status(200).json({ message: "Note deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reorderNotes = async (req, res) => {
  try {
    const { pathId } = req.params;
    const { noteIds } = req.body; // array ordonné d'IDs de notes

    const path = await LearningPath.findById(pathId);
    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    if (path.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only reorder your own path" });
    }

    // Vérifie que tous les IDs fournis appartiennent bien à ce path
    const existingIds = new Set(path.noteOrder.map((id) => id.toString()));
    const isValid = noteIds.every((id) => existingIds.has(id));
    if (!isValid || noteIds.length !== path.noteOrder.length) {
      return res.status(400).json({ message: "Invalid note order" });
    }

    path.noteOrder = noteIds;
    await path.save();

    await LearningNote.updateMany(
      {},
      [], // pas de bulk facile ici avec position ; on fait une boucle
    );

    for (let i = 0; i < noteIds.length; i++) {
      await LearningNote.findByIdAndUpdate(noteIds[i], { order: i });
    }

    res.status(200).json({ message: "Notes reordered" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== PROGRESSION =====

export const enrollInPath = async (req, res) => {
  try {
    const { pathId } = req.params;

    const path = await LearningPath.findById(pathId);
    if (!path || path.status !== "published") {
      return res.status(404).json({ message: "Path not found" });
    }

    const existing = await LearningProgress.findOne({
      user: req.user._id,
      path: pathId,
    });
    if (existing) {
      return res.status(200).json(existing);
    }

    const firstNoteId = path.noteOrder[0] || null;

    const progress = await LearningProgress.create({
      user: req.user._id,
      path: pathId,
      completedNotes: [],
      currentNote: firstNoteId,
    });

    path.stats.enrolledCount += 1;
    await path.save();

    res.status(201).json(progress);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markNoteComplete = async (req, res) => {
  try {
    const { pathId, noteId } = req.params;

    const progress = await LearningProgress.findOne({
      user: req.user._id,
      path: pathId,
    });

    if (!progress) {
      return res
        .status(404)
        .json({ message: "You are not enrolled in this path" });
    }

    if (!progress.completedNotes.includes(noteId)) {
      progress.completedNotes.push(noteId);
    }

    const path = await LearningPath.findById(pathId);
    const currentIndex = path.noteOrder.findIndex(
      (id) => id.toString() === noteId,
    );
    const nextNoteId = path.noteOrder[currentIndex + 1] || null;
    progress.currentNote = nextNoteId;

    const isPathComplete = path.noteOrder.every((id) =>
      progress.completedNotes.some((c) => c.toString() === id.toString()),
    );

    if (isPathComplete && !progress.completedAt) {
      progress.completedAt = new Date();
      path.stats.completionCount += 1;
      await path.save();
      await recalculateReputation(path.createdBy);
    }

    await progress.save();

    res.status(200).json(progress);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyProgress = async (req, res) => {
  try {
    const progressList = await LearningProgress.find({ user: req.user._id })
      .populate({
        path: "path",
        select: "title domain stats noteOrder",
        populate: { path: "domain", select: "name slug" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(progressList);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== RATING =====

export const rateTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { stars } = req.body;

    if (!["path", "note"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Stars must be between 1 and 5" });
    }

    // Anti auto-notation (mentionné dans les manques Phase 4, autant le poser maintenant)
    const TargetModel = targetType === "path" ? LearningPath : LearningNote;
    const target = await TargetModel.findById(targetId).select("createdBy");
    if (!target) {
      return res.status(404).json({ message: "Target not found" });
    }
    if (target.createdBy.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot rate your own content" });
    }

    await LearningRating.findOneAndUpdate(
      { user: req.user._id, targetType, targetId },
      { stars },
      { upsert: true, new: true },
    );

    const stats = await recalculateRatingStats(targetType, targetId);
    await recalculateReputation(target.createdBy);

    res.status(200).json(stats);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyRating = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    const rating = await LearningRating.findOne({
      user: req.user._id,
      targetType,
      targetId,
    });

    res.status(200).json({ stars: rating?.stars || 0 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== DÉCOUVERTE =====

export const discoverPaths = async (req, res) => {
  try {
    const { sort = "trending", domain, difficulty, search } = req.query;

    const filter = { status: "published" };
    if (domain) filter.domain = domain;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.title = { $regex: search, $options: "i" };

    let sortOption = { createdAt: -1 };
    if (sort === "best-rated") sortOption = { "stats.averageRating": -1 };
    if (sort === "most-completed") sortOption = { "stats.completionCount": -1 };
    if (sort === "trending") sortOption = { "stats.enrolledCount": -1 };

    const paths = await LearningPath.find(filter)
      .populate("domain", "name slug")
      .populate("createdBy", "name profilePicture")
      .sort(sortOption)
      .limit(30);

    res.status(200).json(paths);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPathNotesForEditing = async (req, res) => {
  try {
    const { pathId } = req.params;

    const path = await LearningPath.findById(pathId)
      .populate("domain", "name slug")
      .populate({
        path: "noteOrder",
        select: "title content status order stats linkedNotes relatedNotes",
      });

    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    if (path.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own paths" });
    }

    res.status(200).json(path);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkSimilarDomains = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 2) {
      return res.status(200).json([]);
    }

    const similar = await LearningDomain.find({
      name: { $regex: name.trim(), $options: "i" },
    }).limit(5);

    res.status(200).json(similar);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const reportContent = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { reason, details } = req.body;

    if (!["path", "note", "domain"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }

    const report = await LearningReport.create({
      reportedBy: req.user._id,
      targetType,
      targetId,
      reason,
      details,
    });

    res.status(201).json(report);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== REPUTATION =====

export const getReputation = async (req, res) => {
  try {
    const { userId } = req.params;

    const reputation = await LearningReputation.findOne({ user: userId });

    res
      .status(200)
      .json(
        reputation || { user: userId, score: 0, breakdown: {}, badges: [] },
      );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await LearningReputation.find({ score: { $gt: 0 } })
      .populate("user", "name profilePicture")
      .sort({ score: -1 })
      .limit(20);

    res.status(200).json(leaderboard);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// ===== GRAPH =====

export const getPathGraph = async (req, res) => {
  try {
    const { pathId } = req.params;

    const path = await LearningPath.findById(pathId).select("createdBy");
    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    const isOwner = path.createdBy.toString() === req.user._id.toString();

    const notesFilter = isOwner
      ? { path: pathId }
      : { path: pathId, status: "published" };

    const notes = await LearningNote.find(notesFilter)
      .select("title status order linkedNotes stats")
      .sort({ order: 1 });

    const visibleIds = new Set(notes.map((n) => n._id.toString()));

    const nodes = notes.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      status: n.status,
      order: n.order,
      averageRating: n.stats.averageRating,
      ratingCount: n.stats.ratingCount,
    }));

    const edges = [];

    // Colonne vertébrale : l'ordre des notes dans le path forme la structure de base
    for (let i = 0; i < notes.length - 1; i++) {
      edges.push({
        source: notes[i]._id.toString(),
        target: notes[i + 1]._id.toString(),
        type: "sequence",
      });
    }

    // Liens explicites via [[wikilinks]], en plus de la séquence
    notes.forEach((n) => {
      n.linkedNotes.forEach((linkedId) => {
        const targetId = linkedId.toString();
        if (visibleIds.has(targetId) && targetId !== n._id.toString()) {
          edges.push({
            source: n._id.toString(),
            target: targetId,
            type: "wikilink",
          });
        }
      });
    });

    res.status(200).json({ nodes, edges });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// ===== DOMAIN GRAPH =====

export const getDomainGraph = async (req, res) => {
  try {
    const { slug } = req.params;

    const domain = await LearningDomain.findOne({ slug });
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const paths = await LearningPath.find({
      domain: domain._id,
      status: "published",
    }).select("title");

    const pathIds = paths.map((p) => p._id);
    const pathTitleById = new Map(
      paths.map((p) => [p._id.toString(), p.title]),
    );

    const notes = await LearningNote.find({
      path: { $in: pathIds },
      status: "published",
    }).select("title path order linkedNotes relatedNotes stats");

    const visibleIds = new Set(notes.map((n) => n._id.toString()));

    const nodes = notes.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      pathId: n.path.toString(),
      pathTitle: pathTitleById.get(n.path.toString()) || "Unknown path",
      averageRating: n.stats.averageRating,
      ratingCount: n.stats.ratingCount,
    }));

    const edges = [];

    const notesByPath = new Map();
    notes.forEach((n) => {
      const key = n.path.toString();
      if (!notesByPath.has(key)) notesByPath.set(key, []);
      notesByPath.get(key).push(n);
    });
    notesByPath.forEach((pathNotes) => {
      pathNotes.sort((a, b) => a.order - b.order);
      for (let i = 0; i < pathNotes.length - 1; i++) {
        edges.push({
          source: pathNotes[i]._id.toString(),
          target: pathNotes[i + 1]._id.toString(),
          type: "sequence",
        });
      }
    });

    notes.forEach((n) => {
      n.linkedNotes.forEach((linkedId) => {
        const targetId = linkedId.toString();
        if (visibleIds.has(targetId) && targetId !== n._id.toString()) {
          edges.push({
            source: n._id.toString(),
            target: targetId,
            type: "wikilink",
          });
        }
      });
      n.relatedNotes.forEach((relatedId) => {
        const targetId = relatedId.toString();
        if (visibleIds.has(targetId) && targetId !== n._id.toString()) {
          edges.push({
            source: n._id.toString(),
            target: targetId,
            type: "reference",
          });
        }
      });
    });

    res.status(200).json({
      domain: { name: domain.name, slug: domain.slug },
      pathCount: paths.length,
      nodes,
      edges,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// ===== DOMAIN ROADMAP (paths reliés par prérequis) =====

export const getDomainRoadmap = async (req, res) => {
  try {
    const { slug } = req.params;

    const domain = await LearningDomain.findOne({ slug });
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const paths = await LearningPath.find({
      domain: domain._id,
      status: "published",
    }).select("title difficulty stats prerequisites createdBy");

    const pathIds = paths.map((p) => p._id);

    const progressList = await LearningProgress.find({
      user: req.user._id,
      path: { $in: pathIds },
    }).select("path completedAt");

    const progressByPath = new Map(
      progressList.map((p) => [
        p.path.toString(),
        p.completedAt ? "completed" : "in-progress",
      ]),
    );

    const nodes = paths.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      difficulty: p.difficulty,
      averageRating: p.stats.averageRating,
      status: progressByPath.get(p._id.toString()) || "not-started",
    }));

    const edges = [];
    paths.forEach((p) => {
      p.prerequisites.forEach((prereqId) => {
        edges.push({
          source: prereqId.toString(),
          target: p._id.toString(),
        });
      });
    });

    res.status(200).json({
      domain: { name: domain.name, slug: domain.slug },
      nodes,
      edges,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getSuggestedNextPaths = async (req, res) => {
  try {
    const { pathId } = req.params;

    const path = await LearningPath.findById(pathId).select("domain");
    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    // Paths du même domaine qui déclarent celui-ci comme prérequis
    let candidates = await LearningPath.find({
      domain: path.domain,
      status: "published",
      prerequisites: pathId,
    })
      .select("title difficulty stats")
      .limit(5);

    // Repli : si aucun path ne déclare celui-ci comme prérequis,
    // on propose d'autres paths du domaine pas encore terminés
    if (candidates.length === 0) {
      const myProgress = await LearningProgress.find({
        user: req.user._id,
      }).select("path completedAt");
      const completedIds = myProgress
        .filter((p) => p.completedAt)
        .map((p) => p.path.toString());

      candidates = await LearningPath.find({
        domain: path.domain,
        status: "published",
        _id: { $nin: [...completedIds, pathId] },
      })
        .select("title difficulty stats")
        .sort({ "stats.averageRating": -1 })
        .limit(3);
    }

    res.status(200).json(candidates);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDomainNotesForLinking = async (req, res) => {
  try {
    const { domainId } = req.params;

    const paths = await LearningPath.find({
      domain: domainId,
      status: "published",
    }).select("title");

    const pathIds = paths.map((p) => p._id);
    const pathTitleById = new Map(
      paths.map((p) => [p._id.toString(), p.title]),
    );

    const notes = await LearningNote.find({
      path: { $in: pathIds },
      status: "published",
    }).select("title path");

    const result = notes.map((n) => ({
      _id: n._id.toString(),
      title: n.title,
      pathId: n.path.toString(),
      pathTitle: pathTitleById.get(n.path.toString()) || "Unknown path",
    }));

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ===== MODERATION =====

export const getReports = async (req, res) => {
  try {
    const { status = "open" } = req.query;

    const filter = status === "all" ? {} : { status };

    const reports = await LearningReport.find(filter)
      .populate("reportedBy", "name profilePicture")
      .sort({ createdAt: -1 })
      .limit(100);

    const enriched = await Promise.all(
      reports.map(async (report) => {
        let target = null;
        if (report.targetType === "path") {
          target = await LearningPath.findById(report.targetId)
            .select("title status createdBy")
            .populate("createdBy", "name isBanned");
        } else if (report.targetType === "note") {
          target = await LearningNote.findById(report.targetId)
            .select("title status createdBy path")
            .populate("createdBy", "name isBanned");
        } else if (report.targetType === "domain") {
          target = await LearningDomain.findById(report.targetId)
            .select("name createdBy")
            .populate("createdBy", "name isBanned");
        }
        return { ...report.toObject(), target };
      }),
    );

    res.status(200).json(enriched);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!["open", "reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await LearningReport.findByIdAndUpdate(
      reportId,
      { status },
      { new: true },
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const moderateDeleteDomain = async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await LearningDomain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const paths = await LearningPath.find({ domain: domainId }).select("_id");
    const pathIds = paths.map((p) => p._id);

    await LearningNote.deleteMany({ path: { $in: pathIds } });
    await LearningProgress.deleteMany({ path: { $in: pathIds } });
    await LearningRating.deleteMany({
      targetType: "path",
      targetId: { $in: pathIds },
    });
    await LearningPath.deleteMany({ domain: domainId });
    await domain.deleteOne();

    res.status(200).json({ message: "Domain and all its content deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const moderateDeleteContent = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (targetType === "note") {
      const note = await LearningNote.findById(targetId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      await LearningPath.findByIdAndUpdate(note.path, {
        $pull: { noteOrder: note._id },
      });
      await LearningRating.deleteMany({ targetType: "note", targetId });
      await note.deleteOne();
    } else if (targetType === "path") {
      const path = await LearningPath.findById(targetId);
      if (!path) {
        return res.status(404).json({ message: "Path not found" });
      }
      await LearningNote.deleteMany({ path: targetId });
      await LearningProgress.deleteMany({ path: targetId });
      await LearningRating.deleteMany({ targetType: "path", targetId });
      await path.deleteOne();
    } else {
      return res
        .status(400)
        .json({ message: "Only paths and notes can be deleted this way" });
    }

    // Nettoie les signalements liés au contenu supprimé, plus la peine de les garder ouverts
    await LearningReport.updateMany(
      { targetType, targetId },
      { status: "reviewed" },
    );

    res.status(200).json({ message: "Content deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const moderateBanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true },
    ).select("name email isBanned");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const moderateUnbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: false },
      { new: true },
    ).select("name email isBanned");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
