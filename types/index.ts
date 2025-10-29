import { z } from 'zod';

export const engineeringDeliverableSchema = z.object({
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
