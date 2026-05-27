import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getIsConnected } from "../config/database";
import AssignmentModel from "../models/Assignment";
import { memStore } from "../store/memoryStore";
import { runJobInline } from "../services/jobRunner";
import { enqueueGeneration } from "../queue/generationQueue";
import { isRedisAvailable } from "../config/redis";

const router = Router();

const questionTypeSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  count: z.number().int().min(1).max(50),
  marksPerQuestion: z.number().int().min(1).max(20),
});

const createSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  schoolName: z.string().optional().default("Delhi Public School"),
  dueDate: z.string().min(1),
  assignedOn: z.string().optional(),
  questionTypes: z.array(questionTypeSchema).min(1),
  additionalInstructions: z.string().optional().default(""),
  timeAllowed: z.number().optional().default(45),
  uploadedFile: z.object({ name: z.string(), content: z.string(), type: z.string() }).optional().nullable(),
});

// ── Helper: dispatch job via BullMQ or inline ─────────────────────────────
async function dispatchJob(
  jobId: string,
  assignmentId: string,
  params: Record<string, unknown>
) {
  // Register in memStore so polling always works
  memStore.createJob({
    id: jobId, assignmentId, status: "waiting", progress: 0, message: "Queued...",
    data: { assignmentId, ...params },
  });

  // Try BullMQ first
  if (isRedisAvailable()) {
    const queued = await enqueueGeneration({
      jobId, assignmentId,
      title: String(params.title || ""),
      subject: String(params.subject || ""),
      className: String(params.className || ""),
      schoolName: String(params.schoolName || "Delhi Public School"),
      timeAllowed: Number(params.timeAllowed || 45),
      questionTypes: (params.questionTypes as unknown[]) || [],
      additionalInstructions: String(params.additionalInstructions || ""),
      uploadedFileContent: params.uploadedFileContent as string | undefined,
    });
    if (queued) return "bullmq";
  }

  // Fallback: inline runner
  setImmediate(() => runJobInline(jobId, assignmentId, params));
  return "inline";
}

// ── GET all ───────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (getIsConnected()) {
    try {
      const filter = userId ? { userId: String(userId) } : {};
      const docs = await AssignmentModel.find(filter).sort({ createdAt: -1 }).lean();
      return res.json(docs.map((d) => ({ ...d, id: d._id.toString() })));
    } catch (err) {
      console.error("GET assignments error:", err);
      return res.status(500).json({ error: "Failed to fetch assignments" });
    }
  }
  return res.json(memStore.getAllAssignments());
});

// ── GET single ────────────────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  if (getIsConnected()) {
    try {
      const doc = await AssignmentModel.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: "Not found" });
      return res.json({ ...doc, id: doc._id.toString() });
    } catch {
      return res.status(404).json({ error: "Not found" });
    }
  }
  const a = memStore.getAssignment(req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  return res.json(a);
});

// ── POST create ───────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const jobId = uuidv4();
    const jobParams = {
      title: data.title, subject: data.subject, className: data.className,
      schoolName: data.schoolName, timeAllowed: data.timeAllowed,
      questionTypes: data.questionTypes, additionalInstructions: data.additionalInstructions,
      uploadedFileContent: data.uploadedFile?.content,
    };

    if (getIsConnected()) {
      const doc = await AssignmentModel.create({
        userId: data.userId, title: data.title, subject: data.subject,
        className: data.className, schoolName: data.schoolName,
        dueDate: data.dueDate, assignedOn: data.assignedOn || new Date().toISOString(),
        questionTypes: data.questionTypes, additionalInstructions: data.additionalInstructions,
        timeAllowed: data.timeAllowed, status: "generating", jobId,
        uploadedFile: data.uploadedFile ?? undefined,
      });

      const assignmentId = doc._id.toString();
      const provider = await dispatchJob(jobId, assignmentId, jobParams);

      return res.status(201).json({
        assignmentId, jobId, message: "Queued",
        queue: provider,
      });
    }

    // In-memory fallback
    const assignmentId = data.id || uuidv4();
    memStore.createAssignment({
      _id: assignmentId, title: data.title, subject: data.subject,
      className: data.className, schoolName: data.schoolName,
      dueDate: data.dueDate, assignedOn: data.assignedOn || new Date().toISOString(),
      questionTypes: data.questionTypes, additionalInstructions: data.additionalInstructions,
      timeAllowed: data.timeAllowed, status: "generating", jobId,
      uploadedFile: data.uploadedFile ?? undefined, createdAt: new Date().toISOString(),
    });

    const provider = await dispatchJob(jobId, assignmentId, jobParams);
    return res.status(201).json({ assignmentId, jobId, message: "Queued", queue: provider });

  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("Create error:", err);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// ── POST regenerate ───────────────────────────────────────────────────────
router.post("/:id/regenerate", async (req: Request, res: Response) => {
  const jobId = uuidv4();

  if (getIsConnected()) {
    try {
      const doc = await AssignmentModel.findByIdAndUpdate(
        req.params.id, { status: "generating", jobId }, { new: true }
      );
      if (!doc) return res.status(404).json({ error: "Not found" });
      const assignmentId = doc._id.toString();

      const jobParams = {
        title: doc.title, subject: doc.subject, className: doc.className,
        schoolName: doc.schoolName, timeAllowed: doc.timeAllowed,
        questionTypes: doc.questionTypes, additionalInstructions: doc.additionalInstructions,
      };

      const provider = await dispatchJob(jobId, assignmentId, jobParams);
      return res.json({ jobId, queue: provider });
    } catch {
      return res.status(404).json({ error: "Not found" });
    }
  }

  const a = memStore.getAssignment(req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  memStore.updateAssignment(req.params.id, { status: "generating", jobId });

  const jobParams = {
    title: a.title, subject: a.subject, className: a.className,
    schoolName: a.schoolName, timeAllowed: a.timeAllowed,
    questionTypes: a.questionTypes, additionalInstructions: a.additionalInstructions,
  };

  const provider = await dispatchJob(jobId, req.params.id, jobParams);
  return res.json({ jobId, queue: provider });
});

// ── DELETE ────────────────────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  if (getIsConnected()) {
    try {
      await AssignmentModel.findByIdAndDelete(req.params.id);
      return res.json({ message: "Deleted" });
    } catch {
      return res.status(404).json({ error: "Not found" });
    }
  }
  memStore.deleteAssignment(req.params.id);
  return res.json({ message: "Deleted" });
});

export default router;
