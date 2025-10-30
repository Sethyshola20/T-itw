import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { openai } from "@ai-sdk/openai"

export const myProvider = isDevelopmentEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai('chatgpt-4o-latest'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('grok-2-1212'),
        'artifact-model': openai('grok-2-1212'),
      },
      imageModels: {
        'small-model': openai.imageModel('grok-2-image'),
      },
    });