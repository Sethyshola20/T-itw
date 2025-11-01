'use client';

import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useChat } from '@ai-sdk/react';
import { DataUIPart, DefaultChatTransport, FileUIPart } from 'ai';
import { useRouter, useSearchParams } from 'next/navigation';
import { unstable_serialize } from 'swr/infinite';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
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
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputHeader,
  PromptInputBody,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { ChatHeader } from '@/components/ui/chat-header';
import { toast } from 'sonner';
import { CopyIcon, RefreshCcwIcon, GlobeIcon, ShareIcon, MessageSquare } from 'lucide-react';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import type { ChatMessage, Attachment, CustomUIDataTypes, EngineeringDeliverableObjectType } from '@/types';
import type { Vote } from '@/lib/db/schema';
import { Artifact, ChatArtifact } from '@/components/ai-elements/artifact';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { VisibilityType } from './visibility-selector';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useDataStream } from './data-stream-provider';
import { ChatSDKError } from '@/lib/errors';
import { getChatHistoryPaginationKey } from './sidebar-history';
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
}: {
  id: string;
  initialMessage: EngineeringDeliverableObjectType | undefined;
  initialMessages: ChatMessage[],
  initialChatModel: string;
  documentId:string | null;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: any;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [webSearch, setWebSearch] = useState(false);

  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: [],
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
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },

    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast.error(error.message)
      }
    },
  });


  useEffect(() => {
      if (documentId && initialMessage && messages.length === 0 && initialMessages.length === 0) {

          const jsonText = JSON.stringify(initialMessage, undefined, 2);

          const text = `${"I've successfully loaded the document!, here is a summary in json format" + '\n\n' }Here’s the raw data:\n\n\`\`\`json\n${jsonText}\n\`\`\``;
         

          setMessages([
            {
              id: generateUUID(),
              role: 'assistant',
              parts: [{ type: 'text', text }],
            },
          ]);

      }
  }, [documentId,initialMessages.length, initialMessage, messages.length, setMessages]);

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const handleSubmit = (message: PromptInputMessage) => {
    sendMessage({ role: 'user', parts: [{ type: 'text', text: message.text! }] });
    setInput('');
    setAttachments([]);
  };

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/chat/vote?chatId=${id}` : null,
    fetcher,
  );
  
  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <div className="flex flex-col w-full bg-background">
      <ChatHeader
        chatId={id}
        selectedModelId={initialChatModel}
        selectedVisibilityType={visibilityType}
        isReadonly={isReadonly}
        session={session}
      />
        <Conversation className="flex-1 overflow-y-auto">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="No messages yet"
                description="Start a conversation to see messages here"
              />
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    <Response>{message.parts.map((part) => {
                      if (part && typeof part === 'object') {
                        if ('text' in part && typeof (part as any).text === 'string') return (part as any).text;
                        if ('delta' in part && typeof (part as any).delta === 'string') return (part as any).delta;
                      }
                      return '';
                    }).join(' ')}</Response>
                  </MessageContent>
                </Message>
              ))
            )}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        {!isReadonly && (
          <PromptInputProvider>
            <PromptInput onSubmit={handleSubmit} className="mt-4 bottom-0 bg-background border-t sticky" multiple>
              <PromptInputHeader>
                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
              </PromptInputHeader>
              <PromptInputBody>
                <PromptInputTextarea value={input} onChange={(e) => setInput(e.target.value)} />
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
        <ChatArtifact
          chatId={id}
          messages={messages}
          setMessages={setMessages}
          attachments={attachments}
          setAttachments={setAttachments}
          sendMessage={sendMessage}
          stop={stop}
          regenerate={regenerate}
          votes={votes}
          status={status}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />
      </div>
  );
}
