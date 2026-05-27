import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "school" | "student";
  schoolName?: string;
  location?: string;
  className?: string;
  rollNumber?: string;
  avatar: string;
  photoUrl?: string;
  openAiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ["school", "student"], default: "school" },
    schoolName:   { type: String },
    location:     { type: String },
    className:    { type: String },
    rollNumber:   { type: String },
    avatar:       { type: String, default: "" },
    photoUrl:     { type: String },
    openAiKey:    { type: String, default: "" },
  },
  { timestamps: true }
);

export function safeUser(u: IUser) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    schoolName: u.schoolName,
    location: u.location,
    className: u.className,
    rollNumber: u.rollNumber,
    avatar: u.avatar,
    photoUrl: u.photoUrl,
    // Return masked key so frontend knows if one is set, without exposing it
    hasOpenAiKey: !!(u.openAiKey && u.openAiKey.length > 0),
    openAiKeyHint: u.openAiKey ? `${u.openAiKey.slice(0, 7)}...${u.openAiKey.slice(-4)}` : "",
    createdAt: u.createdAt,
  };
}

// Internal use — returns actual key for AI calls
export function getUserWithKey(u: IUser) {
  return { ...safeUser(u), openAiKey: u.openAiKey || "" };
}

export default mongoose.model<IUser>("User", UserSchema);
