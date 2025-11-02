'use client';

import { useEffect, useState, Fragment, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { unstable_serialize } from 'swr/infinite';
import { toast } from 'sonner';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Loader } from '@/components/ai-elements/loader';
import {
  PromptInput,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputBody,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { ChatHeader } from '@/components/ui/chat-header';
import {
  CopyIcon,
  RefreshCcwIcon,
  GlobeIcon,
  ShareIcon,
  MessageSquare,
  CheckIcon,
} from 'lucide-react';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import type { ChatMessage } from '@/types';
import type { Vote } from '@/lib/db/schema';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { VisibilityType } from './visibility-selector';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { ChatSDKError } from '@/lib/errors';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { Actions, Action } from '@/components/ai-elements/actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Chat({
  id,
  initialMessage,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  documentId,
  isReadonly,
  session,
  autoResume,
  apiKey,
}: {
  id: string;
  initialMessage: any;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  documentId: string | null;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: any;
  autoResume: boolean;
  apiKey: string;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages || [],
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: initialChatModel,
            selectedVisibilityType: visibilityType,
            documentId,
            ...body,
          },
        };
      },
    }),
    onFinish: () => mutate(unstable_serialize(getChatHistoryPaginationKey)),
    onError: (error) => {
      if (error instanceof ChatSDKError) toast.error(error.message);
    },
  });

  useEffect(() => {
    if (
      documentId &&
      initialMessage &&
      messages.length === 0 &&
      initialMessages.length === 0
    ) {
      const jsonText = JSON.stringify(initialMessage, undefined, 2);
      const text = `I've successfully loaded the document! Here’s the raw data:\n\n\`\`\`json\n${jsonText}\n\`\`\``;
      setMessages([
        { id: generateUUID(), role: 'assistant', parts: [{ type: 'text', text }] },
      ]);
    }
  }, [documentId, initialMessages.length, initialMessage, messages.length, setMessages]);

  useEffect(() => {
    window.history.replaceState({}, '', `/chat/${id}`);
  }, [id]);

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: message.text! }] });
    setInput('');
  };

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/chat/vote?chatId=${id}` : null,
    fetcher,
  );

  useAutoResume({ autoResume, initialMessages, resumeStream, setMessages });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  return (
    <TooltipProvider>
      <div className="flex flex-col w-full h-screen bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={visibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent"
        >
          <Conversation>
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="No messages yet"
                  description="Start a conversation to see messages here"
                />
              ) : (
                messages.map((message) => (
                  <Fragment key={message.id}>
                    <Message from={message.role}>
                      <MessageContent>
                        <Response>
                          {message.parts
                            .map((part) =>
                              part?.type === 'text'
                                ? (part as any).text
                                : (part as any).delta || '',
                            )
                            .join(' ')}
                        </Response>
                      </MessageContent>
                    </Message>

                    {message.role === 'assistant' && (
                      <MessageActions
                        text={message.parts
                          .map(
                            (p) => (p as any).text || (p as any).delta || '',
                          )
                          .join(' ')}
                        onRegenerate={regenerate}
                      />
                    )}
                  </Fragment>
                ))
              )}

              {status === 'submitted' && <Loader />}
            </ConversationContent>
          </Conversation>
        </div>

        {!isReadonly && (
          <PromptInputProvider>
            <PromptInput
              onSubmit={handleSubmit}
              className="sticky bottom-0 border-t bg-background py-2"
            >
              <PromptInputBody>
                <PromptInputTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                />
              </PromptInputBody>

              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputButton
                    variant={webSearch ? 'default' : 'ghost'}
                    onClick={() => setWebSearch(!webSearch)}
                  >
                    <GlobeIcon size={16} />
                    <span>Search</span>
                  </PromptInputButton>
                </PromptInputTools>

                <PromptInputSubmit disabled={!input && !status} status={status} />
              </PromptInputFooter>
            </PromptInput>
          </PromptInputProvider>
        )}
      </div>
    </TooltipProvider>
  );
}


function MessageActions({
  text,
  onRegenerate,
}: {
  text: string;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Chat link copied to clipboard!');
    } catch {
      toast.info('Share feature coming soon.');
    }
  };

  return (
    <Actions className="mt-1 mb-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Action label="Retry" onClick={onRegenerate}>
            <RefreshCcwIcon className="size-3" />
          </Action>
        </TooltipTrigger>
        <TooltipContent side="top">Retry</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Action label={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
            {copied ? (
              <CheckIcon className="size-3 transition-all" />
            ) : (
              <CopyIcon className="size-3" />
            )}
          </Action>
        </TooltipTrigger>
        <TooltipContent side="top">{copied ? 'Copied!' : 'Copy'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
            <Action label="Share" onClick={handleShare}>
              <ShareIcon className="size-3" />
            </Action>
        </TooltipTrigger>
        <TooltipContent side="top">Share</TooltipContent>
      </Tooltip>
    </Actions>
  );
}
