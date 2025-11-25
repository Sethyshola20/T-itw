import { redis } from "./redis";
import { createHash } from "crypto";

const EMBEDDING_TTL = 3600; // 1 hour

export async function getCachedEmbedding(text: string): Promise<number[] | null> {
    try {
        const hash = createHash("sha256").update(text).digest("hex");
        const key = `embedding:${hash}`;
        const cached = await redis.get(key);

        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error("Error getting cached embedding:", error);
        return null;
    }
}

export async function cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    try {
        const hash = createHash("sha256").update(text).digest("hex");
        const key = `embedding:${hash}`;
        await redis.set(key, JSON.stringify(embedding), {
            EX: EMBEDDING_TTL,
        });
    } catch (error) {
        console.error("Error caching embedding:", error);
    }
}
