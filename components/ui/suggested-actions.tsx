'use client';

import { motion } from 'framer-motion';
import { Button } from './button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/types';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const suggestedActions = [
  {
    title: 'Find me a place',
    label: 'in Lisbon near the beach',
    action: 'Find me a place to stay in Lisbon near the beach',
  },
  {
    title: 'I want a cabin',
    label: 'in the mountains for 2 people',
    action: 'I want a cabin in the mountains for 2 people',
  },
  {
    title: 'Suggest romantic getaways',
    label: 'in Italy under $200/night',
    action: 'Suggest romantic Airbnb getaways in Italy under $200 per night',
  },
  {
    title: 'Plan a trip',
    label: 'for a group of 5 in Tokyo',
    action: 'Find me an Airbnb for a group of 5 in Tokyo',
  },
  {
    title: 'I need something cozy',
    label: 'in Paris this fall',
    action: 'I need a cozy Airbnb in Paris this fall, ideally in a walkable neighborhood',
  },
];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
