import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType =
  | "Multiple Choice Questions"
  | "Short Questions"
  | "Long Questions"
  | "Diagram/Graph-Based Questions"
  | "Numerical Problems"
  | "True/False";

export interface QuestionTypeConfig {
  id: string;
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  uploadedFile?: { name: string; content: string; type: string } | null;
  timeAllowed?: number;
  schoolName?: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questionType: QuestionType;
  questions: Question[];
  totalMarks: number;
}

export interface GeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: number;
  totalMarks: number;
  generalInstructions: string[];
  sections: Section[];
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  assignedOn: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  status: "draft" | "generating" | "completed" | "failed";
  generatedPaper?: GeneratedPaper;
  jobId?: string;
}

// Library item — saved papers
export interface LibraryItem {
  id: string;
  assignmentId: string;
  title: string;
  subject: string;
  className: string;
  savedAt: string;
  paper: GeneratedPaper;
  tags: string[];
}

// Study material — books, notes, PDFs, links
export type MaterialType = "pdf" | "note" | "book" | "link" | "image" | "other";

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  subject: string;
  fileContent?: string;   // base64 for uploaded files
  fileName?: string;
  fileSize?: number;
  url?: string;           // for links
  tags: string[];
  addedAt: string;
  color: string;
}

// Group / class
export interface Group {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  createdAt: string;
  color: string;
}

// Profile / settings
export interface UserProfile {
  name: string;
  school: string;
  location: string;
  email: string;
  avatar: string;
  openAiKey: string;
}

interface AssignmentStore {
  assignments: Assignment[];
  library: LibraryItem[];
  materials: StudyMaterial[];
  groups: Group[];
  profile: UserProfile;
  currentForm: Partial<AssignmentFormData>;
  generationStatus: Record<string, { status: string; progress: number; message: string }>;

  // Assignments
  addAssignment: (a: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;

  // Library
  saveToLibrary: (item: LibraryItem) => void;
  removeFromLibrary: (id: string) => void;
  updateLibraryTags: (id: string, tags: string[]) => void;

  // Study materials
  addMaterial: (m: StudyMaterial) => void;
  removeMaterial: (id: string) => void;
  updateMaterialTags: (id: string, tags: string[]) => void;

  // Groups
  addGroup: (g: Group) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;

  // Profile
  updateProfile: (updates: Partial<UserProfile>) => void;

  setCurrentForm: (data: Partial<AssignmentFormData>) => void;
  resetForm: () => void;
  setGenerationStatus: (jobId: string, status: { status: string; progress: number; message: string }) => void;
}

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set) => ({
      assignments: [],
      library: [],
      materials: [],
      groups: [],
      profile: {
        name: "John Doe",
        school: "Delhi Public School",
        location: "Bokaro Steel City",
        email: "john.doe@dps.edu.in",
        avatar: "JD",
        openAiKey: "",
      },
      currentForm: {},
      generationStatus: {},

      addAssignment: (a) => set((s) => ({ assignments: [a, ...s.assignments] })),
      updateAssignment: (id, updates) =>
        set((s) => ({
          assignments: s.assignments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      deleteAssignment: (id) =>
        set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) })),

      saveToLibrary: (item) =>
        set((s) => ({ library: [item, ...s.library.filter((l) => l.id !== item.id)] })),
      removeFromLibrary: (id) =>
        set((s) => ({ library: s.library.filter((l) => l.id !== id) })),
      updateLibraryTags: (id, tags) =>
        set((s) => ({
          library: s.library.map((l) => (l.id === id ? { ...l, tags } : l)),
        })),

      addMaterial: (m) => set((s) => ({ materials: [m, ...s.materials] })),
      removeMaterial: (id) => set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),
      updateMaterialTags: (id, tags) =>
        set((s) => ({ materials: s.materials.map((m) => (m.id === id ? { ...m, tags } : m)) })),

      addGroup: (g) => set((s) => ({ groups: [g, ...s.groups] })),
      updateGroup: (id, updates) =>
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      deleteGroup: (id) =>
        set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),

      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      setCurrentForm: (data) => set((s) => ({ currentForm: { ...s.currentForm, ...data } })),
      resetForm: () => set({ currentForm: {} }),
      setGenerationStatus: (jobId, status) =>
        set((s) => ({ generationStatus: { ...s.generationStatus, [jobId]: status } })),
    }),
    { name: "veda-assignments" }
  )
);
