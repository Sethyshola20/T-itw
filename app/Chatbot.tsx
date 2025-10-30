'use client';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputHeader,
  PromptInputProvider,
} from '@/components/ai-elements/prompt-input';
import { Action, Actions } from '@/components/ai-elements/actions';
import { Fragment, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { CopyIcon, GlobeIcon, MessageSquare, RefreshCcwIcon, ShareIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';


export default function ChatBot(){
const [input, setInput] = useState('');
const [webSearch, setWebSearch] = useState(false);

  const { messages, sendMessage, status, regenerate } = useChat();
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      { 
        text: message.text || 'Sent with attachments',
        files: message.files 
      },
      {
        body: {
          webSearch: webSearch,
        },
      },
    );
    setInput('');
  };


    const handleRetry = () => {};
    const handleCopy = () => {};
    const handleShare = () => {};

    const actions = [
    {
      icon: RefreshCcwIcon,
      label: "Retry",
      onClick: handleRetry,
    },
    {
      icon: CopyIcon,
      label: "Copy",
      onClick: () => handleCopy(),
    },
    {
      icon: ShareIcon,
      label: "Share",
      onClick: () => handleShare(),
    },
  ];

    return (
    <div className="max-w-4xl mx-auto p-6 relative w-full">
      <div className="flex flex-col">
        <Conversation className="h-full">
          <ConversationContent>
             {messages.length === 0 ? (
                <ConversationEmptyState
                    icon={<MessageSquare className="size-12" />}
                    title="No messages yet"
                    description="Start a conversation to see messages here"
                />
                ) : (
             messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </Fragment>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            )))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInputProvider>
            <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
            <PromptInputHeader>
                <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
                <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
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
      </div>
    </div>
  );
};