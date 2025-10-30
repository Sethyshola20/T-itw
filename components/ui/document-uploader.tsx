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

export default function DocumentUploader({setDocumentId, setShowUpload}:{setDocumentId:React.Dispatch<React.SetStateAction<string | null>>, setShowUpload:React.Dispatch<React.SetStateAction<boolean>>
}){
  
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
    const formData = new FormData();
    if (files && files.length > 0) {
      formData.append('file', files[0]);
    }
    const url = form.getValues('url');
    if (url) formData.append('url', url);
    try {
      const res = await fetch('/api/chat/files/upload', {
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
                  {uploading ? 'Uploading...' : 'Upload Source'}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
    )
}