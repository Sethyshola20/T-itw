'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Action, Actions } from '@/components/ai-elements/actions';
import ChatBot from '../Chatbot';


const uploadSchema = z.object({
  message: z.string().min(1, 'Please enter a question or message'),
  url: z.string().url().optional().or(z.literal('')),
});

export default function DocumentChatPage() {
  const [showUpload, setShowUpload] = useState(true);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { message: '', url: '' },
  });

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/query',
      body: () => ({ documentId }), // Send documentId with each message
    }),
  });

  // Upload handler for files or URLs
  async function handleUpload() {
    if (!files && !form.getValues('url')) return;
    setUploading(true);
    const formData = new FormData();
    if (files && files.length > 0) {
      formData.append('file', files[0]);
    }
    const url = form.getValues('url');
    if (url) formData.append('url', url);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.documentId) {
        setDocumentId(data.documentId);
        setShowUpload(false);
        toast.success('Document uploaded and processed.');
      } else {
        toast.error('Upload failed.');
      }
    } catch (error) {
      toast.error('Error during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFiles(null);
      form.reset({ message: '', url: '' });
    }
  }

  // Send message handler
  async function handleSendMessage(values: z.infer<typeof uploadSchema>) {
    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: values.message }],
    });
    form.reset({ message: '', url: '' });
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-16">
      {/* Upload Section */}
      {showUpload && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="application/pdf"
                  className="cursor-pointer"
                  multiple={false}
                  ref={fileInputRef}
                  onChange={(e) =>
                    e.target.files && setFiles(e.target.files)
                  }
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Or enter a document URL..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : 'Upload Source'}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      <ChatBot/>
      <Toaster />
    </div>
  );
}
