import { NextResponse } from "next/server";
import { streamText } from "ai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { index } from "@/lib/embeding";

export async function POST(req: Request) {
  try {
    const { query, documentId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required to scope search." }, { status: 400 });
    }
    
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "text-embedding-3-small",
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    const docs = await vectorStore.similaritySearch(query, 4, { filter: { documentId } });

    if (!docs.length) {
      return NextResponse.json({ answer: "No relevant information found for this document." });
    }

    const context = docs.map((d) => d.pageContent).join("\n\n");

    const stream = streamText({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an assistant that answers questions based on a specific engineering document. Be concise and accurate.",
        },
        {
          role: "user",
          content: `Question: ${query}\n\nContext:\n${context}`,
        },
      ],
      temperature: 0.2,
    });

    return stream.toTextStreamResponse();
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process query", details: (error as Error).message },
      { status: 500 },
    );
  }
}
