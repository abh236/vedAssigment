import { Server as SocketServer } from "socket.io";
import { generateQuestionPaper } from "./aiService";
import { IQuestionTypeConfig } from "../models/Assignment";
import { memStore } from "../store/memoryStore";
import { getIsConnected } from "../config/database";
import AssignmentModel from "../models/Assignment";

let io: SocketServer | null = null;

export function setJobRunnerSocket(socketServer: SocketServer) {
  io = socketServer;
}

function emit(event: string, data: unknown) {
  if (io) io.emit(event, data);
}

export async function runJobInline(jobId: string, assignmentId: string, params: Record<string, unknown>) {
  memStore.updateJob(jobId, { status: "active", progress: 10, message: "Analyzing requirements..." });
  emit("job-progress", { jobId, progress: 10, message: "Analyzing requirements..." });

  await new Promise((r) => setTimeout(r, 300));

  try {
    memStore.updateJob(jobId, { progress: 25, message: "Building AI prompt..." });
    emit("job-progress", { jobId, progress: 25, message: "Building AI prompt..." });
    await new Promise((r) => setTimeout(r, 200));

    memStore.updateJob(jobId, { progress: 40, message: "Generating questions with AI..." });
    emit("job-progress", { jobId, progress: 40, message: "Generating questions with AI..." });

    // Build typed params — pull each field explicitly to avoid spread conflicts
    const paper = await generateQuestionPaper({
      assignmentId,
      title:                  String(params.title                  || ""),
      subject:                String(params.subject                || ""),
      className:              String(params.className              || ""),
      schoolName:             String(params.schoolName             || "Delhi Public School"),
      timeAllowed:            Number(params.timeAllowed            || 45),
      questionTypes:          (params.questionTypes as IQuestionTypeConfig[]) || [],
      additionalInstructions: String(params.additionalInstructions || ""),
      uploadedFileContent:    params.uploadedFileContent as string | undefined,
    });

    memStore.updateJob(jobId, { progress: 85, message: "Structuring question paper..." });
    emit("job-progress", { jobId, progress: 85, message: "Structuring question paper..." });
    await new Promise((r) => setTimeout(r, 200));

    memStore.updateJob(jobId, { progress: 95, message: "Saving to database..." });
    emit("job-progress", { jobId, progress: 95, message: "Saving to database..." });
    await new Promise((r) => setTimeout(r, 100));

    if (getIsConnected()) {
      try {
        await AssignmentModel.findByIdAndUpdate(assignmentId, { status: "completed", generatedPaper: paper });
        console.log(`💾 [MongoDB] Saved paper for assignment ${assignmentId}`);
      } catch (dbErr) {
        console.warn("MongoDB save failed, using memory:", dbErr);
        memStore.updateAssignment(assignmentId, { status: "completed", generatedPaper: paper });
      }
    } else {
      memStore.updateAssignment(assignmentId, { status: "completed", generatedPaper: paper });
    }

    memStore.updateJob(jobId, { status: "completed", progress: 100, message: "Done!", result: paper });
    emit("job-progress", { jobId, progress: 100, message: "Done!" });
    emit("job-completed", { jobId, result: paper });
    console.log(`✅ Job ${jobId} completed`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    if (getIsConnected()) {
      try { await AssignmentModel.findByIdAndUpdate(assignmentId, { status: "failed" }); } catch { /* ignore */ }
    }
    memStore.updateAssignment(assignmentId, { status: "failed" });
    memStore.updateJob(jobId, { status: "failed", message: msg, error: msg });
    emit("job-failed", { jobId, error: msg });
    console.error(`❌ Job ${jobId} failed:`, msg);
  }
}
