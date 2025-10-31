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


const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pineconeIndex = pc.index("engineering-docs");

export async function POST(req: Request) {
  try {
    const { message, id, documentId, selectedVisibilityType } :{ message: UIMessage, id:string, documentId: string, selectedVisibilityType: VisibilityType } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
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

    const query = coremessages[coremessages.length - 1].content

    const { embedding } = await embed({
          model: google.textEmbedding("gemini-embedding-001"),
          value: query,
        });
    

    const queryResponse = await pineconeIndex.query({
      vector: embedding,
      topK: 4,
      filter: { documentId: documentId }, 
      includeMetadata: true,
      includeValues: false,
    });

    const docs = queryResponse.matches.map((match:any) => (match.metadata as any)?.text).filter(Boolean);
    

    if (!docs.length) {
      return NextResponse.json({ answer: "No relevant information found for this document." });
    }

    const context = docs.join("\n\n");

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });
    
    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: google('gemini-2.5-flash'),
          system: SYSTEM_PROMPT,
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
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
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