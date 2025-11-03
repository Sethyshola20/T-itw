import { PDFParse } from 'pdf-parse'; 
import * as cheerio from 'cheerio';
import { mkdir, access } from 'fs/promises';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { ALLOWED_EXTENSIONS, ALLOWED_TYPES } from '@/lib/constants';
import { chunkContent } from '@/lib/chunking';
import { generateEmbeddings } from '@/lib/embeddings';
import { index, splitText, storeEmbeddings } from '@/lib/embeding';
import { generateUUID } from '@/lib/utils';


export async function preparePdfFile(fileOrUrl: File | string, documentId: string) {
  let filePath = '';
  let fileName = '';
  let fileDataUrl = '';
  let documentText = '';

 
  if (typeof fileOrUrl === 'string') {
    await validatePdfUrl(fileOrUrl);
    fileName = fileOrUrl.split('/').pop() || 'document.pdf';
    filePath = await saveFileFromUrl(fileOrUrl, `${documentId}.pdf`);
    fileDataUrl = await fetchUrlAsDataURL(fileOrUrl);
    documentText = await extractTextFromPdfBuffer(filePath);
  } else {
    await validateFileType(fileOrUrl);
    fileName = fileOrUrl.name;
    filePath = await saveFile(fileOrUrl, `${documentId}.pdf`);
    fileDataUrl = await fileToDataURL(fileOrUrl);
    documentText = await extractTextFromPdfBuffer(filePath);
  }

  return { filePath, fileName, fileDataUrl, documentText };
}

async function extractTextFromPdfBuffer(filePath: string): Promise<string> {
  const fs = await import('fs/promises');
  const buffer = await fs.readFile(filePath);
  const uint8Array = new Uint8Array(buffer);       
  const parser = new PDFParse(uint8Array)
  const parsed = await parser.getText();
  if (!parsed.text?.trim()) throw new Error('No text could be extracted from PDF.');
  return parsed.text;
}


export async function validateFileType(file: File): Promise<string> {
  try {
    const filename = file.name.toLowerCase();
    const mimeType = file.type;
    const hasAllowedExtension = Array.from(ALLOWED_EXTENSIONS).some((ext) =>
      filename.endsWith(`.${ext}`),
    );

    const isMimeAllowed = ALLOWED_TYPES.has(mimeType);

    if (!isMimeAllowed && !hasAllowedExtension) {
      console.log(`Invalid file format. Expected PDF, got: ${mimeType || filename}`,)
      throw new Error(
        `Invalid file format. Expected PDF, got: ${mimeType || filename}`,
      );
    }

    await validateFileHeader(file);

    const extension = filename.split('.').pop() || '';
    return extension;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred during file validation.';
    throw new Error(`File validation failed: ${message}`);
  }
}

export async function validatePdfUrl(url: string): Promise<string> {
  try {
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL.");
    }

    if (!url.toLowerCase().endsWith(".pdf")) {
      console.warn("⚠️ URL does not end with .pdf — verifying content-type...");
    }

    const headResponse = await fetch(url, { method: "HEAD" });
    if (!headResponse.ok) {
      throw new Error(`Can't access URL (${headResponse.status}).`);
    }

    const contentType = headResponse.headers.get("content-type");
    const contentLength = headResponse.headers.get("content-length");

    if (!contentType?.includes("pdf")) {
      throw new Error(`Link is not a PDF (received: ${contentType}).`);
    }

    if (contentLength && Number(contentLength) > 100 * 1024 * 1024) {
      throw new Error("File is too large (>100MB).");
    }

    return url;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error validating PDF : " + error.message);
    }
    throw new Error("Unknown error during PDF validation.");
  }
}


export async function validateFileHeader(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());


  if (
    header[0] === 0x25 && // %
    header[1] === 0x50 && // P
    header[2] === 0x44 && // D
    header[3] === 0x46 // F
  ) {
    return true;
  }

  throw new Error('The uploaded file does not appear to be a valid PDF.');
}


export async function saveFile(file: File, saveAs: string): Promise<string> {
  try {
    const baseDir =
      os.platform() === 'win32' ? 'D:\\' : process.cwd();
    const uploadsDir = path.join(baseDir, 'uploads');
    await ensureDirExists(uploadsDir);

    const filePath = path.resolve(uploadsDir, saveAs);

    const stream = file.stream();
    const nodeStream = Readable.fromWeb(stream as any);
    await pipeline(nodeStream, createWriteStream(filePath));

    return filePath;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unexpected error during file save.';
    throw new Error(`Failed to save file: ${message}`);
  }
}

export async function fileToDataURL(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function fetchUrlAsDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:application/pdf;base64,${base64}`;
}


export async function processPdfFile(fileOrUrl: File | string, metadata: Record<string, any> = {}) {
  try {
    const documentId = generateUUID();
    let text = "";

    if (typeof fileOrUrl === "string") {
      const parser = new PDFParse({ url: fileOrUrl });
      const result = await parser.getText();
      text = result.text;
    } else {
      const bytes = await fileOrUrl.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const parser = new PDFParse(buffer);
      const result = await parser.getText();
      text = result.text;
    }

    if (!text || text.trim().length === 0) {
      throw new Error("No text could be extracted from PDF. It may be scanned or image-only.");
    }

    await storeEmbeddings(documentId, text, metadata);

    return {
      success: true,
      documentId,
      message: "PDF processed and embeddings stored in Pinecone.",
    };
  } catch (error) {
    console.error("[processPdfFile] error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function saveFileFromUrl(url: string, saveAs: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('pdf')) {
      throw new Error(`URL does not point to a valid PDF file. Received: ${contentType}`);
    }

    if (!response.body) throw new Error('Response has no body.');

    const baseDir = os.platform() === 'win32' ? 'D:\\' : '';
    const uploadsDir = path.join(baseDir, 'uploads');

    await mkdir(uploadsDir, { recursive: true });
    
    const nodeStream = Readable.fromWeb(response.body as any); 
    const filePath = path.resolve(uploadsDir, saveAs);
    const fileStream = createWriteStream(filePath);
    
    await pipeline(nodeStream, fileStream);

    return filePath; 
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to save file from URL: ${error.message}`);
    }
    throw new Error('Unknown error occurred while saving file from URL.');
  }
}



export async function ensureDirExists(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  try {
    await access(dir);
  } catch (err) {
    throw new Error(`Cannot access or create directory ${dir}: ${err}`);
  }
}

export async function parsePdf(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);

  const parser = new PDFParse(uint8Array);
  const result = await parser.getText();

  return result.text;

}

export async function extractTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  return $('body').text();
}

