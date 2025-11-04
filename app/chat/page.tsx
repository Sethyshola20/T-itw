'use client';

import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import Chat from '../../components/ui/chat';
import DocumentUploader from '@/components/ui/document-uploader';
import { DataStreamHandler } from '@/components/ui/data-stream-handler';
import { authClient } from '@/lib/auth-client';
import { generateUUID } from '@/lib/utils';
import { myProvider } from '@/lib/ai/providers';
import { EngineeringDeliverableObjectType } from '@/types';
import { ChatSDKError } from '@/lib/errors';
import { useKey } from '@/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SignOut } from '@/lib/sign-in';

export default function DocumentChatPage() {
  const [showUpload, setShowUpload] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<EngineeringDeliverableObjectType>()

  const router = useRouter()
  const id = generateUUID();
  
  const { data: session } = authClient.useSession() 
  
  const apiKey = useKey(state=> state.apiKey)
  
  if (!apiKey) {
      setTimeout(() => {
        toast.error("Could not find your api key")
        SignOut()
      }, (2000));
  }
  return (
    <div className="flex flex-col items-center justify-center  mx-auto py-16 max-h-full h-full">
      {showUpload ? <DocumentUploader setDocumentId={setDocumentId} setShowUpload={setShowUpload} setInitialMessage={setInitialMessage} apiKey={apiKey}/> :
      <Chat documentId={documentId} session={session} autoResume={true} id={id} key={id} initialChatModel={myProvider.languageModel.name} initialMessages={[]} initialMessage={initialMessage} isReadonly={false} initialVisibilityType="private" apiKey={apiKey}/>}
      <DataStreamHandler/>
      <Toaster />
    </div>
  );
}
