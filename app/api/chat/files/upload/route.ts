import { NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { preparePdfFile } from '@/helper';
import { engineeringDeliverableSchema } from '@/types';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { storeEmbeddings } from '@/lib/embeding';
import { generateUUID } from '@/lib/utils';
import { google } from "@ai-sdk/google"
import { generateTitleFromUserMessage } from '@/app/chat/actions';
import { saveChat, saveMessages } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { chunkContent } from '@/lib/chunking';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { file, url } = body as { file: File | null, url: string | null };
    const apiKey = req.headers.get('chat-api-key');

    if (!file && !url) {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return new ChatSDKError('unauthorized:auth').toResponse();
    if (!apiKey) return new ChatSDKError('unauthorized:auth', 'Missing API key').toResponse();

    const isValid = await auth.api.verifyApiKey({ body: { key: apiKey } });
    if (!isValid.valid) return new ChatSDKError('forbidden:auth', 'Invalid API key').toResponse();

    const documentId = generateUUID();

    const { fileName, fileDataUrl, documentText } = await preparePdfFile(file ? file : url as string, documentId);


    const chunks = await chunkContent(documentText);
    const firstChunksText = chunks.slice(0, 5).join(' ')
    
    const structuredResult = streamObject({
      model: google("gemini-2.5-flash"),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this engineering document and extract structured data.' },
            { type: 'text', text: 'Here is the start of the text:\n' + firstChunksText },
            { type: 'file', data: fileDataUrl, filename: fileName, mediaType: 'application/pdf' },
          ],
        },
      ],
      schema: engineeringDeliverableSchema,
    });

   structuredResult.object.then((obj) => {
      obj.documentId = documentId;

      storeEmbeddings(documentId, documentText, {
        projectName: obj.projectName,
        documentType: obj.documentType,
        engineeringFirm: obj.engineeringFirm,
      });

      const titlePromise = generateTitleFromUserMessage({
        message: {
          id: generateUUID(),
          role: "system",
          parts: [
            {
              type: "text",
              text: `Generate a concise title for this document based on its filename: "${fileName}"`,
            },
          ],
        },
      });

      titlePromise
        .then(async (title) => {
          const chatId = generateUUID();
          await saveChat({
            id: chatId,
            userId: session.user.id,
            title,
            documentId,
            visibility: "private",
          });

          await saveMessages({
            messages: [
              {
                chatId,
                id: generateUUID(),
                role: "assistant",
                parts: [
                  {
                    type: "text",
                    text: `I've successfully loaded "${fileName}". Here is a structured summary:\n\n\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``,
                  },
                ],
                attachments: [],
                createdAt: new Date(),
              },
            ],
          });
          console.log("[upload] Created chat and linked message:", chatId);
        })
        .catch((e) => {
          console.error("[upload] Failed during title/chat/message chain", e);
        });
    });
    return structuredResult.toTextStreamResponse();

  } catch (error) {
    console.error("[POST /upload]", error);
    return NextResponse.json({ error: 'Failed to process upload', details: (error as Error).message }, { status: 500 });
  }
}
