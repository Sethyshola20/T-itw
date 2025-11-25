import { redis } from "./redis";

const DOCUMENT_TTL = 1800; // 30 minutes

export async function getCachedDocument(documentId: string): Promise<any | null> {
    try {
        const key = `document:${documentId}`;
        const cached = await redis.get(key);

        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error("Error getting cached document:", error);
        return null;
    }
}

export async function cacheDocument(documentId: string, metadata: any): Promise<void> {
    try {
        const key = `document:${documentId}`;
        await redis.set(key, JSON.stringify(metadata), {
            EX: DOCUMENT_TTL,
        });
    } catch (error) {
        console.error("Error caching document:", error);
    }
}
