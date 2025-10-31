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
import { useState, useRef } from "react"
import { z } from "zod"
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader } from '../ai-elements/loader';

export default function DocumentUploader({ setDocumentId, setShowUpload}:{ setDocumentId: React.Dispatch<React.SetStateAction<string | null>>, setShowUpload:React.Dispatch<React.SetStateAction<boolean>> }){
  
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadSchema = z.object({
    message: z.string().min(1, 'Please enter a question or message'),
    url: z.string().url().optional().or(z.literal('')),
  });
  

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { message: '', url: '' },
  });

  async function handleUpload() {
    if (!files && !form.getValues('url')) return;

    setUploading(true);

    const toastId = toast.loading('1/3: Starting secure document upload...');

    const formData = new FormData();
    if (files && files.length > 0) {
      formData.append('file', files[0]);
    }
    const url = form.getValues('url');
    if (url) formData.append('url', url);

    let finalDocumentId: string | null = null;
    let success = false;
    
    try {
      const res = await fetch('/api/chat/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        throw new Error('Server upload failed.');
      }
      
      toast.info('2/3: Analyzing content and creating embeddings (this may take a minute for large files)...', {id: toastId});

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = ''; 

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete part

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonString = line.substring(5).trim();
            
            try {
              const chunk = JSON.parse(jsonString);
              
              if (chunk.type === 'data-metadata') {
                finalDocumentId = chunk.data.documentId;
                
                toast.info('3/3: Document summary received. Finalizing chat.', {id: toastId});
                success = true;
              }
            } catch (e) {
              console.error('Failed to parse stream JSON:', e);
            }
          }
        }
      }
      if (success && finalDocumentId) {
        setDocumentId(finalDocumentId);
        setShowUpload(false);
        toast.success('Document processed and summary displayed. You can now ask questions about the document.', {id: toastId});
      } else {
        throw new Error('Upload completed but document ID was not received in the stream.');
      }
    } catch (error) {
      toast.error(`Error during upload: ${error instanceof Error ? error.message : 'Unknown error.'}`, {id: toastId});
      success = false;
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFiles(null);
      form.reset({ message: '', url: '' });
    }
  }

    return(
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
                  {uploading ? 'Processing Document...' : 'Start Analysis'}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
    )
}