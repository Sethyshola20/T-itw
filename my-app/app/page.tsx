'use client';

import { useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

const uploadSchema = z.object({
  message: z.string().min(1, 'Please enter a question or message'),
  url: z.string().url().optional().or(z.literal('')),
});

export default function DocumentChatPage() {
  const [show, setShow] = useState(true)
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { message: '', url: '' },
  });

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/query',
    }),
  });

  async function handleUpload() {
    if (!files && !form.getValues('url')) return;

    setUploading(true);
    const formData = new FormData();
    if (files && files.length > 0) {
      formData.append('file', files[0]);
    }
    const url = form.getValues('url');
    if (url) formData.append('url', url);

    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFiles(null);
    setShow(false)
    form.reset({ message: '', url: '' });
  }

  async function onSubmit(values: z.infer<typeof uploadSchema>) {
    await sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: values.message }],
    });
    form.reset({ ...values, message: '' });
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-16">
      {show && <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-3">
              <Input
                type="file"
                accept="application/pdf"
                className='cursor-pointer'
                multiple={false}
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) setFiles(e.target.files);
                }}
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
      </Card> }

      <Separator className="my-6" />

      <Card className="shadow-md flex flex-col">
        <CardHeader>
          <CardTitle>Chat About Your Document</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col space-y-4">
          <ScrollArea className="h-[60vh] border rounded-md p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <p className="text-sm font-semibold mb-1">
                  {msg.role === 'user' ? 'You' : 'AI'}
                </p>
                {msg.parts.map((part, i) =>
                  part.type === 'text' ? (
                    <p
                      key={i}
                      className="text-sm whitespace-pre-wrap text-muted-foreground"
                    >
                      {part.text}
                    </p>
                  ) : null
                )}
              </div>
            ))}
          </ScrollArea>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex gap-2 items-center"
            >
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Ask a question about your document..."
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
