/**
 * BullMQ queue for AI question-paper generation jobs.
 * Only used when Redis is available; falls back to inline runner otherwise.
 */
import { Queue, Worker, Job } from "bullmq";
import { Server as SocketServer } from "socket.io";
import { getRedisConnection, isRedisAvailable } from "../config/redis";
import { generateQuestionPaper } from "../services/aiService";
import { memStore } from "../store/memoryStore";
import { getIsConnected } from "../config/database";
import AssignmentModel from "../models/Assignment";

export const QUEUE_NAME = "generation";

export interface GenerationJobData {
  jobId: string;
  assignmentId: string;
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  timeAllowed: number;
  questionTypes: unknown[];
  additionalInstructions: string;
  uploadedFileContent?: string;
}

// ── Singleton queue ───────────────────────────────────────────────────────
let queue: Queue<GenerationJobData> | null = null;
let worker: Worker<GenerationJobData> | null = null;
let io: SocketServer | null = null;

export function setQueueSocket(socketServer: SocketServer) {
  io = socketServer;
}

function emit(event: string, data: unknown) {
  if (io) io.emit(event, data);
}

function progress(jobId: string, pct: number, message: string) {
  memStore.updateJob(jobId, { progress: pct, message });
  emit("job-progress", { jobId, progress: pct, message });
}

// ── Get or create queue ───────────────────────────────────────────────────
export function getQueue(): Queue<GenerationJobData> | null {
  if (!isRedisAvailable()) return null;
  if (!queue) {
    queue = new Queue<GenerationJobData>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    console.log("📋  BullMQ queue ready");
  }
  return queue;
}

// ── Start worker ──────────────────────────────────────────────────────────
export function startWorker() {
  if (!isRedisAvailable() || worker) return;

  worker = new Worker<GenerationJobData>(
    QUEUE_NAME,
    async (job: Job<GenerationJobData>) => {
      const { jobId, assignmentId, ...params } = job.data;

      memStore.updateJob(jobId, { status: "active", progress: 5, message: "Job picked up by worker..." });
      emit("job-progress", { jobId, progress: 5, message: "Job picked up by worker..." });

      await job.updateProgress(5);

      progress(jobId, 15, "Analyzing requirements...");
      await job.updateProgress(15);
      await new Promise((r) => setTimeout(r, 200));

      progress(jobId, 30, "Building AI prompt...");
      await job.updateProgress(30);
      await new Promise((r) => setTimeout(r, 150));

      progress(jobId, 45, "Generating questions with AI...");
      await job.updateProgress(45);

      const paper = await generateQuestionPaper({
        assignmentId,
        title: params.title,
        subject: params.subject,
        className: params.className,
        schoolName: params.schoolName,
        timeAllowed: params.timeAllowed,
        questionTypes: params.questionTypes as Parameters<typeof generateQuestionPaper>[0]["questionTypes"],
        additionalInstructions: params.additionalInstructions,
        uploadedFileContent: params.uploadedFileContent,
      });

      progress(jobId, 80, "Structuring question paper...");
      await job.updateProgress(80);
      await new Promise((r) => setTimeout(r, 150));

      progress(jobId, 92, "Saving to database...");
      await job.updateProgress(92);

      // Persist to MongoDB
      if (getIsConnected()) {
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          status: "completed",
          generatedPaper: paper,
        });
        console.log(`💾 [BullMQ Worker] Saved paper → ${assignmentId}`);
      } else {
        memStore.updateAssignment(assignmentId, { status: "completed", generatedPaper: paper });
      }

      memStore.updateJob(jobId, { status: "completed", progress: 100, message: "Done!", result: paper });
      emit("job-progress", { jobId, progress: 100, message: "Done!" });
      emit("job-completed", { jobId, result: paper });

      await job.updateProgress(100);
      return paper;
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const { jobId, assignmentId } = job.data;
    const msg = err.message || "Generation failed";
    console.error(`❌ [BullMQ Worker] Job ${jobId} failed:`, msg);

    if (getIsConnected()) {
      await AssignmentModel.findByIdAndUpdate(assignmentId, { status: "failed" }).catch(() => {});
    }
    memStore.updateAssignment(assignmentId, { status: "failed" });
    memStore.updateJob(jobId, { status: "failed", message: msg, error: msg });
    emit("job-failed", { jobId, error: msg });
  });

  worker.on("error", (err) => {
    console.error("BullMQ worker error:", err.message);
  });

  console.log("⚙️   BullMQ worker started (concurrency: 3)");
}

// ── Add job to queue ──────────────────────────────────────────────────────
export async function enqueueGeneration(data: GenerationJobData): Promise<boolean> {
  const q = getQueue();
  if (!q) return false;

  await q.add("generate", data, { jobId: data.jobId });
  console.log(`📥 [BullMQ] Enqueued job ${data.jobId}`);
  return true;
}

// ── Graceful shutdown ─────────────────────────────────────────────────────
export async function closeQueue() {
  await worker?.close();
  await queue?.close();
}
