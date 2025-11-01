import {
  convertToModelMessages,
  embed,
  streamText,
  UIMessage,
} from 'ai';
import { google } from '@ai-sdk/google';
import { Pinecone } from '@pinecone-database/pinecone';
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
import type { VisibilityType } from '@/components/ui/visibility-selector';
import { generateTitleFromUserMessage } from '@/app/chat/actions';
import { auth } from '@/lib/auth';


export const maxDuration = 60;


const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pc.index("engineering-docs");


export async function POST(req: Request) {
  try {
    const { message, id, documentId, selectedVisibilityType } :{ message: UIMessage, id:string, documentId: string, selectedVisibilityType: VisibilityType } = await req.json();
    console.log('[api/chat/:id/stream] incoming', { id, documentId, selectedVisibilityType, parts: message?.parts });

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const apiKey = req.headers.get('chat-api-key');

    if (!session?.user) {
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
        console.log('[api/chat/:id/stream] saved initial assistant welcome');
      } catch (e) {
        console.error('[api/chat/:id/stream] failed to save initial assistant welcome', e);
      }
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
        model: google.textEmbedding("text-embedding-004"),
        value: userQuery,
      });


      const queryResponse = await pineconeIndex.query({
        vector: embedding,
        topK: 4,
        filter: { documentId: documentId },
        includeMetadata: true,
        includeValues: false,
      });


      console.log('[api/chat/:id/stream] pinecone matches', queryResponse?.matches?.length);
      const docs = (queryResponse?.matches ?? [])
        .map(match => (match?.metadata as any)?.textPreview ?? (match?.metadata as any)?.text)
        .filter(Boolean);
      
      context = docs.join('\n\n');
      console.log('[api/chat/:id/stream] docs length', docs.length);
    }

    const ragSystemPrompt =  `You are an expert assistant analyzing an engineering document. Answer the user's question ONLY based on the provided CONTEXT. Do not use external knowledge. If the context does not contain the answer, state that you cannot find the information in the provided document. Answer in clear plain text. Do not output JSON or code blocks unless explicitly requested.\n\nCONTEXT:\n${context}`
  
    const modelMessages = convertToModelMessages(uiMessages);

    const streamId = generateUUID();
    
    await createStreamId({ streamId, chatId: id });

    console.log('[api/chat/:id/stream] streamText start');
    const stream = streamText({
          model: google('gemini-2.5-flash'),
          system: ragSystemPrompt,
          messages: modelMessages,
          onFinish: async ({ response }) => {
            const assistantMessage = response.messages.find(m => m.role === 'assistant');
            if (assistantMessage) {
                try {
                  await saveMessages({
                    messages: [{
                      id: generateUUID(),
                      role: assistantMessage.role,
                      parts: Array.isArray(assistantMessage.content)
                        ? assistantMessage.content.map((c) => {
                            if (c && typeof c === 'object' && 'text' in c && typeof (c as any).text === 'string') {
                              return { type: 'text', text: (c as any).text };
                            }
                            return c as any;
                          })
                        : [{ type: 'text', text: assistantMessage.content as string }],
                      createdAt: new Date(),
                      attachments: [],
                      chatId: id,
                    }],
                  });
                  console.log('[api/chat/:id/stream] assistant message saved');
                } catch (e) {
                  console.error('[api/chat/:id/stream] failed to save assistant message', e);
                }
            }
          }
        });
    console.log('[api/chat/:id/stream] returning stream response');
    
    return stream.toUIMessageStreamResponse();
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