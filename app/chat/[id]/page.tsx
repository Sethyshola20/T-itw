import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getChatById, getMessagesByChatId, getUserAPIKeyByUserId } from '@/lib/db/queries'; 
import { DataStreamHandler } from '@/components/ui/data-stream-handler';
import { auth } from '@/lib/auth';
import Chat from '@/components/ui/chat';
import { myProvider } from '@/lib/ai/providers';
import { convertToUIMessages } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';
import { Toaster } from 'sonner';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  
  const chat = await getChatById({ id }) 

  if (!chat) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
        redirect('/');
  }

  if (chat.visibility === 'private' && session.user.id !== chat.userId) {
      return notFound();
  } 

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const apiKey = await getUserAPIKeyByUserId({
    userId: session.user.id
  })
    
  if (!apiKey) {
    throw new ChatSDKError('unauthorized:chat', 'No API key found');
  }


  const uiMessages = convertToUIMessages(messagesFromDb);
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto max-h-full h-full">
      <Chat documentId={chat.documentId} initialMessage={undefined} session={session} autoResume={true} id={id} key={id} initialChatModel={myProvider.languageModel.name} initialMessages={uiMessages} isReadonly={false} initialVisibilityType="private" apiKey={apiKey}/>
            
      <DataStreamHandler />
      <Toaster/>
    </div>
  );
}