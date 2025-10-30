import { NextResponse } from 'next/server';
import { generateObject, ModelMessage } from 'ai';
import { extractTextFromPdf, extractTextFromUrl, parsePdf, saveFile, saveFileFromUrl, validateFileType, validatePdfUrl } from '@/helper';
import { engineeringDeliverableSchema } from '@/types';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { storeEmbeddings } from '@/lib/embeding';
import { generateUUID } from '@/lib/utils';


export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;


    if (!file && !url) {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
    }

    let documentText = '';
    let filePath = ''
    const documentId = generateUUID()

    if (file) {
      await validateFileType(file);
      const pdfBuffer = await parsePdf(file);
      filePath = await saveFile(file, `${documentId}.pdf`);
      documentText = await extractTextFromPdf(pdfBuffer);
    } else if (url) {
      await validatePdfUrl(url);
      filePath = await saveFileFromUrl(url, `${documentId}.pdf`);
      documentText = await extractTextFromUrl(url);
    }

    const messages: ModelMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Analyze this engineering document and extract structured data:\n\n${documentText}` },
        ],
      },
    ];

    const result = await generateObject({
      model: 'openai/gpt-4.1',
      system: SYSTEM_PROMPT,
      schema: engineeringDeliverableSchema,
      messages,
    });
    
    await storeEmbeddings(documentId, documentText, {
      projectName: result.object.projectName,
      documentType: result.object.documentType,
      engineeringFirm: result.object.engineeringFirm,
      filePath, 
    });


    return NextResponse.json({ data: result.object, documentId }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process upload', details: (error as Error).message },
      { status: 500 },
    );
  }
}
