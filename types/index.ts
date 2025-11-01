import { z } from 'zod';
import type { createDocument } from '@/lib/ai/tools/create-document';
import type { updateDocument } from '@/lib/ai/tools/update-document';

import type { InferUITool, UIMessage } from 'ai';

export const engineeringDeliverableSchema = z.object({
  documentId:z.string(),
  projectName: z.string(),
  projectId: z.string().optional(),
  clientName: z.string(),
  engineeringFirm: z.string(),
  documentType: z.enum([
    "Notice Technique",
    "Pack ELEC",
    "Analyse Offre",
    "Comparaison ACT",
    "Go/No Go Rapport",
    "Autre"
  ]),
  submissionDate: z.string(),        
  designPhase: z.enum([
    "Étude préliminaire",
    "Avant-projet",
    "Projet",
    "Exécution",
    "As-built"
  ]),
  scopeDescription: z.string(),
  keyMetrics: z.object({
    totalCostEstimate: z.number().optional(),
    timelineWeeks: z.number().optional(),
    complianceStatus: z.enum(["Conforme", "Non conforme", "À vérifier"]).optional()
  }).optional(),
  deliverables: z.array(z.object({
    deliverableName: z.string(),
    deliverableType: z.string(),
    dueDate: z.string().optional(),
    status: z.enum(["En attente", "Livré", "Validé", "Refusé"])
  })).optional(),
  signatures: z.array(z.object({
    role: z.string(),         
    name: z.string(),
    dateSigned: z.string().optional()
  })).optional(),
  remarks: z.string().optional()
});

export type EngineeringDeliverableObjectType = z.infer<typeof engineeringDeliverableSchema>




// AUTH

export const signinSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});
export const signupSchema = z.object({
  name: z.string().max(20),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


export type SignInFormType = z.infer<typeof signinSchema>
export type SignupFormType = z.infer<typeof signupSchema>
export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;


type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;


export type ChatTools = {
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
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
