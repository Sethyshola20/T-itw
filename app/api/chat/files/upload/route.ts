import { NextResponse } from 'next/server';
import { createUIMessageStream, generateObject, GenerateObjectResult, generateText, JsonToSseTransformStream, ModelMessage, streamObject, streamText, UIDataTypes, UIMessage } from 'ai';
import { saveFile, saveFileFromUrl, validateFileType, validatePdfUrl } from '@/helper';
import { EngineeringDeliverableObjectType, engineeringDeliverableSchema } from '@/types';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { storeEmbeddings } from '@/lib/embeding';
import { generateUUID } from '@/lib/utils';
import { google } from "@ai-sdk/google"



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { file, url } = body as { file: File | null, url: string | null}

    if (!file && !url) {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
    }

    let filePath = ''
    let fileDataUrl = '';

    const documentId = generateUUID()

    if (file) {
      await validateFileType(file);
      filePath = await saveFile(file, `${documentId}.pdf`);

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Data = Buffer.from(uint8Array).toString('base64');
      fileDataUrl = `data:application/pdf;base64,${base64Data}`;
    }


    else if (url) {
      await validatePdfUrl(url);
      filePath = await saveFileFromUrl(url, `${documentId}.pdf`);

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Data = Buffer.from(uint8Array).toString('base64');
      fileDataUrl = `data:application/pdf;base64,${base64Data}`;
    }

    const result = streamObject({
      model: google("gemini-2.5-flash"), 
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this engineering document and extract structured data.',
            },
            {
              type: 'file',
              data: fileDataUrl,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
      schema: engineeringDeliverableSchema,
    });

    const textResult = await generateText({
      model: google("gemini-2.5-flash"), 
      messages: [
        {
          role: 'system',
          content: 'You are a document transcription and extraction tool. Your task is to accurately extract all textual content from the provided PDF file, preserving the original order and structure as much as possible. Do not summarize or analyze.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract the full, raw text content from this document.',
            },
            {
              type: 'file',
              data: fileDataUrl,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
      maxOutputTokens: 65000, 
    });

    const documentText = textResult.text; 

    result.object.then(obj => {
      obj.documentId = documentId;
      storeEmbeddings(documentId, documentText, {
        projectName: obj.projectName,
        documentType: obj.documentType,
        engineeringFirm: obj.engineeringFirm,
      });
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.log({error})
    return NextResponse.json(
      { error: 'Failed to process upload', details: (error as Error).message },
      { status: 500 },
    );
  }
}
