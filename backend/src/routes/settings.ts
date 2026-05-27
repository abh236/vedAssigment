import { Router, Request, Response } from "express";

const router = Router();

// Update OpenAI key at runtime
router.post("/openai-key", (req: Request, res: Response) => {
  const { key } = req.body;
  if (typeof key !== "string") return res.status(400).json({ error: "key is required" });
  process.env.OPENAI_API_KEY = key.trim();
  console.log(key ? `🔑 OpenAI key updated: ${key.slice(0, 8)}...` : "🔑 OpenAI key cleared");
  res.json({ message: key ? "Key updated" : "Key cleared" });
});

// Update Groq key at runtime
router.post("/groq-key", (req: Request, res: Response) => {
  const { key } = req.body;
  if (typeof key !== "string") return res.status(400).json({ error: "key is required" });
  process.env.GROQ_API_KEY = key.trim();
  console.log(key ? `🦙 Groq key updated: ${key.slice(0, 8)}...` : "🦙 Groq key cleared");
  res.json({ message: key ? "Key updated" : "Key cleared" });
});

export default router;
