import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pinecone.index(process.env.PINECONE_INDEX!);

    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'text-embedding-3-small',
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    const docs = await vectorStore.similaritySearch(query, 4);

    const context = docs.map((d) => d.pageContent).join('\n\n');

    const prompt = PromptTemplate.fromTemplate(`
      You are an assistant that answers questions based on the following context.
      Be concise and accurate.

      Context:
      {context}

      Question:
      {question}

      Answer:
    `);

    const llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo',
      apiKey: process.env.OPENAI_API_KEY!,
      temperature: 0.2,
    });

    const ragChain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);

    const stream = streamText({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'Answer based on the provided context.' },
        { role: 'user', content: `${query}\n\nContext:\n${context}` },
      ],
    });

    return stream.toTextStreamResponse(); 

  } catch (error) {
    console.error('❌ Error in /api/query:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: (error as Error).message },
      { status: 500 },
    );
  }
}
