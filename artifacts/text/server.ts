import { LanguageModel, smoothStream, streamText } from "ai";

import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { openai } from "@ai-sdk/openai";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifiacts/server";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: myProvider.languageModel("chat-model"),
      system:
        "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      const { text }: any = delta;

      draftContent += text;

      dataStream.write({
        type: "data-textDelta",
        data: text,
        transient: true,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      model: myProvider.languageModel("chat-model"),
      system: updateDocumentPrompt(document.content, "text"),
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: description,
      providerOptions: {
        openai: {
          prediction: {
            type: "content",
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      const { text }: any = delta;

      draftContent += text;

      dataStream.write({
        type: "data-textDelta",
        data: text,
        transient: true,
      });
    }

    return draftContent;
  },
});
