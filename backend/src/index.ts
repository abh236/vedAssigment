import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { connectDB, getIsConnected } from "./config/database";
import { tryConnectRedis, isRedisAvailable } from "./config/redis";
import { setQueueSocket, startWorker, closeQueue } from "./queue/generationQueue";
import { setJobRunnerSocket } from "./services/jobRunner";
import assignmentRoutes from "./routes/assignments";
import jobRoutes from "./routes/jobs";
import toolkitRoutes from "./routes/toolkit";
import settingsRoutes from "./routes/settings";
import authRoutes from "./routes/auth";

const app = express();
const httpServer = createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Allow multiple origins — Vercel preview URLs, custom domain, localhost
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ved-assigment.vercel.app",
  "https://vedassigment.vercel.app",
].filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((o) => origin.startsWith(o))) {
      return callback(null, true);
    }
    // Also allow any vercel.app subdomain for preview deployments
    if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some((o) => origin.startsWith(o)) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) return callback(null, true);
      callback(new Error(`Socket CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Wire socket to both job systems
setJobRunnerSocket(io);
setQueueSocket(io);

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("subscribe-job", (jobId: string) => {
    socket.join(`job-${jobId}`);
    console.log(`   ↳ subscribed to job-${jobId}`);
  });

  socket.on("unsubscribe-job", (jobId: string) => {
    socket.leave(`job-${jobId}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
  });
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight for all routes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({
  name: "VedaAI Backend",
  version: "2.0.0",
  status: "ok",
  features: ["MongoDB", "Redis/BullMQ", "WebSocket", "OpenAI/Groq"],
}));

app.get("/health", (_req, res) => {
  const redisOk = isRedisAvailable();
  const mongoOk = getIsConnected();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoOk ? "connected" : "unavailable (using memory)",
      redis:   redisOk ? "connected" : "unavailable (using inline runner)",
      queue:   redisOk ? "bullmq"    : "inline",
      ai:      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here"
               ? "openai" : process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_groq_api_key_here"
               ? "groq" : "fallback",
    },
  });
});

app.use("/api/auth",        authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/jobs",        jobRoutes);
app.use("/api/toolkit",     toolkitRoutes);
app.use("/api/settings",    settingsRoutes);

// ── Graceful shutdown ──────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  console.log("\n🛑  Shutting down gracefully...");
  await closeQueue();
  process.exit(0);
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;

async function start() {
  // 1. MongoDB
  await connectDB();

  // 2. Redis + BullMQ (optional — graceful fallback)
  const redisOk = await tryConnectRedis();
  if (redisOk) {
    startWorker();
  } else {
    console.log("⚠️   Redis unavailable — using inline job runner");
  }

  // 3. HTTP server
  httpServer.listen(PORT, () => {
    const mongoStatus = getIsConnected() ? "MongoDB ✅" : "in-memory ⚠️";
    const redisStatus = isRedisAvailable() ? "Redis + BullMQ ✅" : "inline runner ⚠️";
    const aiKey = process.env.OPENAI_API_KEY || "";
    const groqKey = process.env.GROQ_API_KEY || "";

    console.log(`\n🚀  VedaAI Backend v2.0`);
    console.log(`    http://localhost:${PORT}`);
    console.log(`\n📦  Storage  →  ${mongoStatus}`);
    console.log(`⚙️   Jobs     →  ${redisStatus}`);
    console.log(`📡  WebSocket →  ws://localhost:${PORT}`);

    if (aiKey && aiKey !== "your_openai_api_key_here") {
      console.log(`🤖  AI       →  OpenAI (${aiKey.slice(0, 8)}...)`);
    } else if (groqKey && groqKey !== "your_groq_api_key_here") {
      console.log(`🦙  AI       →  Groq (free)`);
    } else {
      console.log(`⚠️   AI       →  No key set — using fallback`);
    }
    console.log();
  });
}

start();
