import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { PDFParse } from 'pdf-parse';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs'; 

export async function POST(req: Request) {
  try {
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    let docs: Document[] = [];


    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(uploadDir, file.name);
      await fs.writeFile(filePath, buffer);

      const parser = new PDFParse(buffer)
      const result = await parser.getText()


      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitDocuments([
        new Document({
          pageContent: result.text,
          metadata: { source: file.name, type: 'pdf' },
        }),
      ]);

      docs.push(...chunks);
    }


    if (url) {
      const res = await fetch(url);
      const html = await res.text();

      const $ = cheerio.load(html);
      const text = $('body').text().replace(/\s+/g, ' ').trim();

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitDocuments([
        new Document({
          pageContent: text,
          metadata: { source: url, type: 'url' },
        }),
      ]);

      docs.push(...chunks);
    }


    if (docs.length > 0) {
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

      await vectorStore.addDocuments(docs);
    }

    return NextResponse.json({
      success: true,
      source: file?.name ?? url,
      chunks: docs.length,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: (error as Error).message },
      { status: 500 },
    );
  }
}
