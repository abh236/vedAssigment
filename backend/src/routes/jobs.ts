import { Router, Request, Response } from "express";
import { memStore } from "../store/memoryStore";
import { getQueue } from "../queue/generationQueue";
import { isRedisAvailable } from "../config/redis";

const router = Router();

// GET /api/jobs/:jobId — poll job status
router.get("/:jobId", async (req: Request, res: Response) => {
  const { jobId } = req.params;

  // ── Try BullMQ first (if Redis available) ──
  if (isRedisAvailable()) {
    try {
      const q = getQueue();
      if (q) {
        const bullJob = await q.getJob(jobId);
        if (bullJob) {
          const state = await bullJob.getState();
          const progress = typeof bullJob.progress === "number" ? bullJob.progress : 0;

          // Also check memStore for message
          const mem = memStore.getJob(jobId);

          return res.json({
            jobId,
            status: state === "completed" ? "completed"
              : state === "failed" ? "failed"
              : state === "active" ? "active"
              : "waiting",
            progress,
            message: mem?.message || stateMessage(state),
            result: state === "completed" ? (mem?.result ?? bullJob.returnvalue) : null,
            provider: "bullmq",
          });
        }
      }
    } catch { /* fall through to memStore */ }
  }

  // ── Fallback: in-memory store ──
  const job = memStore.getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    result: job.status === "completed" ? job.result : null,
    provider: "memory",
  });
});

// GET /api/jobs — list recent jobs (admin/debug)
router.get("/", (_req: Request, res: Response) => {
  res.json({
    redis: isRedisAvailable(),
    message: isRedisAvailable() ? "BullMQ active" : "In-memory fallback",
  });
});

function stateMessage(state: string): string {
  const map: Record<string, string> = {
    waiting: "Queued, waiting for worker...",
    active: "Worker is processing...",
    completed: "Done!",
    failed: "Generation failed",
    delayed: "Delayed, will retry...",
    prioritized: "Queued with priority...",
  };
  return map[state] || "Processing...";
}

export default router;
