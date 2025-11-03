import { Pinecone } from "@pinecone-database/pinecone";
import { cosineSimilarity } from "ai";
import { generateEmbedding } from "./embeddings";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.index("engineering-docs");

/**
 * Search for similar documents using Pinecone embeddings.
 */
export async function searchDocuments(
  query: string,
  limit: number = 5,
  documentId:string,
  threshold: number = 0.5,
  topK = 5, 
) {
  // 1️⃣ Embed the query using AI SDK
  const embedding = await generateEmbedding(query)

   // 2️⃣ Query Pinecone
  const results = await index.query({
    vector: embedding,
    topK: topK * 2, // fetch extra to filter manually
    filter: { documentId },
    includeMetadata: true,
    includeValues: true,
  });

  // 3️⃣ Compute cosine similarity and filter
  const scoredChunks = (results.matches ?? [])
    .map((match) => ({
      similarity: cosineSimilarity(embedding, match.values!),
      chunk: match.metadata,
    }))
    .filter((c) => c.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scoredChunks.map((c) => c.chunk?.textPreview || "");
}