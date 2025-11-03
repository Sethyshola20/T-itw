import {
  convertToModelMessages,
  streamText,
  UIMessage,
  createUIMessageStream,
  JsonToSseTransformStream,
} from 'ai';
import { google } from '@ai-sdk/google';
import { ChatSDKError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { getChatById, saveMessages, createStreamId, deleteChatById } from '@/lib/db/queries';
import { generateUUID, convertToUIMessages } from '@/lib/utils';
import type { VisibilityType } from '@/components/ui/visibility-selector';
import { searchDocuments } from '@/lib/search';

export async function POST(req: Request) {
  try {
    const {
      message,
      id,
      documentId,
      selectedVisibilityType,
    }: { message: UIMessage; id: string; documentId: string; selectedVisibilityType: VisibilityType } = await req.json();

    const session = await auth.api.getSession({ headers: req.headers });
    const apiKey = req.headers.get('chat-api-key');

    if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse();
    if (!apiKey) return new ChatSDKError('unauthorized:auth', 'Missing API key').toResponse();

    const result = await auth.api.verifyApiKey({ body: { key: apiKey } });
    if (!result.valid) return new ChatSDKError('forbidden:auth', 'Invalid or rate-limited API key').toResponse();


    const chat = await getChatById({ id });
    if (!chat || chat.userId !== session.user.id)
      return new ChatSDKError('forbidden:chat').toResponse();

    await saveMessages({
      messages: [{
        chatId: id,
        id: message.id,
        role: 'user',
        parts: message.parts,
        attachments: [],
        createdAt: new Date(),
      }],
    });


    const userQuery = message.parts.map(p => 'text' in p ? p.text : '').join(' ').trim();


    const docs = await searchDocuments(userQuery, 5, documentId, 0.5, 5);
    const context = docs.join('\n\n');


    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const modelMessages = convertToModelMessages([message]);

    if (!context.trim()) {
      const fallbackText = 'I could not find relevant information for that question in this document.';
      const messageId = generateUUID();

      const notfoundStream = streamText({
        model: google('gemini-2.5-flash'),
        messages: modelMessages,
        onFinish: async () => {
          await saveMessages({
            messages: [{
              id: messageId,
              role: 'assistant',
              parts: [{ type: 'text', text: fallbackText }],
              attachments: [],
              createdAt: new Date(),
              chatId: id,
            }],
          });
        },
      });

      return notfoundStream.toUIMessageStreamResponse();
    }


    const ragSystemPrompt = `You are an expert assistant analyzing an engineering document. Answer the user's question ONLY based on the provided CONTEXT. Do not use external knowledge. If the context does not contain the answer, state that you cannot find the information in the provided document. Answer in clear plain text. Do not output JSON or code blocks unless explicitly requested.\n\nCONTEXT:\n${context}`;

    

    const stream = streamText({
      model: google('gemini-2.5-flash'),
      system: ragSystemPrompt,
      messages: modelMessages,
      onFinish: async ({ response }) => {
        const assistantMessage = response.messages.find(m => m.role === 'assistant');
        if (!assistantMessage) return;

        await saveMessages({
          messages: [{
            id: generateUUID(),
            role: 'assistant',
            parts: Array.isArray(assistantMessage.content)
              ? assistantMessage.content.map(c => 'text' in c ? { type: 'text', text: c.text } : c)
              : [{ type: 'text', text: assistantMessage.content as string }],
            attachments: [],
            createdAt: new Date(),
            chatId: id,
          }],
        });
      },
    });

    return stream.toUIMessageStreamResponse();

  } catch (error) {
    console.error('[api/chat/:id/stream] error:', error);
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