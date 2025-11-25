import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { chunkContent } from "./chunking";

const embeddingModel = google.textEmbedding("text-embedding-004");

import { getCachedEmbedding, cacheEmbedding } from "./cache/embeddings";

/**
 * Generate a single embedding for a text string
 * @param text - The text to embed
 * @returns Embedding vector (768 dimensions for text-embedding-004)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replaceAll("\n", " ");

  // Check cache first
  const cached = await getCachedEmbedding(input);
  if (cached) {
    return cached;
  }

  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  // Cache the result
  await cacheEmbedding(input, embedding);

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const inputs = texts.map((text) => text.replaceAll("\n", " "));

  // Check cache for all inputs
  const cachedResults = await Promise.all(inputs.map(getCachedEmbedding));

  const indicesToGenerate: number[] = [];
  const textsToGenerate: string[] = [];

  cachedResults.forEach((cached, index) => {
    if (!cached) {
      indicesToGenerate.push(index);
      textsToGenerate.push(inputs[index]);
    }
  });

  if (textsToGenerate.length > 0) {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: textsToGenerate,
    });

    // Cache new embeddings and fill results
    await Promise.all(
      embeddings.map((embedding, i) =>
        cacheEmbedding(textsToGenerate[i], embedding)
      )
    );

    // Merge back into results
    const finalResults = [...cachedResults] as number[][];
    indicesToGenerate.forEach((originalIndex, i) => {
      finalResults[originalIndex] = embeddings[i];
    });

    return finalResults;
  }

  return cachedResults as number[][];
}

/**
 * Store document embeddings in Pinecone
 * @param documentId - Unique document identifier
 * @param text - Full document text
 * @param metadata - Additional metadata to store with vectors
 * @returns Result with success status and vector count
 */
export async function storeEmbeddings(
  documentId: string,
  text: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Use consistent chunking
    const chunks = await chunkContent(text);

    console.log(`[storeEmbeddings] Splitting into ${chunks.length} chunks...`);

    // Generate embeddings in batch
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
    });

    // Prepare vectors for Pinecone
    const vectors = chunks.map((chunk, i) => ({
      id: `${documentId}_${i}`,
      values: embeddings[i],
      metadata: {
        ...metadata,
        documentId,
        chunkIndex: i,
        textPreview: chunk.slice(0, 200),
      },
    }));

    // Lazy load Pinecone to avoid initialization on every import
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index("engineering-docs");

    await index.upsert(vectors);

    console.log(
      `[storeEmbeddings] Stored ${vectors.length} chunks for ${documentId}`
    );

    return { success: true, count: vectors.length };
  } catch (error) {
    console.error("[storeEmbeddings] Error:", error);
    throw error;
  }
}
