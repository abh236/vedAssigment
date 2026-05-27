import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import UserModel, { safeUser } from "../models/User";
import { getIsConnected } from "../config/database";

const router = Router();

// ── In-memory fallback store ──────────────────────────────────────────────
interface MemUser {
  id: string; name: string; email: string; passwordHash: string;
  role: "school" | "student"; schoolName?: string; location?: string;
  className?: string; rollNumber?: string; avatar: string; photoUrl?: string;
  createdAt: string;
}
const memUsers = new Map<string, MemUser>();

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return h.toString(16);
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2);
}
function safeMemUser(u: MemUser) {
  const { passwordHash, ...rest } = u; return rest;
}

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, role, schoolName, location, className, rollNumber, photoUrl } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const normalEmail = email.toLowerCase().trim();
  const hash = simpleHash(password);
  const userRole: "school" | "student" = role === "student" ? "student" : "school";

  // ── MongoDB path ──
  if (getIsConnected()) {
    try {
      const exists = await UserModel.findOne({ email: normalEmail });
      if (exists) return res.status(409).json({ error: "An account with this email already exists" });

      const user = await UserModel.create({
        name: name.trim(), email: normalEmail, passwordHash: hash,
        role: userRole, schoolName: schoolName?.trim() || undefined,
        location: location?.trim() || undefined,
        className: className?.trim() || undefined,
        rollNumber: rollNumber?.trim() || undefined,
        avatar: initials(name.trim()),
        photoUrl: photoUrl || undefined,
      });
      console.log(`✅ [MongoDB] Registered: ${user.email} (${user.role})`);
      return res.status(201).json({ user: safeUser(user) });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      console.error("Register error:", err);
      return res.status(500).json({ error: "Registration failed" });
    }
  }

  // ── In-memory fallback ──
  if (memUsers.has(normalEmail)) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }
  const user: MemUser = {
    id: uuidv4(), name: name.trim(), email: normalEmail, passwordHash: hash,
    role: userRole, schoolName: schoolName?.trim() || undefined,
    location: location?.trim() || undefined,
    className: className?.trim() || undefined,
    rollNumber: rollNumber?.trim() || undefined,
    avatar: initials(name.trim()), photoUrl: photoUrl || undefined,
    createdAt: new Date().toISOString(),
  };
  memUsers.set(normalEmail, user);
  console.log(`✅ [Memory] Registered: ${user.email} (${user.role})`);
  return res.status(201).json({ user: safeMemUser(user) });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const normalEmail = email.toLowerCase().trim();

  // ── MongoDB path ──
  if (getIsConnected()) {
    try {
      const user = await UserModel.findOne({ email: normalEmail });
      if (!user) return res.status(401).json({ error: "No account found with this email. Please sign up first." });
      if (user.passwordHash !== simpleHash(password)) return res.status(401).json({ error: "Incorrect password." });
      console.log(`🔑 [MongoDB] Login: ${user.email}`);
      return res.json({ user: safeUser(user) });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  }

  // ── In-memory fallback ──
  const user = memUsers.get(normalEmail);
  if (!user) return res.status(401).json({ error: "No account found with this email. Please sign up first." });
  if (user.passwordHash !== simpleHash(password)) return res.status(401).json({ error: "Incorrect password." });
  console.log(`🔑 [Memory] Login: ${user.email}`);
  return res.json({ user: safeMemUser(user) });
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────
router.put("/profile", async (req: Request, res: Response) => {
  const { email, name, schoolName, location, className, rollNumber, photoUrl } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  const normalEmail = email.toLowerCase().trim();

  // ── MongoDB path ──
  if (getIsConnected()) {
    try {
      const updates: Record<string, unknown> = {};
      if (name) { updates.name = name.trim(); updates.avatar = initials(name.trim()); }
      if (schoolName !== undefined) updates.schoolName = schoolName;
      if (location !== undefined) updates.location = location;
      if (className !== undefined) updates.className = className;
      if (rollNumber !== undefined) updates.rollNumber = rollNumber;
      if (photoUrl !== undefined) updates.photoUrl = photoUrl;

      const user = await UserModel.findOneAndUpdate({ email: normalEmail }, updates, { new: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user: safeUser(user) });
    } catch (err) {
      console.error("Profile update error:", err);
      return res.status(500).json({ error: "Update failed" });
    }
  }

  // ── In-memory fallback ──
  const user = memUsers.get(normalEmail);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (name) { user.name = name.trim(); user.avatar = initials(name.trim()); }
  if (schoolName !== undefined) user.schoolName = schoolName;
  if (location !== undefined) user.location = location;
  if (className !== undefined) user.className = className;
  if (rollNumber !== undefined) user.rollNumber = rollNumber;
  if (photoUrl !== undefined) user.photoUrl = photoUrl;
  memUsers.set(normalEmail, user);
  return res.json({ user: safeMemUser(user) });
});

// PUT /api/auth/api-key — save OpenAI key to user record in DB
router.put("/api-key", async (req: Request, res: Response) => {
  const { email, key } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  const normalEmail = email.toLowerCase().trim();
  const newKey = key?.trim() || "";

  // Also update process.env for current session
  if (newKey) process.env.OPENAI_API_KEY = newKey;

  if (getIsConnected()) {
    try {
      const user = await UserModel.findOneAndUpdate(
        { email: normalEmail },
        { openAiKey: newKey },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      console.log(`🔑 [MongoDB] API key ${newKey ? "saved" : "removed"} for ${normalEmail}`);
      return res.json({ message: newKey ? "Key saved" : "Key removed", hasKey: !!newKey });
    } catch (err) {
      console.error("API key update error:", err);
      return res.status(500).json({ error: "Update failed" });
    }
  }

  // In-memory fallback
  const user = memUsers.get(normalEmail);
  if (user) {
    (user as MemUser & { openAiKey?: string }).openAiKey = newKey;
    memUsers.set(normalEmail, user);
  }
  return res.json({ message: newKey ? "Key saved" : "Key removed", hasKey: !!newKey });
});

// PUT /api/auth/fix-role — patch role for existing accounts
router.put("/fix-role", async (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: "email and role required" });
  const normalEmail = email.toLowerCase().trim();

  if (getIsConnected()) {
    try {
      const user = await UserModel.findOneAndUpdate(
        { email: normalEmail },
        { role },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user: safeUser(user) });
    } catch (err) {
      return res.status(500).json({ error: "Update failed" });
    }
  }

  const user = memUsers.get(normalEmail);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.role = role;
  memUsers.set(normalEmail, user);
  return res.json({ user: safeMemUser(user) });
});

export default router;
