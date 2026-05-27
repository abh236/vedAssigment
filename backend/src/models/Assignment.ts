import mongoose, { Schema, Document } from "mongoose";

export interface IQuestionTypeConfig {
  id: string;
  type: string;
  count: number;
  marksPerQuestion: number;
}

export interface IQuestion {
  id: string;
  text: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  type: string;
  options?: string[];
}

export interface ISection {
  id: string;
  title: string;
  instruction: string;
  questionType: string;
  questions: IQuestion[];
  totalMarks: number;
}

export interface IGeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: number;
  totalMarks: number;
  generalInstructions: string[];
  sections: ISection[];
  createdAt: string;
}

export interface IAssignment extends Document {
  userId?: string;           // owner — links to User._id
  title: string;
  subject: string;
  className: string;
  schoolName: string;
  dueDate: string;
  assignedOn: string;
  questionTypes: IQuestionTypeConfig[];
  additionalInstructions: string;
  timeAllowed: number;
  status: "draft" | "generating" | "completed" | "failed";
  jobId?: string;
  generatedPaper?: IGeneratedPaper;
  uploadedFile?: { name: string; content: string; type: string };
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    userId: { type: String, index: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    schoolName: { type: String, default: "Delhi Public School" },
    dueDate: { type: String, required: true },
    assignedOn: { type: String, required: true },
    questionTypes: { type: Schema.Types.Mixed, default: [] },
    additionalInstructions: { type: String, default: "" },
    timeAllowed: { type: Number, default: 45 },
    status: { type: String, enum: ["draft","generating","completed","failed"], default: "draft" },
    jobId: String,
    generatedPaper: { type: Schema.Types.Mixed },
    uploadedFile: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", AssignmentSchema);
