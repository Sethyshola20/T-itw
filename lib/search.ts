import { Pinecone } from "@pinecone-database/pinecone";
import { cosineSimilarity } from "ai";
import { generateEmbedding } from "./embeddings";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.index("engineering-docs");

export async function searchDocuments(
  query: string,
  limit: number = 5,
  documentId:string,
  threshold: number = 0.5,
  topK = 5, 
) {

  const embedding = await generateEmbedding(query)


  const results = await index.query({
    vector: embedding,
    topK: topK * 2,
    filter: { documentId },
    includeMetadata: true,
    includeValues: true,
  });


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