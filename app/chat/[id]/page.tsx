import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getChatById, getMessagesByChatId, getUserAPIKeyByUserId } from '@/lib/db/queries'; 
import { DataStreamHandler } from '@/components/ui/data-stream-handler';
import { auth } from '@/lib/auth';
import Chat from '@/components/ui/chat';
import { myProvider } from '@/lib/ai/providers';
import { convertToUIMessages } from '@/lib/utils';
import { toast, Toaster } from 'sonner';


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
      setTimeout(() => {
        toast.error("Could not find your api key")
      }, (2000));
  }

  const uiMessages = convertToUIMessages(messagesFromDb);
  return (
    <div className="flex flex-col rounded bg-sidebar-accent border px-auto my-1.5 mr-1 w-full">
      <Chat documentId={chat.documentId} initialMessage={undefined} session={session} autoResume={true} id={id} key={id} initialChatModel={myProvider.languageModel.name} initialMessages={uiMessages} isReadonly={false} initialVisibilityType="private" apiKey={apiKey}/>
      <DataStreamHandler />
    </div>
  );
}