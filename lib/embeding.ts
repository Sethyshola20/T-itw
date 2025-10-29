import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

/**
 * Initialize OpenAI + Pinecone clients.
 * (Make sure your .env file contains OPENAI_API_KEY and PINECONE_API_KEY)
 */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// Change this to your Pinecone index name
export const index = pinecone.Index("engineering-docs");

/**
 * Splits long text into smaller semantically coherent chunks.
 * Ideal chunk size: ~500–1000 tokens (≈ 2000–4000 characters)
 */
export function splitText(text: string, chunkSize = 3000, overlap = 200): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];

  let start = 0;
  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);
    const chunk = cleanText.slice(start, end);
    chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Generates embeddings for each text chunk and stores them in Pinecone.
 * @param documentId unique id of the file or database record
 * @param text raw text extracted from the PDF
 * @param metadata additional metadata (type, projectName, etc.)
 */

// think of Promise.allSettled() if many docs are sent
export async function storeEmbeddings(
  documentId: string,
  text: string,
  metadata: Record<string, any> = {}
) {
  try {
    const chunks = splitText(text);

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];

      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunkText,
      });

      const vector = {
        id: `${documentId}_${i}`,
        values: embedding.data[0].embedding,
        metadata: {
          ...metadata,
          documentId,
          chunkIndex: i,
          textPreview: chunkText.slice(0, 200),
        },
      };

      await index.upsert([vector]);
    }

    console.log(`Stored ${chunks.length} chunks for ${documentId} in Pinecone.`);
  } catch (error) {
    console.error("Pinecone embedding error:", error);
    throw error;
  }
}
