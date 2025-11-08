import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { google } from "@ai-sdk/google";

export const myProvider = customProvider({
  languageModels: {
    // High-volume, general-purpose chat
    "chat-model": google("gemini-2.5-flash"),

    // Complex reasoning/logic model - requires 2.5 Pro's capabilities
    "chat-model-reasoning": wrapLanguageModel({
      model: google("gemini-2.5-pro"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Title and artifact generation - fine with Flash
    "title-model": google("gemini-2.5-flash"),
    "artifact-model": google("gemini-2.5-flash"),
  },
  imageModels: {
    // State-of-the-art image generation
    "generation-model": google.imageModel("imagen-4-generate"),
  },
});
