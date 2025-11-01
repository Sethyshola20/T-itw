import { NextResponse } from "next/server";
import { streamText, UIMessage, convertToModelMessages, embed, JsonToSseTransformStream, smoothStream, stepCountIs, createUIMessageStream } from "ai";
import { google } from "@ai-sdk/google"
import { Pinecone } from "@pinecone-database/pinecone";
import { myProvider } from "@/lib/ai/providers";
import { ChatSDKError } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { createStreamId, deleteChatById, getChatById, saveChat, saveMessages } from "@/lib/db/queries";
import { generateTitleFromUserMessage } from "@/app/chat/actions";
import { VisibilityType } from "@/components/ui/visibility-selector";
import { generateUUID } from "@/lib/utils";
import { getStreamContext } from "@/utils";
import { SYSTEM_PROMPT } from "@/lib/constants";
import { apikey } from "@/lib/db/auth-schema";


const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pc.index("engineering-docs");

export async function POST(req: Request) {
  try {
    const { message, id, documentId, selectedVisibilityType } :{ message: UIMessage, id:string, documentId: string, selectedVisibilityType: VisibilityType } = await req.json();

    const apiKey = req.headers.get('chat-api-key');

    const session = await auth.api.getSession({
      headers: req.headers,
    })
    
    if(!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }
    if (!apiKey) {
      return new ChatSDKError('unauthorized:auth', 'Missing API key').toResponse();
    }

    const result = await auth.api.verifyApiKey({
      body: { key: apiKey },
    });

    if (!result.valid) {
      return new ChatSDKError('forbidden:auth', 'Invalid or rate-limited API key').toResponse();
    }

    
    if (!message) {
      return NextResponse.json({ error: "message is required." }, { status: 400 });
    }

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required to scope search." }, { status: 400 });
    }

    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });
      await saveChat({
        id,
        userId: session.user.id,
        title,
        documentId,
        visibility: selectedVisibilityType,
      });
      // Persist initial assistant welcome so it appears in history
      try {
        const welcomeText = `I've successfully loaded the document! How can I help you understand this engineering deliverable?`;
        await saveMessages({
          messages: [
            {
              chatId: id,
              id: generateUUID(),
              role: 'assistant',
              parts: [{ type: 'text', text: welcomeText }],
              attachments: [],
              createdAt: new Date(),
            },
          ],
        });
        console.log('[api/chat] saved initial assistant welcome');
      } catch (e) {
        console.error('[api/chat] failed to save initial assistant welcome', e);
      }
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const coremessages = convertToModelMessages([message])

    const lastMessageContent = coremessages[coremessages.length - 1].content
    let queryText = '';

    if (
        Array.isArray(lastMessageContent) && 
        lastMessageContent.length > 0 &&
        typeof lastMessageContent[0] === 'object' &&
        'text' in lastMessageContent[0] &&
        typeof lastMessageContent[0].text === 'string'
    ) {
        queryText = lastMessageContent[0].text;
    } else if (typeof lastMessageContent === 'string') {
        queryText = lastMessageContent;
    }

    const { embedding } = await embed({
          model: google.textEmbedding("text-embedding-004"),
          value: queryText,
        });
    

    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      topK: 4,
      filter: { documentId: documentId }, 
      includeMetadata: true,
      includeValues: false,
    });

    console.log('[api/chat] pinecone matches', queryResponse?.matches?.length);
    const docs = (queryResponse?.matches ?? [])
      .map((match:any) => (match?.metadata as any)?.textPreview ?? (match?.metadata as any)?.text)
      .filter(Boolean);
    console.log('[api/chat] docs length', docs.length);

    if (!docs.length) {
      const messageText = 'I could not find relevant information for that question in this document.';
      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          await writer.write({ type: 'text-delta', delta: messageText, id: generateUUID() });
        },
        onFinish: async () => {
          try {
            await saveMessages({
              messages: [
                {
                  id: generateUUID(),
                  role: 'assistant',
                  parts: [{ type: 'text', text: messageText }],
                  attachments: [],
                  createdAt: new Date(),
                  chatId: id,
                },
              ],
            });
          } catch (e) {
            console.error('Failed to persist assistant message (no-docs):', e);
          }
        },
        generateId: generateUUID,
      });
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()), { status: 200 });
    }

    const context = docs.join("\n\n");
    console.log('[api/chat] context size', context.length);

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });
    
    console.log('[api/chat] streamText start');
    const stream = streamText({
      model: google('gemini-2.5-flash'),
      system:
        "You are a helpful engineering assistant. Answer the user's question using the provided document context. Respond in clear plain text. Do not output JSON or code blocks unless explicitly requested.",
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that answers questions based on a specific engineering document.',
        },
        {
          role: 'user',
          content: `Question: ${queryText}\n\nContext:\n${context}`,
        },
      ],
      onFinish: async ({ response }) => {
        try {
          console.log('[api/chat] onFinish received');
          await saveMessages({
            messages: response.messages.map((m) => ({
              id: generateUUID(),
              role: m.role,
              parts: Array.isArray(m.content)
                ? m.content.map((c) => {
                    if (c && typeof c === 'object' && 'text' in c && typeof (c as any).text === 'string') {
                      return { type: 'text', text: (c as any).text };
                    }
                    return c as any;
                  })
                : [{ type: 'text', text: m.content as string }],
              attachments: [],
              createdAt: new Date(),
              chatId: id,
            })),
          });
          console.log('[api/chat] onFinish saved');
        } catch (e) {
          console.error('Failed to persist assistant streamed messages:', e);
        }
      },
    });
    console.log('[api/chat] returning stream response');

    return stream.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    console.error('Unexpected error in /api/chat:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth.api.getSession({
      headers: request.headers
    });

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}