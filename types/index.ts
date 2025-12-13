import { z } from "zod";

import type { InferUITool, UIMessage } from "ai";

export const engineeringDeliverableSchema = z.object({
  documentId: z.string(),
  projectName: z.string(),
  projectId: z.string().optional(),
  clientName: z.string(),
  engineeringFirm: z.string(),
  documentType: z.enum([
    "Technical Notice",
    "Electrical Package",
    "Bid Analysis",
    "ACT Comparison",
    "Go / No-Go Report",
    "Other",
  ]),
  submissionDate: z.string(),
  designPhase: z.enum([
    "Preliminary Study",
    "Preliminary Design",
    "Detailed Design",
    "Execution",
    "As-Built",
  ]),
  scopeDescription: z.string(),
  keyMetrics: z
    .object({
      totalCostEstimate: z.number().optional(),
      timelineWeeks: z.number().optional(),
      complianceStatus: z
        .enum(["Compliant", "Non-compliant", "To be verified"])
        .optional(),
    })
    .optional(),
  deliverables: z
    .array(
      z.object({
        deliverableName: z.string(),
        deliverableType: z.string(),
        dueDate: z.string().optional(),
        status: z.enum(["Pending", "Delivered", "Approved", "Rejected"]),
      }),
    )
    .optional(),
  signatures: z
    .array(
      z.object({
        role: z.string(),
        name: z.string(),
        dateSigned: z.string().optional(),
      }),
    )
    .optional(),
  remarks: z.string().optional(),
});

export type EngineeringDeliverableObjectType = z.infer<
  typeof engineeringDeliverableSchema
>;

// AUTHENTICATION

export const signinSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export const signupSchema = z
  .object({
    name: z.string().max(20),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignInFormType = z.infer<typeof signinSchema>;
export type SignupFormType = z.infer<typeof signupSchema>;
export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// TO UPDATE

type CreateDocumentTool = InferUITool<ReturnType<any>>;
type UpdateDocumentTool = InferUITool<ReturnType<any>>;

export type ChatTools = {
  createDocument: CreateDocumentTool;
  updateDocument: UpdateDocumentTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  appendMessage: string;
  id: string;
  title: string;
  clear: null;
  finish: null;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
