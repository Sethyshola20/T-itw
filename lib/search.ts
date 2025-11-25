import { Pinecone } from "@pinecone-database/pinecone";

import { generateEmbedding } from "./embeddings";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.index("engineering-docs");

export async function searchDocuments(
  query: string,
  limit: number = 5,
  documentId: string,
  threshold: number = 0.5,
  topK = 5,
) {
  const embedding = await generateEmbedding(query);

  const results = await index.query({
    vector: embedding,
    topK,
    filter: { documentId },
    includeMetadata: true,
    includeValues: false,
  });

  return (results.matches ?? [])
    .filter((match) => (match.score ?? 0) >= threshold)
    .map((match) => match.metadata?.textPreview || "");
}
