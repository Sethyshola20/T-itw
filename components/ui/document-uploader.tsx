"use client"

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
import { toast } from "sonner"
import { useState, useRef, useEffect } from "react"
import { z } from "zod"
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { EngineeringDeliverableObjectType, engineeringDeliverableSchema } from '@/types';
import { Loader } from '../ai-elements/loader';

export default function DocumentUploader({ setDocumentId, setShowUpload, setInitialMessage, apiKey }: { setDocumentId: React.Dispatch<React.SetStateAction<string | null>>, setShowUpload:React.Dispatch<React.SetStateAction<boolean>>, setInitialMessage: React.Dispatch<React.SetStateAction<EngineeringDeliverableObjectType | undefined>>, apiKey: string }){
  
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
    
  const { object, submit, isLoading, stop } = useObject({
    api: '/api/chat/files/upload',
    schema: engineeringDeliverableSchema,
    headers: {
      'chat-api-key': apiKey, 
    },
  });

  const uploadSchema = z.object({
    url: z.string().url().optional().or(z.literal('')),
  });

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { url: '' },
  });

  async function fileToBase64(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    return `data:${file.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
  }

  async function handleUpload() {
    if (!files && !form.getValues('url')) {
      toast.error('Please select a file or provide a URL.');
      return;
    }

    const payload = {
      url: form.getValues('url') || null,
      file: files && files.length > 0 ? await fileToBase64(files[0]) : null,
    };

    try {
      submit(payload);
    } catch (error) {
      toast.error(`Error uploading document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFiles(null);
      form.reset({ url: '' });
    }
  };


  useEffect(() => {
    if (object?.documentId) {
      setDocumentId(object.documentId);
      setShowUpload(false);
      setInitialMessage(object as EngineeringDeliverableObjectType)
      toast.success('Document processed successfully!');
    }

  }, [object, setDocumentId, setShowUpload]);

    return (
      <div className='flex justify-center items-center size-full'>
        <Card className="mb-6 shadow-lg h-fit w-full">
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
                  onChange={(e) => e.target.files && setFiles(e.target.files)}
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
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <span>Processing Document...<Loader/></span> : 'Start Analysis'}
                </Button>
                {isLoading && (
                  <Button type="button" variant="outline" onClick={() => stop()}>
                    Stop
                  </Button>
                )}
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
  );
}
