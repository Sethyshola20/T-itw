import { createClient } from "redis";

const redisUrl = process.env.ITW_REDIS_URL || "redis://localhost:6379";

export const redis = createClient({
    url: redisUrl,
});

redis.on("error", (err) => console.error("Redis Client Error", err));

if (!redis.isOpen) {
    redis.connect().catch(console.error);
}
