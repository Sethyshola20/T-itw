import { NextResponse } from 'next/server';
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  LanguageModel,
  embed,
  streamText,
  UIMessage,
} from 'ai';
import { google } from '@ai-sdk/google';
import { Pinecone } from '@pinecone-database/pinecone';

// --- Local Imports ---
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/types';
import type { VisibilityType } from '@/components/ui/visibility-selector';
import { generateTitleFromUserMessage } from '@/app/chat/actions';
import { PostRequestBody, postRequestBodySchema } from '@/app/api/schema';
import { auth } from '@/lib/auth';
import { systemPrompt } from '@/lib/ai/prompts'; 
import { getStreamContext } from '@/utils';


export const maxDuration = 60;


const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pc.index("engineering-docs");


export async function POST(req: Request) {
  try {
    const { message, id, documentId, selectedVisibilityType } :{ message: UIMessage, id:string, documentId: string, selectedVisibilityType: VisibilityType } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // --- Chat Initialization/Validation ---
    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message });
      await saveChat({
        id,
        userId: session.user.id,
        title,
        documentId,
        visibility: selectedVisibilityType,
      });
    } else if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }


    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];


    await saveMessages({
      messages: [{ chatId: id, id: message.id, role: 'user', parts: message.parts, attachments: [], createdAt: new Date() }],
    });

    let context = '';
    const userQuery = message.parts.map(p => 'text' in p ? p.text : '').join(' ');

    if (documentId) {

      const { embedding } = await embed({
        model: google.textEmbedding('gemini-embedding-001'),
        value: userQuery,
      });


      const queryResponse = await pineconeIndex.query({
        vector: embedding,
        topK: 4,
        filter: { documentId: documentId },
        includeMetadata: true,
        includeValues: false,
      });


      const docs = queryResponse.matches
        .map(match => (match.metadata as any)?.text) // Assuming your chunk text is stored under 'text'
        .filter(Boolean);
      
      context = docs.join('\n\n');
    }

    const ragSystemPrompt =  `You are an expert assistant analyzing an engineering document. Answer the user's question ONLY based on the provided CONTEXT. Do not use external knowledge. If the context does not contain the answer, state that you cannot find the information in the provided document.\n\nCONTEXT:\n${context}`
  
    const modelMessages = convertToModelMessages(uiMessages);

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const result = await streamText({
          model: google('gemini-1.5-flash') as unknown as LanguageModel,
          system: ragSystemPrompt,
          messages: modelMessages, 
        });

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        const assistantMessage = messages.find(m => m.role === 'assistant');
        if (assistantMessage) {
            await saveMessages({
              messages: [{
                id: assistantMessage.id,
                role: assistantMessage.role,
                parts: assistantMessage.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              }],
            });
        }
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    console.error('Unexpected error in chat/[id]/stream:', error);
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
    headers: request.headers,
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