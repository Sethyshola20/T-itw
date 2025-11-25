import {
  convertToModelMessages,
  streamText,
  UIMessage,
  createUIMessageStream,
  JsonToSseTransformStream,
} from "ai";
import { google } from "@ai-sdk/google";
import { ChatSDKError } from "@/lib/errors";
import { auth } from "@/lib/auth";
import {
  getChatById,
  saveMessages,
  createStreamId,
  deleteChatById,
} from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";
import type { VisibilityType } from "@/components/ui/visibility-selector";
import { searchDocuments } from "@/lib/search";
import { myProvider } from "@/lib/ai/providers";
import { buildRagPrompt } from "@/lib/ai/prompts";
import { validateRequest } from "@/utils";
import { z } from "zod";

const chatSchema = z.object({
  message: z.any(),
  id: z.string(),
  documentId: z.string(),
  selectedVisibilityType: z.enum(["private", "public"]),
});

export async function POST(req: Request) {
  try {
    const { data: validatedData, errors } = validateRequest(chatSchema, await req.json());

    if (errors) {
      return Response.json(
        { error: "Invalid request", details: errors },
        { status: 400 },
      );
    }
    const {
      message,
      id,
      documentId,
      selectedVisibilityType,
    }: {
      message: UIMessage;
      id: string;
      documentId: string;
      selectedVisibilityType: VisibilityType;
    } = validatedData;

    const session = await auth.api.getSession({ headers: req.headers });
    const apiKey = req.headers.get("chat-api-key");

    if (!session)
      return new ChatSDKError("unauthorized:chat").toResponse();
    if (!apiKey)
      return new ChatSDKError(
        "unauthorized:auth",
        "Missing API key",
      ).toResponse();

    const result = await auth.api.verifyApiKey({ body: { key: apiKey } });
    if (!result.valid)
      return new ChatSDKError(
        "forbidden:auth",
        "Invalid or rate-limited API key",
      ).toResponse();

    const chat = await getChatById({ id });
    if (!chat || chat.userId !== session.user.id)
      return new ChatSDKError("forbidden:chat").toResponse();

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const userQuery = message.parts
      .map((p) => ("text" in p ? p.text : ""))
      .join(" ")
      .trim();

    const docs = await searchDocuments(userQuery, 5, documentId, 0.5, 5);
    const context = docs.join("\n\n");

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const modelMessages = convertToModelMessages([message]);

    if (!context.trim()) {
      const fallbackText =
        "I could not find relevant information for that question in this document.";
      const messageId = generateUUID();

      await saveMessages({
        messages: [
          {
            id: messageId,
            role: "assistant",
            parts: [{ type: "text", text: fallbackText }],
            attachments: [],
            createdAt: new Date(),
            chatId: id,
          },
        ],
      });

      const stream = new ReadableStream({
        start(controller) {
          // Vercel AI SDK wire format: 0:"text"
          controller.enqueue(`0:${JSON.stringify(fallbackText)}\n`);
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const ragSystemPrompt = buildRagPrompt(context);

    const stream = streamText({
      model: myProvider.languageModel('chat-model'),
      system: ragSystemPrompt,
      messages: modelMessages,
      onFinish: async ({ response }) => {
        const assistantMessage = response.messages.find(
          (m) => m.role === "assistant",
        );
        if (!assistantMessage) return;

        await saveMessages({
          messages: [
            {
              id: generateUUID(),
              role: "assistant",
              parts: Array.isArray(assistantMessage.content)
                ? assistantMessage.content.map((c) =>
                  "text" in c ? { type: "text", text: c.text } : c,
                )
                : [{ type: "text", text: assistantMessage.content as string }],
              attachments: [],
              createdAt: new Date(),
              chatId: id,
            },
          ],
        });
      },
    });

    return stream.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[api/chat/:id/stream] error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
