import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import { after } from "next/server";
import { ZodError, ZodSchema } from "zod";

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL",
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export function validateRequest<T>(schema: ZodSchema<T>, data: any) {
  try {
    const validatedData = schema.parse(data);
    return { data: validatedData, errors: null };
  } catch (error) {
    console.log({ zodError: error });
    if (error instanceof ZodError) {
      return {
        data: null,
        errors: {
          message: "Validation failed",
          details: error.flatten().fieldErrors
        }
      };
    }
    throw error;
  }
}
