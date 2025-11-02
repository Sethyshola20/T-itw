"use client"

import { ConnectionDialog } from "@/components/ConnectionDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from '@/lib/auth-client';
import { Loader } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"


export default function Home() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-slate-900">
        <h1 className="text-3xl md:text-4xl font-semibold mb-6">
          Preparing your workspace...
        </h1>
        <Loader className="w-6 h-6 animate-spin text-slate-400" />
        <Toaster />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">

      <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-100 to-purple-200 rounded-full blur-3xl opacity-40"></div>


      <section className="relative z-10 max-w-4xl mx-auto text-center py-20">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6">
          Understand Your Engineering Docs with AI
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          An intelligent assistant that summarizes, compares, and reasons through complex
          building documentation — so your engineering team can move faster with confidence.
        </p>

        {error || !session ? (
          <ConnectionDialog />
        ) : (
          <Button
            asChild
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-medium shadow-md hover:shadow-lg transition"
          >
            <Link href="/chat">Launch Assistant</Link>
          </Button>
        )}
      </section>

      <section className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-24">
        <div className="p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200 text-left shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Summarize</h3>
          <p className="text-slate-600 text-sm">
            Extract key technical details, project specs, and constraints from large documentation sets in seconds.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200 text-left shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Research</h3>
          <p className="text-slate-600 text-sm">
            Search across multiple documents, standards, or sections — and get contextual answers instantly.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200 text-left shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Act</h3>
          <p className="text-slate-600 text-sm">
            Generate action items, compliance checks, and structured insights using an agentic workflow.
          </p>
        </div>
      </section>

      
      {/* --- FAQ Section for Temelion team --- */}
      <section className="relative z-10 w-4xl mx-auto py-24 border-t border-slate-100">
        <h2 className="text-4xl font-semibold text-center mb-12">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-medium text-left">
              What’s the goal of this project?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600">
              This project is designed as a prototype demonstrating an AI workflow that mirrors
              Temelion’s mission — helping engineering firms understand and act on documentation faster.
              It shows how LLMs and structured reasoning can augment pre-construction analysis.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-medium text-left">
              How does it connect to Temelion’s value proposition?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600">
              Temelion focuses on automating the reading, summarizing, and decision-making process for
              tender documentation. This assistant follows that exact direction: document ingestion,
              contextual understanding, and agentic task sequencing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-medium text-left">
              What technologies are used?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600">
              The prototype runs on Next.js (frontend), integrates with a local document parser
              (PDF/Docx ingestion), and uses a Retrieval-Augmented Generation pipeline powered by
              modern LLM APIs. The UI leverages shadcn/ui for a clean, maintainable design.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-medium text-left">
              What’s next if developed further?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600">
              It could evolve into a domain-specialized assistant integrated directly into Temelion’s
              platform — supporting workflows like Go/No-Go analysis, technical compliance checks,
              and document comparison for ACT phases.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center text-sm text-slate-500 py-8 border-t border-slate-100">
        © {new Date().getFullYear()} Document Intelligence — Empowering Smarter Engineering
      </footer>

      <Toaster />
    </main>
  );
}
