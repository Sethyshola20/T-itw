'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import Chat from '../../components/ui/chat';
import DocumentUploader from '@/components/ui/document-uploader';
import { DataStreamHandler } from '@/components/ui/data-stream-handler';
import { authClient } from '@/lib/auth-client';
import { generateUUID } from '@/lib/utils';
import { myProvider } from '@/lib/ai/providers';


export default function DocumentChatPage() {
  const [showUpload, setShowUpload] = useState(true);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const id = generateUUID();
  const { 
          data: session, 
          isPending, //loading state
          error, //error object
          refetch //refetch the session
      } = authClient.useSession() 
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-16 max-h-full">
      {showUpload && <DocumentUploader setDocumentId={setDocumentId} setShowUpload={setShowUpload}/>}

      <Separator className="my-6" />

      <Chat documentId={documentId} session={session} autoResume={true} id={id} key={id} initialChatModel={myProvider.languageModel.name} initialMessages={[]} isReadonly={false} initialVisibilityType="private"/>
      <DataStreamHandler/>
      <Toaster />
    </div>
  );
}
