"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { unstable_serialize } from "swr/infinite";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  PromptInput,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputBody,
  PromptInputTools,
  PromptInputButton,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { ChatHeader } from "@/components/ui/chat-header";
import {
  CopyIcon,
  RefreshCcwIcon,
  GlobeIcon,
  ShareIcon,
  CheckIcon,
  MessageSquare,
  MicIcon,
} from "lucide-react";
import { Loader } from "@/components/ai-elements/loader";
import { Actions, Action } from "@/components/ai-elements/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/types";
import type { Vote } from "@/lib/db/schema";
import { VisibilityType } from "./visibility-selector";

const defaultSuggestions = [
  "Summarize this engineering document",
  "Highlight the key specifications and requirements",
  "Generate a checklist for project implementation",
  "Identify potential risks and mitigation strategies",
  "Convert this technical report into a concise executive summary",
  "Suggest improvements or optimizations in the design",
  "Create a diagram or workflow based on this document",
  "Compare this deliverable with industry best practices",
  "Extract action items from this report",
  "Provide a step-by-step implementation plan",
];

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mutate } = useSWRConfig();

  const [input, setInput] = useState("");

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
      api: "/api/chat",
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
      setMessages([
        {
          id: generateUUID(),
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "I could not find relevant information for that question in this document.",
            },
          ],
        },
      ]);
      toast.error(error instanceof Error ? error.message : "Unexpected error");
    },
  });

  useAutoResume({ autoResume, initialMessages, resumeStream, setMessages });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  useEffect(() => {
    if (
      documentId &&
      initialMessage &&
      messages.length === 0 &&
      initialMessages.length === 0
    ) {
      const jsonText = JSON.stringify(initialMessage, null, 2);
      const text = `I've loaded your document successfully! Here’s the data:\n\n\`\`\`json\n${jsonText}\n\`\`\``;
      setMessages([
        {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text", text }],
        },
      ]);
    }
  }, [
    documentId,
    initialMessages.length,
    initialMessage,
    messages.length,
    setMessages,
  ]);

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: message.text }],
    });
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput("");
    sendMessage({ role: "user", parts: [{ type: "text", text: suggestion }] });
  };

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/chat/vote?chatId=${id}` : null,
    fetcher,
  );

  return (
    <div className="max-h-[98vh]">
      <div className="flex flex-col h-full">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={visibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent"
        >
          <Conversation>
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="No messages yet"
                  description="Start chatting to see messages here"
                />
              ) : (
                messages.map((message, index) => (
                  <div className="message-wrapper" key={index}>
                    <Message from={message.role}>
                      <MessageContent>
                        <Response>
                          {message.parts
                            .map(
                              (p) => (p as any).text || (p as any).delta || "",
                            )
                            .join(" ")}
                        </Response>
                      </MessageContent>

                      {/* Only show avatar for user messages */}
                      {message.role === "user" && (
                        <MessageAvatar
                          name="You"
                          src="https://github.com/haydenbleasel.png"
                        />
                      )}
                    </Message>

                    {message.role === "assistant" && (
                      <MessageActions
                        text={message.parts
                          .map((p) => (p as any).text || (p as any).delta || "")
                          .join(" ")}
                        onRegenerate={regenerate}
                      />
                    )}
                  </div>
                ))
              )}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {!isReadonly && (
          <div className="border-t">
            <Suggestions className="p-4">
              {defaultSuggestions.map((s) => (
                <Suggestion
                  key={s}
                  suggestion={s}
                  onClick={() => handleSuggestionClick(s)}
                />
              ))}
            </Suggestions>

            <PromptInputProvider>
              <div className="px-4 pb-4">
                <PromptInput onSubmit={handleSubmit} className="w-full">
                  <PromptInputBody>
                    <PromptInputTextarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                    />
                  </PromptInputBody>

                  <PromptInputFooter>
                    <PromptInputTools>
                      <PromptInputActionMenu>
                        <PromptInputActionMenuContent></PromptInputActionMenuContent>
                      </PromptInputActionMenu>
                    </PromptInputTools>

                    <PromptInputSubmit
                      disabled={!input.trim() || status === "streaming"}
                      status={status}
                    />
                  </PromptInputFooter>
                </PromptInput>
              </div>
            </PromptInputProvider>
          </div>
        )}
      </div>
    </div>
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
      toast.success("Chat link copied!");
    } catch {
      toast.info("Share feature coming soon.");
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
        <TooltipContent>Retry</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Action label={copied ? "Copied!" : "Copy"} onClick={handleCopy}>
            {copied ? (
              <CheckIcon className="size-3" />
            ) : (
              <CopyIcon className="size-3" />
            )}
          </Action>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Action label="Share" onClick={handleShare}>
            <ShareIcon className="size-3" />
          </Action>
        </TooltipTrigger>
        <TooltipContent>Share</TooltipContent>
      </Tooltip>
    </Actions>
  );
}
