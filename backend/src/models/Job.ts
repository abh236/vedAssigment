import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  assignmentId: string;
  status: "waiting" | "active" | "completed" | "failed";
  progress: number;
  message: string;
  result?: unknown;
  error?: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    assignmentId: { type: String, required: true, index: true },
    status: { type: String, enum: ["waiting","active","completed","failed"], default: "waiting" },
    progress: { type: Number, default: 0 },
    message: { type: String, default: "" },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>("Job", JobSchema);
