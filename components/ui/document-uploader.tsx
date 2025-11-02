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
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { EngineeringDeliverableObjectType, engineeringDeliverableSchema } from '@/types';
import { Loader } from '../ai-elements/loader';
import { UploadCloud, LinkIcon } from "lucide-react";

export default function DocumentUploader({
  setDocumentId,
  setShowUpload,
  setInitialMessage,
  apiKey,
}: {
  setDocumentId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowUpload: React.Dispatch<React.SetStateAction<boolean>>;
  setInitialMessage: React.Dispatch<React.SetStateAction<EngineeringDeliverableObjectType | undefined>>;
  apiKey: string;
}) {
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { object, submit, isLoading, stop } = useObject({
    api: '/api/chat/files/upload',
    schema: engineeringDeliverableSchema,
    headers: { 'chat-api-key': apiKey },
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
      file: files?.length ? await fileToBase64(files[0]) : null,
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
  }

  useEffect(() => {
    if (object?.documentId) {
      setDocumentId(object.documentId);
      setShowUpload(false);
      setInitialMessage(object as EngineeringDeliverableObjectType);
      toast.success('Document processed successfully!');
    }
  }, [object, setDocumentId, setShowUpload]);

  return (
    <div className="flex justify-center items-center w-full">
      <Card className="mb-6 shadow-xl border border-border/50 rounded-2xl w-full max-w-lg backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Document Upload
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Upload your engineering document or provide a URL to start the AI analysis.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group border-2 border-dashed border-muted-foreground/40 hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center"
              >
                <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  {files?.length ? files[0].name : "Click or drag a PDF file to upload"}
                </p>
                <Input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  multiple={false}
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && setFiles(e.target.files)}
                />
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                        <Input
                          placeholder="Or enter a document URL..."
                          className="pl-10 rounded-xl"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="
                    w-full py-5 rounded-xl font-medium 
                    transition-transform 
                    hover:scale-[1.02] 
                    hover:shadow-lg 
                    active:scale-[0.98]
                  "
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      Processing Document... <Loader />
                    </span>
                  ) : (
                    "Start Analysis"
                  )}
                </Button>

                {isLoading && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => stop()}
                    className="w-full rounded-xl"
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
