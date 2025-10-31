import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries'; // Removed isSubscribed
import { DataStreamHandler } from '@/components/ui/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';
import { auth } from '@/lib/auth';
import Chat from '@/components/ui/chat';

// We assume the chat type includes the linked document ID from the database
interface ChatWithDocument {
    id: string;
    userId: string;
    visibility: 'public' | 'private';
    documentId: string | null; // The RAG identifier
    // ... other chat fields
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  
  // Retrieve chat data
  const chat = await getChatById({ id }) 

  if (!chat) {
    // If chat does not exist, use notFound()
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
  })

  
  // --- Authentication and Authorization Checks (Matching your structure) ---

  if (chat.visibility === 'private') {
    if (!session) {
      // If private, redirect if no session
      redirect('/');
    }
    if (session.user.id !== chat.userId) {
      // If private and not the owner, use notFound()
      return notFound();
    }
  } else {
    // For public chats, if there is no session, we still allow viewing (read-only)
    if (!session) {
      // If no session, we still allow access, but the user won't be able to chat
    }
  }


  // --- Data Retrieval ---
  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  
  // 1. EXTRACT the linked document ID from the chat record
  const initialDocumentId = chat.documentId; 

  // Determine if the chat should be read-only
  const isReadonly = !session || (session.user.id !== chat.userId);

  // --- Rendering ---
  const chatProps = {
    id: chat.id,
    initialMessages: uiMessages,
    initialVisibilityType: chat.visibility,
    isReadonly: isReadonly, // Set based on session and ownership
    session: session,
    autoResume: true,
    // 2. PASS the document ID to the Chat component for RAG
    initialDocumentId: initialDocumentId, 
  };

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          {...chatProps}
          initialChatModel={DEFAULT_CHAT_MODEL}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        {...chatProps}
        initialChatModel={chatModelFromCookie.value}
      />
      <DataStreamHandler />
    </>
  );
}