import Redis from "ioredis";

let redisClient: Redis | null = null;
let _available = false;

export function getRedisConnection(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,   // required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: (times) => {
        if (times > 2) return null; // give up after 3 attempts
        return Math.min(times * 300, 1000);
      },
    });

    redisClient.on("ready", () => {
      _available = true;
      console.log("🔴  Redis connected  →  job queue active");
    });

    redisClient.on("error", (err) => {
      if (_available) console.warn("⚠️   Redis error:", err.message);
      _available = false;
    });

    redisClient.on("close", () => { _available = false; });
  }
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return _available && redisClient?.status === "ready";
}

/** Try to connect; resolve true/false without throwing */
export async function tryConnectRedis(): Promise<boolean> {
  try {
    const client = getRedisConnection();
    await client.connect();
    return isRedisAvailable();
  } catch {
    return false;
  }
}
