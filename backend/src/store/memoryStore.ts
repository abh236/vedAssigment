/**
 * In-memory store — used when MongoDB is unavailable.
 * Keeps assignments and job results in process memory.
 */

export interface MemAssignment {
  _id: string;
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  dueDate: string;
  assignedOn: string;
  questionTypes: unknown[];
  additionalInstructions: string;
  timeAllowed: number;
  status: "draft" | "generating" | "completed" | "failed";
  jobId?: string;
  generatedPaper?: unknown;
  uploadedFile?: unknown;
  createdAt: string;
}

export interface MemJob {
  id: string;
  assignmentId: string;
  status: "waiting" | "active" | "completed" | "failed";
  progress: number;
  message: string;
  result?: unknown;
  error?: string;
  data: Record<string, unknown>;
}

const assignments = new Map<string, MemAssignment>();
const jobs = new Map<string, MemJob>();

export const memStore = {
  // Assignments
  createAssignment(a: MemAssignment) {
    assignments.set(a._id, a);
    return a;
  },
  getAssignment(id: string) {
    return assignments.get(id) ?? null;
  },
  getAllAssignments() {
    return [...assignments.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  updateAssignment(id: string, updates: Partial<MemAssignment>) {
    const existing = assignments.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    assignments.set(id, updated);
    return updated;
  },
  deleteAssignment(id: string) {
    return assignments.delete(id);
  },

  // Jobs
  createJob(job: MemJob) {
    jobs.set(job.id, job);
    return job;
  },
  getJob(id: string) {
    return jobs.get(id) ?? null;
  },
  updateJob(id: string, updates: Partial<MemJob>) {
    const existing = jobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    jobs.set(id, updated);
    return updated;
  },
};
