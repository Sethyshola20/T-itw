import { NextResponse } from "next/server";
import { streamObject } from "ai";
import { preparePdfFile } from "@/helper";
import { engineeringDeliverableSchema } from "@/types";
import { extractionPrompt } from "@/lib/ai/prompts";
import { storeEmbeddings } from "@/lib/embeddings";
import { generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "@/app/chat/actions";
import { saveChat, saveMessages } from "@/lib/db/queries";
import { auth } from "@/lib/auth";
import { ChatSDKError } from "@/lib/errors";
import { chunkContent } from "@/lib/chunking";
import { myProvider } from "@/lib/ai/providers";
import { validateRequest } from "@/utils";
import { z } from "zod";

const uploadSchema = z.object({
  file: z.instanceof(File).optional(),
  url: z.string().optional(),
});
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data: validatedData, errors } = validateRequest(uploadSchema, body);

    if (errors) {
      return NextResponse.json(
        { error: "Invalid request", details: errors },
        { status: 400 },
      );
    }
    const apiKey = req.headers.get("chat-api-key");

    if (!validatedData.file && !validatedData.url) {
      return NextResponse.json(
        { error: "No file or URL provided" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session)
      return new ChatSDKError("unauthorized:auth").toResponse();
    if (!apiKey)
      return new ChatSDKError(
        "unauthorized:auth",
        "Missing API key",
      ).toResponse();

    const isValid = await auth.api.verifyApiKey({ body: { key: apiKey } });
    if (!isValid.valid)
      return new ChatSDKError("forbidden:auth", "Invalid API key").toResponse();

    const documentId = generateUUID();

    const { fileName, fileDataUrl, documentText } = await preparePdfFile(
      validatedData.file ? validatedData.file : (validatedData.url as string),
      documentId,
    );

    const chunks = await chunkContent(documentText);
    const firstChunksText = chunks.slice(0, 5).join(" ");

    const structuredResult = streamObject({
      model: myProvider.languageModel('chat-model'),
      messages: [
        { role: "system", content: extractionPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this engineering document and extract structured data.",
            },
            {
              type: "text",
              text: "Here is the start of the text:\n" + firstChunksText,
            },
            {
              type: "file",
              data: fileDataUrl,
              filename: fileName,
              mediaType: "application/pdf",
            },
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
    return NextResponse.json(
      { error: "Failed to process upload", details: (error as Error).message },
      { status: 500 },
    );
  }
}
